export namespace main {
	
	export class NewsItem {
	    id: number;
	    title: string;
	    summary: string;
	    press: string;
	    publishedAt: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new NewsItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.summary = source["summary"];
	        this.press = source["press"];
	        this.publishedAt = source["publishedAt"];
	        this.url = source["url"];
	    }
	}

}

