import React from 'react';

import { User } from '../../../types/userManagement';
import { Badge } from '../../ui/Badge';
import { Card, CardContent } from '../../ui/Card';

interface UserDetailsProps {
  user: User;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user }) => {
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'info';
      case 'user':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{user.displayName}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <Badge color={getRoleBadgeColor(user.role)} className="mt-1">
                {user.role}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <Badge color={getStatusBadgeColor(user.status)} className="mt-1">
                {user.status}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1">{formatDate(user.createdAt)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
              <p className="mt-1">{formatDate(user.lastLogin)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {user.permissions.length > 0 ? (
                user.permissions.map(permission => (
                  <Badge key={permission.id} variant="outlined" color="default" className="mb-1">
                    {permission.name}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500">No permissions assigned</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDetails;
