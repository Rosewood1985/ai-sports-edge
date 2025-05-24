// User Management Types

// User Role
export type UserRole = 'admin' | 'editor' | 'viewer' | 'user';

// User Status
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// Permission
export interface Permission {
  id: string;
  name: string;
  description: string;
  category?: string;
}

// Permission Group
export interface PermissionGroup {
  id?: string;
  name?: string;
  permissions: Permission[];
  category?: string;
}

// User
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  permissions: Permission[];
  password?: string;
}

// User List Response
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User Filter
export interface UserFilter {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  permissions?: string[];
}

// User Create Request
export interface UserCreateRequest {
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
  permissions: string[];
}

// User Update Request
export interface UserUpdateRequest {
  id: string;
  email?: string;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  permissions?: string[];
}

// Mock Data
export const mockPermissions: Permission[] = [
  { id: 'perm_view_users', name: 'View Users', description: 'Can view user list and details' },
  {
    id: 'perm_manage_users',
    name: 'Manage Users',
    description: 'Can create, edit, and delete users',
  },
  { id: 'perm_view_analytics', name: 'View Analytics', description: 'Can view analytics data' },
  {
    id: 'perm_manage_analytics',
    name: 'Manage Analytics',
    description: 'Can configure analytics settings',
  },
  {
    id: 'perm_view_predictions',
    name: 'View Predictions',
    description: 'Can view prediction data',
  },
  {
    id: 'perm_manage_predictions',
    name: 'Manage Predictions',
    description: 'Can manage prediction settings',
  },
  { id: 'perm_view_games', name: 'View Games', description: 'Can view game data' },
  { id: 'perm_manage_games', name: 'Manage Games', description: 'Can manage game settings' },
  {
    id: 'perm_view_subscriptions',
    name: 'View Subscriptions',
    description: 'Can view subscription data',
  },
  {
    id: 'perm_manage_subscriptions',
    name: 'Manage Subscriptions',
    description: 'Can manage subscription settings',
  },
  { id: 'perm_view_system', name: 'View System', description: 'Can view system settings' },
  { id: 'perm_manage_system', name: 'Manage System', description: 'Can manage system settings' },
];

export const mockPermissionGroups: PermissionGroup[] = [
  {
    id: 'group_users',
    name: 'User Management',
    permissions: mockPermissions.filter(p => p.id.includes('_users')),
  },
  {
    id: 'group_analytics',
    name: 'Analytics',
    permissions: mockPermissions.filter(p => p.id.includes('_analytics')),
  },
  {
    id: 'group_predictions',
    name: 'Predictions',
    permissions: mockPermissions.filter(p => p.id.includes('_predictions')),
  },
  {
    id: 'group_games',
    name: 'Games',
    permissions: mockPermissions.filter(p => p.id.includes('_games')),
  },
  {
    id: 'group_subscriptions',
    name: 'Subscriptions',
    permissions: mockPermissions.filter(p => p.id.includes('_subscriptions')),
  },
  {
    id: 'group_system',
    name: 'System',
    permissions: mockPermissions.filter(p => p.id.includes('_system')),
  },
];

export const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLogin: '2025-05-20T10:30:00.000Z',
    permissions: mockPermissions,
  },
  {
    id: 'user2',
    email: 'editor@example.com',
    displayName: 'Editor User',
    role: 'editor',
    status: 'active',
    createdAt: '2025-01-15T00:00:00.000Z',
    lastLogin: '2025-05-19T14:45:00.000Z',
    permissions: mockPermissions.filter(
      p => p.id.startsWith('perm_view_') || p.id.includes('_predictions')
    ),
  },
  {
    id: 'user3',
    email: 'viewer@example.com',
    displayName: 'Viewer User',
    role: 'viewer',
    status: 'active',
    createdAt: '2025-02-01T00:00:00.000Z',
    lastLogin: '2025-05-18T09:15:00.000Z',
    permissions: mockPermissions.filter(p => p.id.startsWith('perm_view_')),
  },
  {
    id: 'user4',
    email: 'inactive@example.com',
    displayName: 'Inactive User',
    role: 'user',
    status: 'inactive',
    createdAt: '2025-02-15T00:00:00.000Z',
    lastLogin: '2025-03-10T11:20:00.000Z',
    permissions: [],
  },
  {
    id: 'user5',
    email: 'suspended@example.com',
    displayName: 'Suspended User',
    role: 'user',
    status: 'suspended',
    createdAt: '2025-03-01T00:00:00.000Z',
    lastLogin: '2025-04-05T16:30:00.000Z',
    permissions: [],
  },
  {
    id: 'user6',
    email: 'pending@example.com',
    displayName: 'Pending User',
    role: 'user',
    status: 'pending',
    createdAt: '2025-05-01T00:00:00.000Z',
    lastLogin: '',
    permissions: [],
  },
];

export const mockUserListResponse: UserListResponse = {
  users: mockUsers,
  total: mockUsers.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};
