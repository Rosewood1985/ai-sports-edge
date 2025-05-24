export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  status: ContentStatus;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featuredImage?: string;
}

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
}

export interface ContentTag {
  id: string;
  name: string;
  slug: string;
}

export interface ContentFilter {
  search?: string;
  status?: ContentStatus;
  category?: string;
  tag?: string;
  author?: string;
  startDate?: string;
  endDate?: string;
}

export interface ContentSort {
  field: 'title' | 'author' | 'status' | 'category' | 'createdAt' | 'updatedAt' | 'publishedAt';
  direction: 'asc' | 'desc';
}

export interface ContentPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ContentListResponse {
  items: ContentItem[];
  pagination: ContentPagination;
}
