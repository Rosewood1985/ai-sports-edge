import React, { useState, useMemo } from 'react';
import { EnhancedWidget } from '../widgets/EnhancedWidget';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { IconButton } from '../../ui/IconButton';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useContentList, useContentBulkOperations, useContentTags } from '../../../hooks/useContentManagement';
import {
  ContentItem,
  ContentListFilter,
  ContentType,
  ContentStatus,
  ContentCategory,
} from '../../../types/contentManagement';
import { formatDateTime } from '../../../utils/dateUtils';

export interface ContentManagementDashboardProps {
  onCreateContent?: () => void;
  onEditContent?: (content: ContentItem) => void;
  className?: string;
}

/**
 * Main Content Management Dashboard component
 */
export function ContentManagementDashboard({
  onCreateContent,
  onEditContent,
  className = '',
}: ContentManagementDashboardProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    data: contentList,
    isLoading,
    error,
    page,
    totalPages,
    total,
    filters,
    updateFilters,
    changePage,
    refresh,
  } = useContentList(1, 12);

  const { performBulkOperation, isLoading: isBulkLoading } = useContentBulkOperations();
  const { data: tags } = useContentTags();

  // Statistics
  const stats = useMemo(() => {
    if (!contentList) return null;

    const published = contentList.items.filter(item => item.status === ContentStatus.PUBLISHED).length;
    const draft = contentList.items.filter(item => item.status === ContentStatus.DRAFT).length;
    const scheduled = contentList.items.filter(item => item.status === ContentStatus.SCHEDULED).length;
    const totalViews = contentList.items.reduce((sum, item) => sum + (item.analytics?.views || 0), 0);

    return { published, draft, scheduled, totalViews };
  }, [contentList]);

  const handleSelectItem = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (!contentList) return;
    
    if (selectedItems.size === contentList.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(contentList.items.map(item => item.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) return;

    const success = await performBulkOperation({
      action: action as any,
      contentIds: Array.from(selectedItems),
    });

    if (success) {
      setSelectedItems(new Set());
      refresh();
    }
  };

  const handleFilterChange = (newFilters: Partial<ContentListFilter>) => {
    updateFilters({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    updateFilters({});
  };

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case ContentStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case ContentStatus.DRAFT:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case ContentStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case ContentStatus.ARCHIVED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: ContentType) => {
    switch (type) {
      case ContentType.ARTICLE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case ContentType.TUTORIAL:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case ContentType.FAQ:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case ContentType.ANNOUNCEMENT:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPerformanceColor = (views: number) => {
    if (views > 1000) return 'text-green-600 dark:text-green-400';
    if (views > 500) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.draft}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Content Management Widget */}
      <EnhancedWidget
        title="Content Management"
        subtitle={`Manage your content library (${total} items)`}
        size="extra-large"
        isLoading={isLoading}
        error={error}
        onRefresh={refresh}
        className="min-h-[600px]"
      >
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 gap-3">
              <Button onClick={onCreateContent} variant="primary">
                Create Content
              </Button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedItems.size} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBulkAction('publish')}
                    variant="secondary"
                    size="sm"
                    isLoading={isBulkLoading}
                  >
                    Publish
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('unpublish')}
                    variant="secondary"
                    size="sm"
                    isLoading={isBulkLoading}
                  >
                    Unpublish
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('archive')}
                    variant="secondary"
                    size="sm"
                    isLoading={isBulkLoading}
                  >
                    Archive
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('delete')}
                    variant="secondary"
                    size="sm"
                    isLoading={isBulkLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    placeholder="Search content..."
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange({ status: e.target.value as ContentStatus || undefined })}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value={ContentStatus.PUBLISHED}>Published</option>
                    <option value={ContentStatus.DRAFT}>Draft</option>
                    <option value={ContentStatus.SCHEDULED}>Scheduled</option>
                    <option value={ContentStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange({ type: e.target.value as ContentType || undefined })}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value={ContentType.ARTICLE}>Article</option>
                    <option value={ContentType.TUTORIAL}>Tutorial</option>
                    <option value={ContentType.KNOWLEDGE_BASE}>Knowledge Base</option>
                    <option value={ContentType.FAQ}>FAQ</option>
                    <option value={ContentType.ANNOUNCEMENT}>Announcement</option>
                    <option value={ContentType.BLOG_POST}>Blog Post</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange({ category: e.target.value as ContentCategory || undefined })}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    <option value={ContentCategory.BETTING_GUIDE}>Betting Guide</option>
                    <option value={ContentCategory.SPORTS_ANALYSIS}>Sports Analysis</option>
                    <option value={ContentCategory.PLATFORM_HELP}>Platform Help</option>
                    <option value={ContentCategory.GETTING_STARTED}>Getting Started</option>
                    <option value={ContentCategory.ADVANCED_FEATURES}>Advanced Features</option>
                    <option value={ContentCategory.NEWS}>News</option>
                    <option value={ContentCategory.UPDATES}>Updates</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={clearFilters} variant="secondary" size="sm">
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}

          {/* Content List */}
          {contentList && (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedItems.size === contentList.items.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Select all {contentList.items.length} items
                </span>
              </div>

              {/* Content Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contentList.items.map((item) => (
                    <Card key={item.id} className="relative overflow-hidden">
                      <div className="absolute top-3 left-3 z-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      {item.featuredImage && (
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                          <img
                            src={item.featuredImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex gap-1 ml-2">
                            <IconButton
                              icon="edit"
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditContent?.(item)}
                              aria-label="Edit content"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <div>By {item.author.name}</div>
                          <div>Updated {formatDateTime(item.updatedAt)}</div>
                          {item.analytics && (
                            <div className={getPerformanceColor(item.analytics.views)}>
                              {item.analytics.views.toLocaleString()} views
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {contentList.items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.title}
                            </h3>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            <Badge className={getTypeColor(item.type)}>
                              {item.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            By {item.author.name} • Updated {formatDateTime(item.updatedAt)}
                            {item.analytics && (
                              <span className={`ml-2 ${getPerformanceColor(item.analytics.views)}`}>
                                {item.analytics.views.toLocaleString()} views
                              </span>
                            )}
                          </div>
                        </div>

                        <IconButton
                          icon="edit"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditContent?.(item)}
                          aria-label="Edit content"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => changePage(page - 1)}
                      disabled={page === 1}
                      variant="secondary"
                      size="sm"
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          variant={pageNum === page ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      onClick={() => changePage(page + 1)}
                      disabled={page === totalPages}
                      variant="secondary"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {contentList && contentList.items.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No content found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first piece of content.
              </p>
              <div className="mt-6">
                <Button onClick={onCreateContent} variant="primary">
                  Create Content
                </Button>
              </div>
            </div>
          )}
        </div>
      </EnhancedWidget>
    </div>
  );
}