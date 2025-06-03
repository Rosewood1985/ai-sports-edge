import React, { useState, useEffect } from 'react';

import { useContentManagement } from '../../../hooks/useContentManagement';
import {
  ContentItem,
  ContentFilter,
  ContentSort,
  ContentStatus,
} from '../../../types/contentManagement';
import { formatDate } from '../../../utils/dateUtils';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Input } from '../../ui/Input';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Select } from '../../ui/Select';
// import { Pagination } from '../../ui/Pagination';
// TODO: Update the import path below if Pagination exists elsewhere, or create the component if missing.
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../ui/Table';

interface ContentListProps {
  onEdit: (item: ContentItem) => void;
  onView: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onCreateNew: () => void;
}

export const ContentList: React.FC<ContentListProps> = ({
  onEdit,
  onView,
  onDelete,
  onCreateNew,
}) => {
  const { loading, error, contentList, fetchContentList, fetchCategories, categories } =
    useContentManagement();

  // Filter state
  const [filter, setFilter] = useState<ContentFilter>({});
  const [sort, setSort] = useState<ContentSort>({
    field: 'updatedAt',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load content on mount and when filter/sort/pagination changes
  useEffect(() => {
    fetchContentList(filter, sort, page, pageSize);
  }, [fetchContentList, filter, sort, page, pageSize]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ContentFilter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: value || undefined, // Convert empty string to undefined
    }));
    setPage(1); // Reset to first page when filter changes
  };

  // Handle sort changes
  const handleSortChange = (field: ContentSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: ContentStatus) => {
    const colorMap: Record<ContentStatus, string> = {
      draft: 'bg-gray-200 text-gray-800',
      published: 'bg-green-200 text-green-800',
      archived: 'bg-red-200 text-red-800',
    };

    return (
      <Badge className={colorMap[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    );
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        Error loading content: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
        <Button onClick={onCreateNew} variant="primary">
          Create New Content
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="Search content..."
          value={filter.search || ''}
          onChange={e => handleFilterChange('search', e.target.value)}
        />

        <Select
          value={filter.status || ''}
          onChange={e => handleFilterChange('status', e.target.value as ContentStatus)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>

        <Select
          value={filter.category || ''}
          onChange={e => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Input
          type="text"
          placeholder="Filter by author..."
          value={filter.author || ''}
          onChange={e => handleFilterChange('author', e.target.value)}
        />
      </div>

      {/* Content Table */}
      {loading && !contentList ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader className="cursor-pointer" onClick={() => handleSortChange('title')}>
                    Title
                    {sort.field === 'title' && (
                      <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHeader>
                  <TableHeader
                    className="cursor-pointer"
                    onClick={() => handleSortChange('author')}
                  >
                    Author
                    {sort.field === 'author' && (
                      <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHeader>
                  <TableHeader
                    className="cursor-pointer"
                    onClick={() => handleSortChange('category')}
                  >
                    Category
                    {sort.field === 'category' && (
                      <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHeader>
                  <TableHeader
                    className="cursor-pointer"
                    onClick={() => handleSortChange('status')}
                  >
                    Status
                    {sort.field === 'status' && (
                      <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHeader>
                  <TableHeader
                    className="cursor-pointer"
                    onClick={() => handleSortChange('updatedAt')}
                  >
                    Updated
                    {sort.field === 'updatedAt' && (
                      <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {contentList?.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{renderStatusBadge(item.status)}</TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <IconButton
                          icon="eye"
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(item)}
                          aria-label="View"
                        />
                        <IconButton
                          icon="edit"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          aria-label="Edit"
                        />
                        <IconButton
                          icon="trash"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item)}
                          aria-label="Delete"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {contentList?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No content items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {contentList && contentList.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, contentList.pagination.totalItems)} of{' '}
                {contentList.pagination.totalItems} items
              </div>

              <Pagination
                currentPage={page}
                totalPages={contentList.pagination.totalPages}
                onPageChange={setPage}
              />

              <Select
                value={pageSize.toString()}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1); // Reset to first page when page size changes
                }}
                className="w-24"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
};
