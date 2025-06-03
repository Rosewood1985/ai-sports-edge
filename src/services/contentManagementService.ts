import {
  ContentItem,
  ContentListFilter,
  ContentListResponse,
  ContentCreateRequest,
  ContentUpdateRequest,
  ContentBulkOperation,
  ContentTemplate,
  ContentTag,
  ContentType,
  ContentStatus,
  ContentCategory,
  ContentMediaAsset,
  ContentRevision,
  ContentComment,
} from '../types/contentManagement';

/**
 * Service for managing content in the admin dashboard
 */
export class ContentManagementService {
  /**
   * Helper method to make API requests
   */
  private static async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get content list with filtering and pagination
   */
  static async getContentList(
    page = 1,
    pageSize = 20,
    filters: ContentListFilter = {}
  ): Promise<ContentListResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    try {
      return this.request(`/api/admin/content?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error fetching content list:', error);
      // Return mock data for development
      return this.getMockContentList(page, pageSize, filters);
    }
  }

  /**
   * Get single content item by ID
   */
  static async getContentById(id: string): Promise<ContentItem> {
    try {
      return this.request(`/api/admin/content/${id}`);
    } catch (error) {
      console.error(`Error fetching content ${id}:`, error);
      // Return mock data for development
      return this.getMockContentById(id);
    }
  }

  /**
   * Create new content item
   */
  static async createContent(content: ContentCreateRequest): Promise<ContentItem> {
    try {
      return this.request('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify(content),
      });
    } catch (error) {
      console.error('Error creating content:', error);
      // Return mock data for development
      return this.getMockCreatedContent(content);
    }
  }

  /**
   * Update existing content item
   */
  static async updateContent(content: ContentUpdateRequest): Promise<ContentItem> {
    try {
      return this.request(`/api/admin/content/${content.id}`, {
        method: 'PUT',
        body: JSON.stringify(content),
      });
    } catch (error) {
      console.error(`Error updating content ${content.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete content item
   */
  static async deleteContent(id: string): Promise<boolean> {
    try {
      await this.request(`/api/admin/content/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting content ${id}:`, error);
      return false;
    }
  }

  /**
   * Perform bulk operations on content
   */
  static async bulkOperation(operation: ContentBulkOperation): Promise<boolean> {
    try {
      await this.request('/api/admin/content/bulk', {
        method: 'POST',
        body: JSON.stringify(operation),
      });
      return true;
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      return false;
    }
  }

  /**
   * Get content templates
   */
  static async getContentTemplates(): Promise<ContentTemplate[]> {
    try {
      return this.request('/api/admin/content/templates');
    } catch (error) {
      console.error('Error fetching content templates:', error);
      return this.getMockContentTemplates();
    }
  }

  /**
   * Get content tags
   */
  static async getContentTags(): Promise<ContentTag[]> {
    try {
      return this.request('/api/admin/content/tags');
    } catch (error) {
      console.error('Error fetching content tags:', error);
      return this.getMockContentTags();
    }
  }

  /**
   * Create new content tag
   */
  static async createContentTag(tag: Omit<ContentTag, 'id'>): Promise<ContentTag> {
    try {
      return this.request('/api/admin/content/tags', {
        method: 'POST',
        body: JSON.stringify(tag),
      });
    } catch (error) {
      console.error('Error creating content tag:', error);
      return {
        id: `tag-${Date.now()}`,
        ...tag,
      };
    }
  }

  /**
   * Upload media asset
   */
  static async uploadMediaAsset(
    file: File,
    metadata: Partial<ContentMediaAsset>
  ): Promise<ContentMediaAsset> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('/api/admin/content/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error uploading media asset:', error);
      // Return mock data for development
      return {
        id: `media-${Date.now()}`,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        altText: metadata.altText || '',
        caption: metadata.caption || '',
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      };
    }
  }

  /**
   * Get content revisions
   */
  static async getContentRevisions(contentId: string): Promise<ContentRevision[]> {
    try {
      return this.request(`/api/admin/content/${contentId}/revisions`);
    } catch (error) {
      console.error(`Error fetching revisions for content ${contentId}:`, error);
      return [];
    }
  }

  /**
   * Get content comments
   */
  static async getContentComments(contentId: string): Promise<ContentComment[]> {
    try {
      return this.request(`/api/admin/content/${contentId}/comments`);
    } catch (error) {
      console.error(`Error fetching comments for content ${contentId}:`, error);
      return [];
    }
  }

  /**
   * Add content comment
   */
  static async addContentComment(
    contentId: string,
    content: string,
    isInternal = false,
    parentId?: string
  ): Promise<ContentComment> {
    try {
      return this.request(`/api/admin/content/${contentId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          isInternal,
          parentId,
        }),
      });
    } catch (error) {
      console.error(`Error adding comment to content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Mock data methods for development
   */
  private static getMockContentList(
    page: number,
    pageSize: number,
    filters: ContentListFilter
  ): ContentListResponse {
    const mockItems: ContentItem[] = [
      {
        id: 'content-001',
        title: "How to Bet on Sports: A Beginner's Guide",
        slug: 'how-to-bet-on-sports-beginners-guide',
        content:
          '<p>This comprehensive guide covers everything you need to know about sports betting...</p>',
        excerpt:
          "Learn the fundamentals of sports betting with our comprehensive beginner's guide.",
        type: ContentType.ARTICLE,
        status: ContentStatus.PUBLISHED,
        category: ContentCategory.BETTING_GUIDE,
        tags: [
          {
            id: 'tag-001',
            name: 'Beginner',
            color: '#10B981',
            description: 'Content for beginners',
          },
          {
            id: 'tag-002',
            name: 'Sports Betting',
            color: '#3B82F6',
            description: 'Sports betting content',
          },
        ],
        author: {
          id: 'author-001',
          name: 'John Smith',
          email: 'john@aisportsedge.app',
          avatar: '/avatars/john.jpg',
          role: 'Content Editor',
        },
        metadata: {
          title: "How to Bet on Sports: A Beginner's Guide | AI Sports Edge",
          description:
            "Learn the fundamentals of sports betting with our comprehensive beginner's guide.",
          keywords: ['sports betting', 'beginner guide', 'betting tips'],
        },
        featuredImage: '/images/sports-betting-guide.jpg',
        createdAt: '2025-05-20T10:30:00Z',
        updatedAt: '2025-05-22T14:15:00Z',
        publishedAt: '2025-05-20T10:30:00Z',
        analytics: {
          views: 1250,
          uniqueViews: 980,
          averageTimeOnPage: 280,
          bounceRate: 0.25,
          shares: 45,
          likes: 120,
          comments: 18,
          conversionRate: 0.12,
        },
        sortOrder: 1,
        isSticky: true,
        allowComments: true,
        requiresAuth: false,
        premiumContent: false,
      },
      {
        id: 'content-002',
        title: 'Understanding Football Odds and Point Spreads',
        slug: 'understanding-football-odds-point-spreads',
        content: '<p>Football betting involves various types of odds and spreads...</p>',
        excerpt: 'Master the art of reading football odds and understanding point spreads.',
        type: ContentType.TUTORIAL,
        status: ContentStatus.PUBLISHED,
        category: ContentCategory.SPORTS_ANALYSIS,
        tags: [
          {
            id: 'tag-002',
            name: 'Sports Betting',
            color: '#3B82F6',
            description: 'Sports betting content',
          },
          {
            id: 'tag-003',
            name: 'Football',
            color: '#F59E0B',
            description: 'Football related content',
          },
        ],
        author: {
          id: 'author-002',
          name: 'Sarah Johnson',
          email: 'sarah@aisportsedge.app',
          avatar: '/avatars/sarah.jpg',
          role: 'Sports Analyst',
        },
        metadata: {
          title: 'Understanding Football Odds and Point Spreads | AI Sports Edge',
          description: 'Master the art of reading football odds and understanding point spreads.',
          keywords: ['football odds', 'point spreads', 'NFL betting'],
        },
        featuredImage: '/images/football-odds.jpg',
        createdAt: '2025-05-18T09:15:00Z',
        updatedAt: '2025-05-18T09:15:00Z',
        publishedAt: '2025-05-18T09:15:00Z',
        analytics: {
          views: 850,
          uniqueViews: 720,
          averageTimeOnPage: 320,
          bounceRate: 0.18,
          shares: 32,
          likes: 89,
          comments: 12,
          conversionRate: 0.15,
        },
        sortOrder: 2,
        isSticky: false,
        allowComments: true,
        requiresAuth: false,
        premiumContent: false,
      },
      {
        id: 'content-003',
        title: 'Advanced Analytics: Using AI for Sports Predictions',
        slug: 'advanced-analytics-ai-sports-predictions',
        content: '<p>Discover how artificial intelligence is revolutionizing sports betting...</p>',
        excerpt: 'Learn how AI and machine learning are changing the game of sports prediction.',
        type: ContentType.ARTICLE,
        status: ContentStatus.DRAFT,
        category: ContentCategory.ADVANCED_FEATURES,
        tags: [
          {
            id: 'tag-004',
            name: 'AI',
            color: '#8B5CF6',
            description: 'Artificial Intelligence content',
          },
          {
            id: 'tag-005',
            name: 'Analytics',
            color: '#06B6D4',
            description: 'Analytics and data content',
          },
        ],
        author: {
          id: 'author-003',
          name: 'Mike Chen',
          email: 'mike@aisportsedge.app',
          avatar: '/avatars/mike.jpg',
          role: 'AI Specialist',
        },
        metadata: {
          title: 'Advanced Analytics: Using AI for Sports Predictions | AI Sports Edge',
          description:
            'Learn how AI and machine learning are changing the game of sports prediction.',
          keywords: ['AI sports prediction', 'machine learning', 'sports analytics'],
        },
        featuredImage: '/images/ai-analytics.jpg',
        createdAt: '2025-05-22T16:45:00Z',
        updatedAt: '2025-05-23T11:30:00Z',
        analytics: {
          views: 0,
          uniqueViews: 0,
          averageTimeOnPage: 0,
          bounceRate: 0,
          shares: 0,
          likes: 0,
          comments: 0,
        },
        sortOrder: 3,
        isSticky: false,
        allowComments: true,
        requiresAuth: true,
        premiumContent: true,
      },
    ];

    // Apply filters (simplified for demo)
    let filteredItems = mockItems;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(
        item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filteredItems = filteredItems.filter(item => item.status === filters.status);
    }

    if (filters.type) {
      filteredItems = filteredItems.filter(item => item.type === filters.type);
    }

    if (filters.category) {
      filteredItems = filteredItems.filter(item => item.category === filters.category);
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total: filteredItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredItems.length / pageSize),
    };
  }

  private static getMockContentById(id: string): ContentItem {
    const mockList = this.getMockContentList(1, 100, {});
    const item = mockList.items.find(item => item.id === id);

    if (!item) {
      throw new Error(`Content with ID ${id} not found`);
    }

    return item;
  }

  private static getMockCreatedContent(request: ContentCreateRequest): ContentItem {
    return {
      id: `content-${Date.now()}`,
      title: request.title,
      slug: request.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: request.content,
      excerpt: request.excerpt,
      type: request.type,
      status: ContentStatus.DRAFT,
      category: request.category,
      tags: request.tags.map(tagId => ({
        id: tagId,
        name: tagId.replace('-', ' '),
        color: '#6B7280',
      })),
      author: {
        id: 'current-user',
        name: 'Current User',
        email: 'user@aisportsedge.app',
        role: 'Editor',
      },
      metadata: request.metadata,
      featuredImage: request.featuredImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedule: request.schedule,
      sortOrder: request.sortOrder || 0,
      isSticky: request.isSticky || false,
      allowComments: request.allowComments !== false,
      requiresAuth: request.requiresAuth || false,
      premiumContent: request.premiumContent || false,
    };
  }

  private static getMockContentTemplates(): ContentTemplate[] {
    return [
      {
        id: 'template-001',
        name: 'Betting Guide Template',
        description: 'Standard template for betting guide articles',
        type: ContentType.ARTICLE,
        template: `
# {{title}}

## Introduction
{{introduction}}

## Key Points
{{key_points}}

## Step-by-Step Guide
{{step_by_step}}

## Tips and Strategies
{{tips}}

## Conclusion
{{conclusion}}
        `,
        placeholders: ['title', 'introduction', 'key_points', 'step_by_step', 'tips', 'conclusion'],
        createdAt: '2025-05-15T10:00:00Z',
        updatedAt: '2025-05-15T10:00:00Z',
      },
      {
        id: 'template-002',
        name: 'Tutorial Template',
        description: 'Interactive tutorial template with examples',
        type: ContentType.TUTORIAL,
        template: `
# {{title}}

## What You'll Learn
{{learning_objectives}}

## Prerequisites
{{prerequisites}}

## Tutorial Steps
{{tutorial_steps}}

## Practice Exercises
{{exercises}}

## Next Steps
{{next_steps}}
        `,
        placeholders: [
          'title',
          'learning_objectives',
          'prerequisites',
          'tutorial_steps',
          'exercises',
          'next_steps',
        ],
        createdAt: '2025-05-15T10:00:00Z',
        updatedAt: '2025-05-15T10:00:00Z',
      },
    ];
  }

  private static getMockContentTags(): ContentTag[] {
    return [
      { id: 'tag-001', name: 'Beginner', color: '#10B981', description: 'Content for beginners' },
      {
        id: 'tag-002',
        name: 'Sports Betting',
        color: '#3B82F6',
        description: 'Sports betting content',
      },
      {
        id: 'tag-003',
        name: 'Football',
        color: '#F59E0B',
        description: 'Football related content',
      },
      {
        id: 'tag-004',
        name: 'AI',
        color: '#8B5CF6',
        description: 'Artificial Intelligence content',
      },
      {
        id: 'tag-005',
        name: 'Analytics',
        color: '#06B6D4',
        description: 'Analytics and data content',
      },
      {
        id: 'tag-006',
        name: 'Basketball',
        color: '#EF4444',
        description: 'Basketball related content',
      },
      {
        id: 'tag-007',
        name: 'Baseball',
        color: '#84CC16',
        description: 'Baseball related content',
      },
      { id: 'tag-008', name: 'Advanced', color: '#F97316', description: 'Advanced level content' },
      { id: 'tag-009', name: 'Tutorial', color: '#EC4899', description: 'Tutorial content' },
      { id: 'tag-010', name: 'Guide', color: '#14B8A6', description: 'Guide content' },
    ];
  }
}
