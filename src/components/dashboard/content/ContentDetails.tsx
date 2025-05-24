import React, { useEffect } from 'react';
import { ContentItem } from '../../../types/contentManagement';
import { useContentManagement } from '../../../hooks/useContentManagement';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { formatDateTime } from '../../../utils/dateUtils';

interface ContentDetailsProps {
  contentId: string;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export const ContentDetails: React.FC<ContentDetailsProps> = ({
  contentId,
  onEdit,
  onDelete,
  onBack,
}) => {
  const {
    fetchContentItem,
    fetchCategories,
    fetchTags,
    currentItem,
    categories,
    tags,
    loading,
    error,
  } = useContentManagement();

  // Load content item, categories, and tags on mount
  useEffect(() => {
    fetchContentItem(contentId);
    fetchCategories();
    fetchTags();
  }, [contentId, fetchContentItem, fetchCategories, fetchTags]);

  // Get category and tag names
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.id === tagId);
      return tag ? tag.name : tagId;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        Error loading content: {error.message}
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">Content item not found</div>
    );
  }

  // Status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge color="success">{status}</Badge>;
      case 'draft':
        return <Badge color="secondary">{status}</Badge>;
      case 'archived':
        return <Badge color="danger">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{currentItem.title}</h2>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button variant="primary" onClick={onEdit}>
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this content?')) {
                  onDelete();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 items-center text-sm text-gray-600">
          <span>By {currentItem.author}</span>
          <span>•</span>
          <span>Created: {formatDateTime(currentItem.createdAt)}</span>
          <span>•</span>
          <span>Updated: {formatDateTime(currentItem.updatedAt)}</span>
          <span>•</span>
          <span>Status: {getStatusBadge(currentItem.status)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Metadata</h3>
            <dl className="grid grid-cols-1 gap-2">
              <div className="flex">
                <dt className="font-medium text-gray-500 w-24">Slug:</dt>
                <dd className="text-gray-700">{currentItem.slug}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-500 w-24">Category:</dt>
                <dd className="text-gray-700">{getCategoryName(currentItem.category)}</dd>
              </div>
              <div className="flex flex-wrap">
                <dt className="font-medium text-gray-500 w-24">Tags:</dt>
                <dd className="text-gray-700 flex-1">
                  <div className="flex flex-wrap gap-1">
                    {getTagNames(currentItem.tags).map((tagName, index) => (
                      <Badge key={index} variant="outlined" color="default">
                        {tagName}
                      </Badge>
                    ))}
                    {currentItem.tags.length === 0 && (
                      <span className="text-gray-400">No tags</span>
                    )}
                  </div>
                </dd>
              </div>
              {currentItem.publishedAt && (
                <div className="flex">
                  <dt className="font-medium text-gray-500 w-24">Published:</dt>
                  <dd className="text-gray-700">{formatDateTime(currentItem.publishedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Featured Image */}
          {currentItem.featuredImage && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Featured Image</h3>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <img
                  src={currentItem.featuredImage}
                  alt={currentItem.title}
                  className="w-full h-auto max-h-48 object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Excerpt</h3>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-700">{currentItem.excerpt}</p>
          </div>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Content</h3>
          <div className="prose max-w-none bg-white p-4 rounded-md border border-gray-200">
            {/* In a real app, you might want to use a markdown renderer here */}
            <pre className="whitespace-pre-wrap font-sans text-gray-700">{currentItem.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
