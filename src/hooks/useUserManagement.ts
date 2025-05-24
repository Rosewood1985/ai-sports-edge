import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  User, 
  UserFilter, 
  UserListResponse, 
  UserCreateRequest, 
  UserUpdateRequest,
  Permission,
  PermissionGroup
} from '../types/userManagement';
import { ApiResponse } from '../services/adminDashboardService';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@aisportsedge.app',
    displayName: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-15T08:30:00Z',
    lastLogin: '2025-05-23T14:25:00Z',
    permissions: [
      { id: 'perm_1', name: 'users.view', description: 'View users', category: 'users' },
      { id: 'perm_2', name: 'users.edit', description: 'Edit users', category: 'users' },
      { id: 'perm_3', name: 'users.create', description: 'Create users', category: 'users' },
      { id: 'perm_4', name: 'users.delete', description: 'Delete users', category: 'users' },
      { id: 'perm_5', name: 'analytics.view', description: 'View analytics', category: 'analytics' },
      { id: 'perm_6', name: 'content.manage', description: 'Manage content', category: 'content' },
      { id: 'perm_7', name: 'settings.manage', description: 'Manage settings', category: 'settings' },
      { id: 'perm_8', name: 'system.manage', description: 'Manage system', category: 'system' },
    ]
  },
  {
    id: '2',
    email: 'editor@aisportsedge.app',
    displayName: 'Editor User',
    role: 'editor',
    status: 'active',
    createdAt: '2025-02-10T10:15:00Z',
    lastLogin: '2025-05-22T09:45:00Z',
    permissions: [
      { id: 'perm_1', name: 'users.view', description: 'View users', category: 'users' },
      { id: 'perm_5', name: 'analytics.view', description: 'View analytics', category: 'analytics' },
      { id: 'perm_6', name: 'content.manage', description: 'Manage content', category: 'content' },
    ]
  },
  {
    id: '3',
    email: 'viewer@aisportsedge.app',
    displayName: 'Viewer User',
    role: 'viewer',
    status: 'active',
    createdAt: '2025-03-05T14:20:00Z',
