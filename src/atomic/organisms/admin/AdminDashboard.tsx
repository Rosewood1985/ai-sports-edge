import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { MetricsPanel } from '../../molecules/admin/MetricsPanel';

export interface AdminDashboardProps {
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  title: string;
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
    }>;
  };
  children?: React.ReactNode;
  onNavigate: (itemId: string) => void;
  onLogout: () => void;
  onSettings: () => void;
  onNotificationClick: () => void;
  onMetricClick?: (panelIndex: number, metricIndex: number) => void;
}

/**
 * AdminDashboard - An organism component that combines admin header, sidebar, and content
 * 
 * @param user - User information
 * @param title - Dashboard title
 * @param metrics - Metrics data to display
 * @param navigationItems - Navigation items for the sidebar
 * @param notifications - Notification data
 * @param children - Optional content to display in the main area
 * @param onNavigate - Handler for navigation item clicks
 * @param onLogout - Handler for logout
 * @param onSettings - Handler for settings
 * @param onNotificationClick - Handler for notification clicks
 * @param onMetricClick - Optional handler for metric clicks
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  title,
  metrics,
  navigationItems,
  notifications,
  children,
  onNavigate,
  onLogout,
  onSettings,
  onNotificationClick,
  onMetricClick,
}) => {
  const [activeItemId, setActiveItemId] = useState(navigationItems[0]?.id || '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleItemClick = (itemId: string) => {
    setActiveItemId(itemId);
    onNavigate(itemId);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title={title}
        user={user}
        notifications={notifications ? {
          count: notifications.count,
          onClick: onNotificationClick,
        } : undefined}
        onLogout={onLogout}
        onSettings={onSettings}
      />
      
      <View style={styles.contentContainer}>
        <AdminSidebar
          items={navigationItems}
          activeItemId={activeItemId}
          onItemClick={handleItemClick}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        
        <ScrollView style={styles.mainContent}>
          <View style={styles.metricsContainer}>
            {metrics.map((metricPanel, panelIndex) => (
              <View key={panelIndex} style={styles.metricsPanelWrapper}>
                <MetricsPanel
                  title={metricPanel.title}
                  metrics={metricPanel.items}
                  columns={2}
                  onMetricClick={onMetricClick ? 
                    (metricIndex) => onMetricClick(panelIndex, metricIndex) : 
                    undefined
                  }
                />
              </View>
            ))}
          </View>
          
          {children && (
            <View style={styles.childrenContainer}>
              {children}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metricsPanelWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  childrenContainer: {
    flex: 1,
  },
});