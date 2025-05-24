import React, { useState, useEffect } from 'react';
import { useUserManagement } from '../../../services/adminDashboardService';
import { User, UserRole, UserStatus } from '../../../types/userManagement';
import { Table, TableHead, TableRow, TableCell, TableBody } from '../../ui/Table';
// Update the import path below to the correct location of TablePagination:
// import { TablePagination } from '../../ui/TablePagination';
// TODO: Update the import path below to the correct location of TablePagination:
import { TablePagination } from '../../ui/table/TablePagination';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { IconButton } from '../../ui/IconButton';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface UserListProps {
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onCreateUser: () => void;
}

const UserList: React.FC<UserListProps> = ({
  onViewUser,
  onEditUser,
  onDeleteUser,
  onCreateUser,
}) => {
  // Filter state
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Fetch users with filters
  const { data, isLoading, error, refetch } = useUserManagement(
    true,
    {
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      search: debouncedSearchQuery || undefined,
    },
    page,
    pageSize
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, debouncedSearchQuery]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: UserStatus) => {
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
  const getRoleBadgeColor = (role: UserRole) => {
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

  return (
    <Card className="w-full">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">User Management</h2>
          <Button variant="primary" onClick={onCreateUser}>
            Create User
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-[150px]">
            <Select
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRoleFilter(e.target.value as UserRole | '')
              }
              className="w-full"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="user">User</option>
            </Select>
          </div>

          <div className="w-[150px]">
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as UserStatus | '')
              }
              className="w-full"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center text-error p-4">Error loading users. Please try again.</div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge color={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <IconButton
                          icon="eye"
                          variant="ghost"
                          onClick={() => onViewUser(user)}
                          aria-label="View user"
                        />
                        <IconButton
                          icon="edit"
                          variant="ghost"
                          onClick={() => onEditUser(user)}
                          aria-label="Edit user"
                        />
                        <IconButton
                          icon="trash"
                          variant="ghost"
                          color="error"
                          onClick={() => onDeleteUser(user)}
                          aria-label="Delete user"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <TablePagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={data.total}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default UserList;
