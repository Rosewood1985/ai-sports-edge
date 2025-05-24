import {
  ContentItem,
  ContentCategory,
  ContentTag,
  ContentFilter,
  ContentSort,
  ContentListResponse,
} from '../types/contentManagement';

/**
 * Service for managing content in the admin dashboard
 */
class ContentManagementService {
  private apiUrl = '/api/admin/content';

  /**
   * Get a list of content items with pagination and filtering
   */
  async getContentList(
    filter?: ContentFilter,
    sort?: ContentSort,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ContentListResponse> {
    const queryParams = new URLSearchParams();

    // Add pagination params
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());

    // Add filter params
    if (filter) {
      if (filter.search) queryParams.append('search', filter.search);
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.category) queryParams.append('category', filter.category);
      if (filter.tag) queryParams.append('tag', filter.tag);
      if (filter.author) queryParams.append('author', filter.author);
      if (filter.startDate) queryParams.append('startDate', filter.startDate);
      if (filter.endDate) queryParams.append('endDate', filter.endDate);
    }

    // Add sort params
    if (sort) {
      queryParams.append('sortField', sort.field);
      queryParams.append('sortDirection', sort.direction);
    }

    const response = await fetch(`${this.apiUrl}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a single content item by ID
   */
  async getContentItem(id: string): Promise<ContentItem> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content item: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new content item
   */
  async createContentItem(
    item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ContentItem> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Failed to create content item: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing content item
   */
  async updateContentItem(id: string, item: Partial<ContentItem>): Promise<ContentItem> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Failed to update content item: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a content item
   */
  async deleteContentItem(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete content item: ${response.statusText}`);
    }
  }

  /**
   * Get all content categories
   */
  async getCategories(): Promise<ContentCategory[]> {
    const response = await fetch(`${this.apiUrl}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all content tags
   */
  async getTags(): Promise<ContentTag[]> {
    const response = await fetch(`${this.apiUrl}/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new category
   */
  async createCategory(category: Omit<ContentCategory, 'id'>): Promise<ContentCategory> {
    const response = await fetch(`${this.apiUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      throw new Error(`Failed to create category: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new tag
   */
  async createTag(tag: Omit<ContentTag, 'id'>): Promise<ContentTag> {
    const response = await fetch(`${this.apiUrl}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(tag),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tag: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const contentManagementService = new ContentManagementService();
