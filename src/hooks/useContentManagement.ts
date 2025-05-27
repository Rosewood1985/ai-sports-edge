import { useState, useCallback, useEffect } from 'react';
import {
  ContentItem,
  ContentListFilter,
  ContentListResponse,
  ContentCreateRequest,
  ContentUpdateRequest,
  ContentBulkOperation,
  ContentTemplate,
  ContentTag,
  ContentMediaAsset,
  ContentRevision,
  ContentComment,
} from '../types/contentManagement';
import { ContentManagementService } from '../services/contentManagementService';

/**
 * Hook for managing content list with filtering and pagination
 */
export function useContentList(
  initialPage = 1,
  initialPageSize = 20,
  initialFilters: ContentListFilter = {}
) {
  const [data, setData] = useState<ContentListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<ContentListFilter>(initialFilters);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.getContentList(page, pageSize, filters);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch content'));
      console.error('Error fetching content list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters]);

  // Fetch content when dependencies change
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateFilters = useCallback((newFilters: ContentListFilter) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const refresh = useCallback(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    data,
    isLoading,
    error,
    page,
    pageSize,
    filters,
    totalPages: data?.totalPages || 0,
    total: data?.total || 0,
    updateFilters,
    changePage,
    changePageSize,
    refresh,
  };
}

/**
 * Hook for managing individual content items
 */
export function useContentItem(id?: string) {
  const [data, setData] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContent = useCallback(async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.getContentById(contentId);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch content'));
      console.error('Error fetching content:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch content when ID is provided
  useEffect(() => {
    if (id) {
      fetchContent(id);
    }
  }, [id, fetchContent]);

  const createContent = useCallback(async (content: ContentCreateRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.createContent(content);
      setData(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create content'));
      console.error('Error creating content:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateContent = useCallback(async (content: ContentUpdateRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.updateContent(content);
      setData(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update content'));
      console.error('Error updating content:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteContent = useCallback(async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await ContentManagementService.deleteContent(contentId);
      if (success && data?.id === contentId) {
        setData(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete content'));
      console.error('Error deleting content:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  const refresh = useCallback(() => {
    if (id) {
      fetchContent(id);
    }
  }, [id, fetchContent]);

  return {
    data,
    isLoading,
    error,
    createContent,
    updateContent,
    deleteContent,
    refresh,
  };
}

/**
 * Hook for bulk content operations
 */
export function useContentBulkOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performBulkOperation = useCallback(async (operation: ContentBulkOperation) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await ContentManagementService.bulkOperation(operation);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to perform bulk operation'));
      console.error('Error performing bulk operation:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    performBulkOperation,
  };
}

/**
 * Hook for managing content templates
 */
export function useContentTemplates() {
  const [data, setData] = useState<ContentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.getContentTemplates();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchTemplates,
  };
}

/**
 * Hook for managing content tags
 */
export function useContentTags() {
  const [data, setData] = useState<ContentTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.getContentTags();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tags'));
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTag = useCallback(async (tag: Omit<ContentTag, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.createContentTag(tag);
      setData(prev => [...prev, response]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create tag'));
      console.error('Error creating tag:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    data,
    isLoading,
    error,
    createTag,
    refresh: fetchTags,
  };
}

/**
 * Hook for media asset management
 */
export function useMediaAssets() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const uploadAsset = useCallback(async (file: File, metadata: Partial<ContentMediaAsset>) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const response = await ContentManagementService.uploadMediaAsset(file, metadata);
      return response;
    } catch (err) {
      setUploadError(err instanceof Error ? err : new Error('Failed to upload asset'));
      console.error('Error uploading asset:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    isUploading,
    uploadError,
    uploadAsset,
  };
}

/**
 * Hook for content revisions
 */
export function useContentRevisions(contentId?: string) {
  const [data, setData] = useState<ContentRevision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRevisions = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.getContentRevisions(id);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch revisions'));
      console.error('Error fetching revisions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch revisions when content ID changes
  useEffect(() => {
    if (contentId) {
      fetchRevisions(contentId);
    }
  }, [contentId, fetchRevisions]);

  return {
    data,
    isLoading,
    error,
    refresh: () => contentId && fetchRevisions(contentId),
  };
}

/**
 * Hook for content comments
 */
export function useContentComments(contentId?: string) {
  const [data, setData] = useState<ContentComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.getContentComments(id);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comments'));
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(async (
    id: string,
    content: string,
    isInternal = false,
    parentId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ContentManagementService.addContentComment(id, content, isInternal, parentId);
      setData(prev => [...prev, response]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add comment'));
      console.error('Error adding comment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch comments when content ID changes
  useEffect(() => {
    if (contentId) {
      fetchComments(contentId);
    }
  }, [contentId, fetchComments]);

  return {
    data,
    isLoading,
    error,
    addComment: contentId ? (content: string, isInternal?: boolean, parentId?: string) => 
      addComment(contentId, content, isInternal, parentId) : undefined,
    refresh: () => contentId && fetchComments(contentId),
  };
}