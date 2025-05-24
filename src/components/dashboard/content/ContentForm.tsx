import React, { useState, useEffect } from 'react';
import {
  ContentItem,
  ContentStatus,
  ContentCategory,
  ContentTag,
} from '../../../types/contentManagement';
import { useContentManagement } from '../../../hooks/useContentManagement';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface ContentFormProps {
  initialData?: ContentItem;
  onSubmit: (data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const ContentForm: React.FC<ContentFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { fetchCategories, fetchTags, categories, tags, loading } = useContentManagement();

  // Form state
  const [formData, setFormData] = useState<Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    status: 'draft' as ContentStatus,
    category: '',
    tags: [],
    publishedAt: undefined,
    featuredImage: undefined,
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories and tags on mount
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      const { id, createdAt, updatedAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Generate slug from title if slug field is empty
    if (name === 'title' && (!formData.slug || formData.slug === '')) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle tag selection
  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      tags: selectedOptions,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting content:', error);
      // Handle submission error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !initialData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          fullWidth
          required
        />

        {/* Slug */}
        <Input
          label="Slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          error={errors.slug}
          helperText="URL-friendly identifier (auto-generated from title if empty)"
          fullWidth
          required
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          value={formData.content}
          onChange={handleChange}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm
            focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            ${errors.content ? 'border-red-300 text-red-900 placeholder-red-300' : ''}
          `}
          required
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={3}
          value={formData.excerpt}
          onChange={handleChange}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm
            focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            ${errors.excerpt ? 'border-red-300 text-red-900 placeholder-red-300' : ''}
          `}
          required
        />
        {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Author */}
        <Input
          label="Author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          error={errors.author}
          fullWidth
          required
        />

        {/* Status */}
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          fullWidth
          required
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <Select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          error={errors.category}
          fullWidth
          required
        >
          <option value="">Select a category</option>
          {categories.map((category: ContentCategory) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <select
            id="tags"
            name="tags"
            multiple
            value={formData.tags}
            onChange={handleTagChange}
            className="
              block w-full rounded-md border-gray-300 shadow-sm
              focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              min-h-[100px]
            "
          >
            {tags.map((tag: ContentTag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">Hold Ctrl (or Cmd) to select multiple tags</p>
        </div>
      </div>

      {/* Featured Image URL */}
      <Input
        label="Featured Image URL"
        name="featuredImage"
        value={formData.featuredImage || ''}
        onChange={handleChange}
        helperText="URL to the featured image (optional)"
        fullWidth
      />

      {/* Published Date */}
      {formData.status === 'published' && (
        <Input
          label="Published Date"
          name="publishedAt"
          type="datetime-local"
          value={
            formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''
          }
          onChange={handleChange}
          helperText="When this content was or will be published (defaults to now if empty)"
          fullWidth
        />
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {initialData ? 'Update' : 'Create'} Content
        </Button>
      </div>
    </form>
  );
};
