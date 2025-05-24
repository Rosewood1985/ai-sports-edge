import { useState, useCallback } from 'react';
import {
  ContentItem,
  ContentCategory,
  ContentTag,
  ContentFilter,
  ContentSort,
  ContentListResponse,
} from '../types/contentManagement';
import { contentManagementService } from '../services/contentManagementService';

/**
 * Custom hook for content management functionality
 */
export function useContentManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [contentList, setContentList] = useState<ContentListResponse | null>(null);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);

  /**
   * Fetch content list with filtering, sorting, and pagination
   */
  const fetchContentList = useCallback(
    async (filter?: ContentFilter, sort?: ContentSort, page: number = 1, pageSize: number = 10) => {
      setLoading(true);
      setError(null);

      try {
        const response = await contentManagementService.getContentList(
          filter,
          sort,
          page,
          pageSize
        );
        setContentList(response);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch a single content item by ID
   */
  const fetchContentItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const item = await contentManagementService.getContentItem(id);
      setCurrentItem(item);
      return item;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new content item
   */
  const createContentItem = useCallback(
    async (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      setError(null);

      try {
        const newItem = await contentManagementService.createContentItem(item);
        setCurrentItem(newItem);
        return newItem;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing content item
   */
  const updateContentItem = useCallback(async (id: string, item: Partial<ContentItem>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedItem = await contentManagementService.updateContentItem(id, item);
      setCurrentItem(updatedItem);
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a content item
   */
  const deleteContentItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await contentManagementService.deleteContentItem(id);
      setCurrentItem(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all categories
   */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedCategories = await contentManagementService.getCategories();
      setCategories(fetchedCategories);
      return fetchedCategories;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all tags
   */
  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedTags = await contentManagementService.getTags();
      setTags(fetchedTags);
      return fetchedTags;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new category
   */
  const createCategory = useCallback(async (category: Omit<ContentCategory, 'id'>) => {
    setLoading(true);
    setError(null);

    try {
      const newCategory = await contentManagementService.createCategory(category);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new tag
   */
  const createTag = useCallback(async (tag: Omit<ContentTag, 'id'>) => {
    setLoading(true);
    setError(null);

    try {
      const newTag = await contentManagementService.createTag(tag);
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    contentList,
    currentItem,
    categories,
    tags,

    // Methods
    fetchContentList,
    fetchContentItem,
    createContentItem,
    updateContentItem,
    deleteContentItem,
    fetchCategories,
    fetchTags,
    createCategory,
    createTag,
  };
}
