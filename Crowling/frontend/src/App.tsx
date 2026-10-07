import { useState } from 'react';
import { CrawlNews } from '../wailsjs/go/main/App';

// 네이버 뉴스 아이템 인터페이스 정의
interface NewsItem {
  id: string | number;
  title: string;
  summary: string;
  press: string;
  publishedAt: string;
  url: string;
}

function App() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  // 단일 검색 핸들러
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Go의 CrawlNews 함수 실행
      const result = await CrawlNews(keyword);
      setNewsList(result || []);
    } catch (error) {
      console.error('크롤링 중 에러 발생:', error);
      alert('뉴스를 수집하는 도중 에러가 발생했습니다: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* 상단 타이틀 */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
            네이버 뉴스 크롤러
          </h1>
          <p className="text-sm text-slate-400">
            키워드를 입력하면 실시간 관련 기사를 수집합니다.
          </p>
        </header>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색할 뉴스 키워드를 입력하세요..."
              className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner"
            />
            {/* 검색 돋보기 아이콘 */}
            <svg
              className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            type="submit"
            disabled={isLoading || !keyword.trim()}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all shadow-lg flex items-center justify-center min-w-[100px]"
          >
            {isLoading ? (
              <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              '수집하기'
            )}
          </button>
        </form>

        {/* 수집 상태 표시줄 */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 px-1">
          <span>수집된 기사: <strong className="text-sky-400">{newsList.length}</strong>건</span>
          <span>{isLoading ? '크롤링 진행 중...' : '대기 중'}</span>
        </div>

        {/* 뉴스 기사 리스트 */}
        <div className="space-y-3">
          {newsList.map((item) => (
            <article
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all shadow-md flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                    {item.press}
                  </span>
                  <span>•</span>
                  <span>{item.publishedAt}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 leading-snug hover:text-sky-400 transition-colors cursor-pointer">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800/60">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
                >
                  기사 원문 보기 &rarr;
                </a>
              </div>
            </article>
          ))}

          {/* 비어있을 때 안내문 */}
          {newsList.length === 0 && !isLoading && (
            <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-sm">
              검색어를 입력하고 수집하기 버튼을 누르면 기사가 표시됩니다.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;