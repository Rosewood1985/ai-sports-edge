import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export interface AdminSidebarProps {
  items: Array<{
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
  activeItemId: string;
  onItemClick: (itemId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * AdminSidebar - An organism component for the admin dashboard sidebar navigation
 * 
 * @param items - Navigation items
 * @param activeItemId - Currently active item ID
 * @param onItemClick - Handler for item clicks
 * @param collapsed - Whether the sidebar is collapsed
 * @param onToggleCollapse - Handler for toggling collapse state
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  items,
  activeItemId,
  onItemClick,
  collapsed = false,
  onToggleCollapse,
}) => {
  // Get badge color based on variant
  const getBadgeColor = (variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info') => {
    switch (variant) {
      case 'primary':
        return '#0066FF';
      case 'secondary':
        return '#6B7280';
      case 'danger':
        return '#EF4444';
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={[styles.container, collapsed && styles.collapsedContainer]}>
      {onToggleCollapse && (
        <TouchableOpacity style={styles.collapseButton} onPress={onToggleCollapse}>
          <Text style={styles.collapseButtonText}>
            {collapsed ? '→' : '←'}
          </Text>
        </TouchableOpacity>
      )}
      
      <ScrollView style={styles.scrollContainer}>
        {items.map((item) => {
          const isActive = activeItemId === item.id;
          const hasSubitems = item.subitems && item.subitems.length > 0;
          const isActiveParent = hasSubitems && item.subitems?.some(subitem => subitem.id === activeItemId);
          
          return (
            <View key={item.id} style={styles.itemContainer}>
              <TouchableOpacity
                style={[
                  styles.item,
                  isActive && styles.activeItem,
                  isActiveParent && styles.activeParentItem,
                ]}
                onPress={() => onItemClick(item.id)}
              >
                {item.icon && (
                  <View style={styles.iconContainer}>
                    {item.icon}
                  </View>
                )}
                
                {!collapsed && (
                  <View style={styles.labelContainer}>
                    <Text
                      style={[
                        styles.label,
                        isActive && styles.activeLabel,
                        isActiveParent && styles.activeParentLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                )}
                
                {!collapsed && item.badge && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getBadgeColor(item.badge.variant) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.badge.value}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {!collapsed && hasSubitems && (
                <View style={styles.subitemsContainer}>
                  {item.subitems?.map(subitem => {
                    const isSubitemActive = activeItemId === subitem.id;
                    
                    return (
                      <TouchableOpacity
                        key={subitem.id}
                        style={[
                          styles.subitem,
                          isSubitemActive && styles.activeSubitem,
                        ]}
                        onPress={() => onItemClick(subitem.id)}
                      >
                        <Text
                          style={[
                            styles.subitemLabel,
                            isSubitemActive && styles.activeSubitemLabel,
                          ]}
                        >
                          {subitem.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    height: '100%',
  },
  collapsedContainer: {
    width: 60,
  },
  collapseButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginRight: 8,
    marginTop: 8,
  },
  collapseButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContainer: {
    flex: 1,
  },
  itemContainer: {
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  activeItem: {
    backgroundColor: '#E6F0FF',
  },
  activeParentItem: {
    backgroundColor: '#F3F4F6',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#0066FF',
    fontWeight: 'bold',
  },
  activeParentLabel: {
    fontWeight: 'bold',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subitemsContainer: {
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 8,
  },
  subitem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  activeSubitem: {
    backgroundColor: '#E6F0FF',
  },
  subitemLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeSubitemLabel: {
    color: '#0066FF',
    fontWeight: 'bold',
  },
});