export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'website' | 'github' | 'design' | 'document';
  url: string;
  image?: string;
  technologies: string[];
}

export interface NewPortfolioItem {
  title: string;
  description: string;
  type: 'website' | 'github' | 'design' | 'document';
  url: string;
  technologies: string[];
}