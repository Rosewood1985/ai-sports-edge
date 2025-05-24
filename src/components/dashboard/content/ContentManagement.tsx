import React, { useState } from 'react';
import { ContentItem } from '../../../types/contentManagement';
import { useContentManagement } from '../../../hooks/useContentManagement';
import { ContentList } from './ContentList';
import { ContentForm } from './ContentForm';
import { ContentDetails } from './ContentDetails';

type ContentView = 'list' | 'create' | 'edit' | 'details';

export const ContentManagement: React.FC = () => {
  // Current view state
  const [currentView, setCurrentView] = useState<ContentView>('list');

  // Selected content item for edit/details view
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { createContentItem, updateContentItem, deleteContentItem, currentItem } =
    useContentManagement();

  // Handle view changes
  const handleViewList = () => {
    setCurrentView('list');
    setSelectedItemId(null);
  };

  const handleViewCreate = () => {
    setCurrentView('create');
    setSelectedItemId(null);
  };

  const handleViewEdit = (item: ContentItem) => {
    setSelectedItemId(item.id);
    setCurrentView('edit');
  };

  const handleViewDetails = (item: ContentItem) => {
    setSelectedItemId(item.id);
    setCurrentView('details');
  };

  // Handle content operations
  const handleCreateContent = async (data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createContentItem(data);
      handleViewList();
    } catch (error) {
      console.error('Error creating content:', error);
      // Handle error (could show a toast notification here)
    }
  };

  const handleUpdateContent = async (data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedItemId) return;

    try {
      await updateContentItem(selectedItemId, data);
      handleViewList();
    } catch (error) {
      console.error('Error updating content:', error);
      // Handle error
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedItemId) return;

    try {
      await deleteContentItem(selectedItemId);
      handleViewList();
    } catch (error) {
      console.error('Error deleting content:', error);
      // Handle error
    }
  };

  // Render the appropriate view
  const renderView = () => {
    switch (currentView) {
      case 'create':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Content</h2>
            <ContentForm onSubmit={handleCreateContent} onCancel={handleViewList} />
          </div>
        );

      case 'edit':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Content</h2>
            <ContentForm
              initialData={currentItem || undefined}
              onSubmit={handleUpdateContent}
              onCancel={handleViewList}
            />
          </div>
        );

      case 'details':
        return (
          selectedItemId && (
            <ContentDetails
              contentId={selectedItemId}
              onEdit={() => setCurrentView('edit')}
              onDelete={handleDeleteContent}
              onBack={handleViewList}
            />
          )
        );

      case 'list':
      default:
        return (
          <ContentList
            onEdit={handleViewEdit}
            onView={handleViewDetails}
            onDelete={handleDeleteContent}
            onCreateNew={handleViewCreate}
          />
        );
    }
  };

  return <div className="container mx-auto px-4 py-6">{renderView()}</div>;
};
