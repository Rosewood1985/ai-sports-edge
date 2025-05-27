import React, { useState, useEffect } from 'react';
import { EnhancedWidget } from '../widgets/EnhancedWidget';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useContentItem, useContentTemplates, useContentTags, useMediaAssets } from '../../../hooks/useContentManagement';
import {
  ContentItem,
  ContentCreateRequest,
  ContentUpdateRequest,
  ContentType,
  ContentStatus,
  ContentCategory,
  ContentTag,
  ContentTemplate,
} from '../../../types/contentManagement';

export interface ContentEditorProps {
  contentId?: string;
  onSave?: (content: ContentItem) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Content Editor component for creating and editing content
 */
export function ContentEditor({
  contentId,
  onSave,
  onCancel,
  className = '',
}: ContentEditorProps) {
  const isEditing = !!contentId;
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [type, setType] = useState<ContentType>(ContentType.ARTICLE);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [category, setCategory] = useState<ContentCategory>(ContentCategory.BETTING_GUIDE);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [premiumContent, setPremiumContent] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  // Hooks
  const { data: contentData, createContent, updateContent, isLoading: isContentLoading } = useContentItem(contentId);
  const { data: templates } = useContentTemplates();
  const { data: tags, createTag } = useContentTags();
  const { uploadAsset, isUploading } = useMediaAssets();

  // Initialize form with existing content
  useEffect(() => {
    if (contentData) {
      setTitle(contentData.title);
      setContent(contentData.content);
      setExcerpt(contentData.excerpt || '');
      setType(contentData.type);
      setStatus(contentData.status);
      setCategory(contentData.category);
      setSelectedTags(contentData.tags.map(tag => tag.id));
      setFeaturedImage(contentData.featuredImage || '');
      setMetaTitle(contentData.metadata.title);
      setMetaDescription(contentData.metadata.description);
      setMetaKeywords(contentData.metadata.keywords);
      setIsSticky(contentData.isSticky || false);
      setRequiresAuth(contentData.requiresAuth || false);
      setPremiumContent(contentData.premiumContent || false);
      setAllowComments(contentData.allowComments !== false);
    }
  }, [contentData]);

  const handleSave = async () => {
    try {
      const contentRequest: ContentCreateRequest | ContentUpdateRequest = {
        title,
        content,
        excerpt,
        type,
        category,
        tags: selectedTags,
        metadata: {
          title: metaTitle || title,
          description: metaDescription || excerpt,
          keywords: metaKeywords,
        },
        featuredImage,
        isSticky,
        requiresAuth,
        premiumContent,
        allowComments,
      };

      let result: ContentItem;

      if (isEditing && contentData) {
        result = await updateContent({
          ...contentRequest,
          id: contentData.id,
          status,
        });
      } else {
        result = await createContent(contentRequest);
      }

      onSave?.(result);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleTemplateSelect = (template: ContentTemplate) => {
    // Replace placeholders with empty values for user to fill
    let templateContent = template.template;
    template.placeholders.forEach(placeholder => {
      templateContent = templateContent.replace(
        new RegExp(`{{${placeholder}}}`, 'g'),
        `[${placeholder.replace('_', ' ').toUpperCase()}]`
      );
    });
    setContent(templateContent);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const asset = await uploadAsset(file, {
        altText: title,
        caption: `Featured image for ${title}`,
      });
      setFeaturedImage(asset.url);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleNewTag = async (tagName: string) => {
    if (!tagName.trim()) return;
    
    try {
      const newTag = await createTag({
        name: tagName.trim(),
        color: '#6B7280',
        description: `Auto-created tag: ${tagName}`,
      });
      setSelectedTags(prev => [...prev, newTag.id]);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const getStatusColor = (itemStatus: ContentStatus) => {
    switch (itemStatus) {
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

  return (
    <EnhancedWidget
      title={isEditing ? 'Edit Content' : 'Create New Content'}
      subtitle={isEditing ? `Editing: ${contentData?.title}` : 'Create a new piece of content'}
      size="extra-large"
      isLoading={isContentLoading}
      className={className}
    >
      <div className="space-y-6">
        {/* Content Templates */}
        {!isEditing && templates && templates.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Start with a Template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {template.type}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter content title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Brief description or excerpt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    placeholder="Write your content here... (Supports HTML and Markdown)"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    You can use HTML tags and Markdown syntax
                  </p>
                </div>
              </div>
            </Card>

            {/* SEO Metadata */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                SEO Metadata
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="SEO title (defaults to main title)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="SEO description (defaults to excerpt)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={metaKeywords.join(', ')}
                    onChange={(e) => setMetaKeywords(e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Separate keywords with commas
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Publishing
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={ContentStatus.DRAFT}>Draft</option>
                    <option value={ContentStatus.PUBLISHED}>Published</option>
                    <option value={ContentStatus.SCHEDULED}>Scheduled</option>
                    <option value={ContentStatus.ARCHIVED}>Archived</option>
                  </select>
                  <div className="mt-2">
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ContentType)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ContentCategory)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
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
            </Card>

            {/* Featured Image */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Featured Image
              </h3>
              
              <div className="space-y-3">
                {featuredImage && (
                  <div className="relative">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      onClick={() => setFeaturedImage('')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tags
              </h3>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags?.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                
                <div>
                  <input
                    type="text"
                    placeholder="Create new tag..."
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNewTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Press Enter to create a new tag
                  </p>
                </div>
              </div>
            </Card>

            {/* Advanced Options */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Advanced Options
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSticky}
                    onChange={(e) => setIsSticky(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Sticky (pin to top)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={requiresAuth}
                    onChange={(e) => setRequiresAuth(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Requires authentication
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={premiumContent}
                    onChange={(e) => setPremiumContent(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Premium content only
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Allow comments
                  </span>
                </label>
              </div>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="primary" 
            isLoading={isContentLoading}
            disabled={!title.trim() || !content.trim()}
          >
            {isEditing ? 'Update Content' : 'Create Content'}
          </Button>
        </div>
      </div>
    </EnhancedWidget>
  );
}