import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminDashboard } from '../organisms/admin/AdminDashboard';

export interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  metrics: {
    title: string;
    items: Array<{
      title: string;
      value: string | number;
      trend?: 'up' | 'down' | 'neutral';
      trendValue?: string | number;
    }>;
  }[];
  navigationItems: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    route: string;
    badge?: {
      value: string | number;
      variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
    };
    subitems?: Array<{
      id: string;
      label: string;
      route: string;
    }>;
  }>;
  notifications?: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
      type: 'info' | 'success' | 'warning' | 'error';
      actionUrl?: string;
      actionLabel?: string;
    }>;
  };
  onNavigate: (itemId: string) => void;
  onLogout: () => void;
  onSettings: () => void;
  onNotificationClick: () => void;
  onMetricClick?: (panelIndex: number, metricIndex: number) => void;
  onNotificationAction?: (id: string, actionUrl: string) => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
}

/**
 * AdminLayout - A template component that provides a consistent layout for admin pages
 * 
 * This template uses the AdminDashboard organism to create a complete admin layout
 * with header, sidebar, metrics, and content area.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  user,
  metrics,
  navigationItems,
  notifications,
  onNavigate,
  onLogout,
  onSettings,
  onNotificationClick,
  onMetricClick,
  onNotificationAction,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDeleteNotification,
}) => {
  return (
    <View style={styles.container}>
      <AdminDashboard
        title={title}
        user={user}
        metrics={metrics}
        navigationItems={navigationItems}
        notifications={notifications}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onSettings={onSettings}
        onNotificationClick={onNotificationClick}
        onMetricClick={onMetricClick}
      >
        {children}
      </AdminDashboard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});