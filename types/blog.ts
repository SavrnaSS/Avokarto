// Blog-related type definitions

export interface BlogPost {
  id?: number;
  imgSrc?: string;
  category: string;
  date: string;
  title: string;
  readTime?: string;
  author?: string;
  description?: string;
  images?: string[];
  alt?: string;
  readMins?: number;
  imageWidth?: number;
  imageHeight?: number;
}
