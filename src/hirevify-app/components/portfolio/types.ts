export interface PortfolioItem {
 id: string;
 user_id: string;
 title: string;
 description: string | null;
 url: string | null;
 image_urls: string[];
 tags: string[];
 created_at: string;
 updated_at: string;
}

export interface NewPortfolioItem {
 title: string;
 description: string | null;
 url: string | null;
 image_urls?: string[];
 tags: string[];
 user_id?: string;
}







