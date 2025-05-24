import React, { useState } from 'react';
import { User } from '../../../types/userManagement';
import UserList from './UserList';
import UserForm from './UserForm';
import UserDetails from './UserDetails';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useUserManagement } from '../../../services/adminDashboardService';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const UserManagement: React.FC = () => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // User management service
  const { refetch } = useUserManagement();

  // Handle view user
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewMode('view');
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  // Handle delete user
  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      try {
        // Call API to delete user
        // await deleteUser(user.id);

        // Refetch users
        refetch();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // Handle create user
  const handleCreateUser = () => {
    setSelectedUser(null);
    setViewMode('create');
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  // Handle user form submit
  const handleUserFormSubmit = async (userData: Partial<User>) => {
    try {
      if (viewMode === 'create') {
        // Call API to create user
        // await createUser(userData);
      } else if (viewMode === 'edit' && selectedUser) {
        // Call API to update user
        // await updateUser(selectedUser.id, userData);
      }

      // Refetch users and go back to list
      refetch();
      handleBackToList();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // Render content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <UserList
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onCreateUser={handleCreateUser}
          />
        );
      case 'create':
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Create User</h2>
                <Button variant="outline" onClick={handleBackToList}>
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <UserForm onSubmit={handleUserFormSubmit} />
            </CardContent>
          </Card>
        );
      case 'edit':
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Edit User</h2>
                <Button variant="outline" onClick={handleBackToList}>
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedUser && <UserForm user={selectedUser} onSubmit={handleUserFormSubmit} />}
            </CardContent>
          </Card>
        );
      case 'view':
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Details</h2>
                <Button variant="outline" onClick={handleBackToList}>
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent>{selectedUser && <UserDetails user={selectedUser} />}</CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return <div className="w-full">{renderContent()}</div>;
};

export default UserManagement;
