import React, { useState, useEffect } from 'react';

import { User, UserRole, UserStatus } from '../../../types/userManagement';
import { Button } from '../../ui/Button';
import { Card, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface UserFormProps {
  user?: User;
  onSubmit: (userData: Partial<User>) => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit }) => {
  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    displayName: '',
    email: '',
    role: 'user' as UserRole,
    status: 'active' as UserStatus,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data if editing
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    }
  }, [user]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                label="Name"
                name="displayName"
                value={formData.displayName || ''}
                onChange={handleChange}
                error={errors.displayName}
                fullWidth
              />
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                error={errors.email}
                fullWidth
              />
            </div>

            <div>
              <Select
                label="Role"
                name="role"
                value={formData.role || ''}
                onChange={handleChange}
                error={errors.role}
                fullWidth
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="user">User</option>
              </Select>
            </div>

            <div>
              <Select
                label="Status"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                error={errors.status}
                fullWidth
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </Select>
            </div>

            {!user && (
              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  error={errors.password}
                  helperText="Leave blank to generate a random password"
                  fullWidth
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit" variant="primary">
                {user ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default UserForm;
