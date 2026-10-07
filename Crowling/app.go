package main

import (
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type NewsItem struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Summary     string `json:"summary"`
	Press       string `json:"press"`
	PublishedAt string `json:"publishedAt"`
	Url         string `json:"url"`
}

func (a *App) CrawlNews(keyword string) ([]NewsItem, error) {
	start := time.Now()
	log.Printf("[1/5] 검색 시작: 키워드=%s", keyword)

	trimmed := strings.TrimSpace(keyword)
	if trimmed == "" {
		return []NewsItem{}, nil
	}

	targetURL := fmt.Sprintf("https://search.naver.com/search.naver?where=news&query=%s&sm=tab_opt&sort=0", url.QueryEscape(trimmed))
	log.Printf("[2/5] 요청 URL 생성 완료: %s", targetURL)

	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		log.Printf("[ERROR] Request 생성 실패: %v", err)
		return nil, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
	req.Header.Set("Accept-Encoding", "gzip, deflate")
	req.Header.Set("Referer", "https://www.naver.com/")
	req.Header.Set("Connection", "close")

	log.Printf("[3/5] 네이버 서버로 HTTP 요청 전송 중...")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] HTTP 요청 실패 또는 2초 타임아웃 걸림: %v (소요시간: %v)", err, time.Since(start))
		return nil, err
	}
	defer resp.Body.Close()

	log.Printf("[4/5] 네이버 응답 수신 성공! 상태코드=%d, 본문 파싱 시작", resp.StatusCode)

	var reader io.Reader = resp.Body
	if strings.Contains(resp.Header.Get("Content-Encoding"), "gzip") {
		gzReader, err := gzip.NewReader(resp.Body)
		if err == nil {
			defer gzReader.Close()
			reader = gzReader
		}
	}

	doc, err := goquery.NewDocumentFromReader(reader)
	if err != nil {
		log.Printf("[ERROR] HTML 파싱 실패: %v", err)
		return nil, err
	}

	var newsList []NewsItem
	idCounter := 1
	const maxCount = 3

	doc.Find("div[class*='te5kU_'], div.news_wrap, li.bx").EachWithBreak(func(i int, s *goquery.Selection) bool {
		if len(newsList) >= maxCount {
			return false
		}

		titleElem := s.Find("a[data-heatmap-target='.tit'], a[data-nlog-area$='.tit']")
		if titleElem.Length() == 0 {
			titleElem = s.Find("a.news_tit")
		}

		title := strings.TrimSpace(titleElem.Find("span").First().Text())
		if title == "" {
			title = strings.TrimSpace(titleElem.Text())
		}
		title = strings.ReplaceAll(title, "새 창 열림", "")
		title = strings.TrimSpace(title)

		articleUrl, _ := titleElem.Attr("href")
		if title == "" || articleUrl == "" {
			return true
		}

		press := strings.TrimSpace(s.Find("div.sds-comps-profile-info-title a span").First().Text())
		if press == "" {
			press = strings.TrimSpace(s.Find("a.info.press").Text())
		}
		if press == "" {
			press = "언론사"
		}

		bodyElem := s.Find("a[data-heatmap-target='.body'], a[data-nlog-area$='.body']")
		if bodyElem.Length() == 0 {
			bodyElem = s.Find("div.dsc_wrap a, .news_dsc")
		}
		summary := strings.TrimSpace(bodyElem.Find("span").First().Text())
		if summary == "" {
			summary = strings.TrimSpace(bodyElem.Text())
		}
		summary = strings.ReplaceAll(summary, "새 창 열림", "")
		summary = strings.TrimSpace(summary)

		publishedAt := "최근"
		s.Find("span.sds-comps-profile-info-subtext span, span.info").Each(func(_ int, span *goquery.Selection) {
			txt := strings.TrimSpace(span.Text())
			if (strings.Contains(txt, "전") || strings.Contains(txt, ".")) && !strings.Contains(txt, "네이버뉴스") {
				publishedAt = txt
			}
		})

		newsList = append(newsList, NewsItem{
			ID:          idCounter,
			Title:       title,
			Summary:     summary,
			Press:       press,
			PublishedAt: publishedAt,
			Url:         articleUrl,
		})
		idCounter++

		return len(newsList) < maxCount
	})

	log.Printf("[5/5] 작업 완료! 수집된 기사 수: %d개 (총 소요시간: %v)", len(newsList), time.Since(start))
	return newsList, nil
}
