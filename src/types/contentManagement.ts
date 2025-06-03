/**
 * Types for the Content Management System
 */

export enum ContentType {
  ARTICLE = 'article',
  TUTORIAL = 'tutorial',
  KNOWLEDGE_BASE = 'knowledge_base',
  FAQ = 'faq',
  ANNOUNCEMENT = 'announcement',
  BLOG_POST = 'blog_post',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
}

export enum ContentCategory {
  BETTING_GUIDE = 'betting_guide',
  SPORTS_ANALYSIS = 'sports_analysis',
  PLATFORM_HELP = 'platform_help',
  GETTING_STARTED = 'getting_started',
  ADVANCED_FEATURES = 'advanced_features',
  NEWS = 'news',
  UPDATES = 'updates',
}

export interface ContentTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ContentAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface ContentMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface ContentRevision {
  id: string;
  contentId: string;
  version: number;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  changesSummary: string;
}

export interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  shares: number;
  likes: number;
  comments: number;
  conversionRate?: number;
}

export interface ContentSchedule {
  publishAt: string;
  unpublishAt?: string;
  timezone: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  type: ContentType;
  status: ContentStatus;
  category: ContentCategory;
  tags: ContentTag[];
  author: ContentAuthor;
  metadata: ContentMetadata;
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  schedule?: ContentSchedule;
  analytics?: ContentAnalytics;
  revisions?: ContentRevision[];
  parentId?: string; // For content hierarchies
  sortOrder?: number;
  isSticky?: boolean;
  allowComments?: boolean;
  requiresAuth?: boolean;
  premiumContent?: boolean;
}

export interface ContentListFilter {
  type?: ContentType;
  status?: ContentStatus;
  category?: ContentCategory;
  author?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  isSticky?: boolean;
  premiumContent?: boolean;
}

export interface ContentListResponse {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ContentCreateRequest {
  title: string;
  content: string;
  excerpt?: string;
  type: ContentType;
  category: ContentCategory;
  tags: string[];
  metadata: ContentMetadata;
  featuredImage?: string;
  schedule?: ContentSchedule;
  parentId?: string;
  sortOrder?: number;
  isSticky?: boolean;
  allowComments?: boolean;
  requiresAuth?: boolean;
  premiumContent?: boolean;
}

export interface ContentUpdateRequest extends Partial<ContentCreateRequest> {
  id: string;
  status?: ContentStatus;
}

export interface ContentBulkOperation {
  action:
    | 'publish'
    | 'unpublish'
    | 'archive'
    | 'delete'
    | 'change_category'
    | 'add_tags'
    | 'remove_tags';
  contentIds: string[];
  params?: {
    category?: ContentCategory;
    tags?: string[];
    publishAt?: string;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: ContentType;
  template: string;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ContentWorkflowStep[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentWorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedRole: string;
  isRequired: boolean;
  allowedActions: string[];
  order: number;
}

export interface ContentComment {
  id: string;
  contentId: string;
  author: ContentAuthor;
  content: string;
  isInternal: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentMediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  createdAt: string;
  createdBy: string;
}
