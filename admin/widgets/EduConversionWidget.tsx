import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  useColorScheme,
} from 'react-native';

import { firestore } from '../../config/firebase';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface EduConversionLog {
  id: string;
  userId: string;
  email: string;
  plan: string;
  planType: 'subscription' | 'one-time';
  isEdu: boolean;
  sessionId: string;
  status: string;
  createdAt: Timestamp;
  promoCodeUsed?: string;
}

/**
 * Real-time .EDU Conversion Widget for Admin Dashboard
 * Displays the last 50 educational discount conversions with live updates
 */
const EduConversionWidget: React.FC = () => {
  const [logs, setLogs] = useState<EduConversionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Create Firestore query for .edu conversions
    const logsQuery = query(
      collection(firestore, 'subscription_logs'),
      where('isEdu', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      logsQuery,
      snapshot => {
        try {
          const conversionLogs: EduConversionLog[] = snapshot.docs.map(
            doc =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as EduConversionLog
          );

          setLogs(conversionLogs);
          setLoading(false);
          setRefreshing(false);
          setError(null);
        } catch (err) {
          console.error('Error fetching edu conversions:', err);
          setError('Failed to load conversion data');
          setLoading(false);
          setRefreshing(false);
        }
      },
      err => {
        console.error('Error in real-time listener:', err);
        setError('Real-time updates unavailable');
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: Timestamp): string => {
    if (!timestamp || !timestamp.toDate) {
      return 'Unknown';
    }

    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const formatPlanName = (plan: string): string => {
    return plan.replace('price_', '').replace(/_/g, ' ').toUpperCase();
  };

  const getPlanBadgeColor = (plan: string): string => {
    if (plan.includes('annual') || plan.includes('yearly')) return '#10B981'; // Green
    if (plan.includes('premium')) return '#3B82F6'; // Blue
    if (plan.includes('basic')) return '#F59E0B'; // Orange
    if (plan.includes('group')) return '#8B5CF6'; // Purple
    return '#6B7280'; // Gray
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'payment_successful':
        return '#10B981';
      case 'session_created':
        return '#F59E0B';
      case 'payment_failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // The real-time listener will automatically update the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderConversionItem = ({ item }: { item: EduConversionLog }) => (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {/* Header with email and timestamp */}
      <View style={styles.cardHeader}>
        <View style={styles.emailContainer}>
          <Ionicons
            name="school"
            size={16}
            color={isDark ? '#60A5FA' : '#3B82F6'}
            style={styles.eduIcon}
          />
          <Text style={[styles.email, isDark && styles.emailDark]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {/* Plan and status badges */}
      <View style={styles.badgeContainer}>
        <View style={[styles.badge, { backgroundColor: getPlanBadgeColor(item.plan) }]}>
          <Text style={styles.badgeText}>{formatPlanName(item.plan)}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>

        {item.planType === 'one-time' && (
          <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.badgeText}>ONE-TIME</Text>
          </View>
        )}
      </View>

      {/* Additional info */}
      <View style={styles.metaInfo}>
        <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
          Session: {item.sessionId?.substring(0, 8)}...
        </Text>
        {item.promoCodeUsed && (
          <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
            Promo: {item.promoCodeUsed}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={48} color="#9CA3AF" />
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        No .edu conversions yet
      </Text>
      <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
        Educational discount conversions will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>🎓 .EDU Conversions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading conversions...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Widget Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>🎓 .EDU Conversions</Text>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{logs.length}</Text>
          </View>
          <View style={[styles.liveBadge, { opacity: error ? 0.5 : 1 }]}>
            <View style={[styles.liveDot, { backgroundColor: error ? '#EF4444' : '#10B981' }]} />
            <Text style={styles.liveText}>{error ? 'OFFLINE' : 'LIVE'}</Text>
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Conversion List */}
      <FlatList
        data={logs}
        renderItem={renderConversionItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#60A5FA' : '#3B82F6'}
          />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={logs.length === 0 ? styles.emptyList : undefined}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'grid' : 'list'}
        columnWrapperStyle={isTablet ? styles.row : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  titleDark: {
    color: '#F9FAFB',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyTextDark: {
    color: '#9CA3AF',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtextDark: {
    color: '#6B7280',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    marginHorizontal: isTablet ? 4 : 16,
    flex: isTablet ? 0.48 : 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  eduIcon: {
    marginRight: 6,
  },
  email: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  emailDark: {
    color: '#F9FAFB',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  timestampDark: {
    color: '#9CA3AF',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaTextDark: {
    color: '#6B7280',
  },
});

export default EduConversionWidget;
