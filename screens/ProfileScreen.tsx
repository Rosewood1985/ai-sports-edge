import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList, SafeAreaView } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks';

// Define types for the component props and state
interface FollowedPick {
  id: string;
  teams: string;
  pick: string;
  date: string;
  status: 'upcoming' | 'win' | 'loss';
  score?: string;
}

interface AlertItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface AccountOption {
  id: string;
  name: string;
  onPress: () => void;
}

/**
 * ProfileScreen Component
 *
 * Displays user profile, performance metrics, followed picks, alerts, and account settings.
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  // Sample data for followed picks
  const followedPicks: FollowedPick[] = [
    {
      id: 'pick1',
      teams: t('profile.celticsVsBucks'),
      pick: t('profile.celticsMinus3.5'),
      date: t('profile.today7_30PM'),
      status: 'upcoming',
    },
    {
      id: 'pick2',
      teams: t('profile.warriorsVsMavericks'),
      pick: t('profile.over226.5'),
      date: t('profile.today9_00PM'),
      status: 'upcoming',
    },
    {
      id: 'pick3',
      teams: t('profile.yankeesVsRedSox'),
      pick: t('profile.yankeesML'),
      date: t('profile.yesterday'),
      status: 'win',
      score: '5-2',
    },
    {
      id: 'pick4',
      teams: t('profile.avalancheVsWild'),
      pick: t('profile.under6.5'),
      date: t('profile.may20'),
      status: 'loss',
      score: '4-3',
    },
  ];

  // Sample data for alerts
  const alerts: AlertItem[] = [
    {
      id: 'alert1',
      name: t('profile.lineMovementLakers'),
      description: t('profile.lineMovementDesc'),
      isActive: true,
    },
    {
      id: 'alert2',
      name: t('profile.highConfidenceNBA'),
      description: t('profile.highConfidenceDesc'),
      isActive: true,
    },
    {
      id: 'alert3',
      name: t('profile.lebronProps'),
      description: t('profile.lebronPropsDesc'),
      isActive: false,
    },
  ];

  // Sample data for account settings
  const accountOptions: AccountOption[] = [
    {
      id: 'edit',
      name: t('profile.editProfile'),
      onPress: () => console.log('Edit Profile'),
    },
    {
      id: 'notifications',
      name: t('profile.notificationPreferences'),
      onPress: () => console.log('Notification Preferences'),
    },
    {
      id: 'subscription',
      name: t('profile.subscriptionBilling'),
      onPress: () => console.log('Subscription & Billing'),
    },
    {
      id: 'settings',
      name: t('profile.appSettings'),
      onPress: () => console.log('App Settings'),
    },
    {
      id: 'help',
      name: t('profile.helpSupport'),
      onPress: () => navigation.navigate('KnowledgeEdge' as never),
    },
    {
      id: 'logout',
      name: t('profile.logOut'),
      onPress: () => console.log('Log Out'),
    },
  ];

  // Sample performance data
  const performanceData = {
    followedPicks: 112,
    winRate: '68%',
    roi: '+12.4%',
  };

  // Open settings
  const openSettings = () => {
    console.log('Open settings');
  };

  // Toggle alert
  const toggleAlert = (id: string) => {
    console.log('Toggle alert', id);
  };

  // View all followed picks
  const viewAllFollowedPicks = () => {
    console.log('View all followed picks');
  };

  // Manage alerts
  const manageAlerts = () => {
    console.log('Manage alerts');
  };

  // Add new alert
  const addNewAlert = () => {
    console.log('Add new alert');
  };

  // Render followed pick item
  const renderFollowedPick = ({ item }: { item: FollowedPick }) => (
    <AccessibleThemedView
      style={styles.pickItem}
      accessibilityLabel={`${item.teams}, ${item.pick}, ${item.date}, ${item.status}`}
      accessibilityRole="button"
    >
      <View style={styles.pickInfo}>
        <AccessibleThemedText style={styles.pickTeams}>{item.teams}</AccessibleThemedText>
        <AccessibleThemedText style={styles.pickDate}>{item.date}</AccessibleThemedText>
      </View>
      <View style={styles.pickStatus}>
        <AccessibleThemedText style={[styles.pickValue, { color: colors.primary }]}>
          {item.pick}
        </AccessibleThemedText>
        {item.status === 'upcoming' ? (
          <View style={[styles.statusIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
          </View>
        ) : item.status === 'win' ? (
          <View style={[styles.statusIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
          </View>
        ) : (
          <View style={[styles.statusIcon, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="close" size={16} color={colors.error} />
          </View>
        )}
      </View>
    </AccessibleThemedView>
  );

  // Render alert item
  const renderAlert = ({ item }: { item: AlertItem }) => (
    <AccessibleThemedView
      style={styles.alertItem}
      accessibilityLabel={`${item.name}, ${item.description}, ${
        item.isActive ? t('accessibility.enabled') : t('accessibility.disabled')
      }`}
      accessibilityRole="button"
    >
      <View style={styles.alertInfo}>
        <AccessibleThemedText style={styles.alertName}>{item.name}</AccessibleThemedText>
        <AccessibleThemedText style={styles.alertDescription}>
          {item.description}
        </AccessibleThemedText>
      </View>
      <AccessibleTouchableOpacity
        style={[styles.toggleContainer, { backgroundColor: colors.card }]}
        onPress={() => toggleAlert(item.id)}
        accessibilityLabel={item.isActive ? t('accessibility.turnOff') : t('accessibility.turnOn')}
        accessibilityRole="switch"
        accessibilityState={{ checked: item.isActive }}
      >
        <View
          style={[
            styles.toggleIndicator,
            {
              backgroundColor: item.isActive ? colors.primary : colors.border,
              transform: [{ translateX: item.isActive ? 12 : 0 }],
            },
          ]}
        />
      </AccessibleTouchableOpacity>
    </AccessibleThemedView>
  );

  // Render account option item
  const renderAccountOption = ({ item }: { item: AccountOption }) => (
    <AccessibleTouchableOpacity
      style={styles.accountOption}
      onPress={item.onPress}
      accessibilityLabel={item.name}
      accessibilityRole="button"
    >
      <AccessibleThemedText style={styles.accountOptionText}>{item.name}</AccessibleThemedText>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </AccessibleTouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <AccessibleThemedView style={[styles.header, { backgroundColor: colors.primary }]}>
        <AccessibleThemedText
          style={[styles.headerTitle, { color: colors.background }]}
          accessibilityRole="header"
        >
          {t('screens.profile')}
        </AccessibleThemedText>
        <AccessibleTouchableOpacity
          onPress={openSettings}
          accessibilityLabel={t('accessibility.openSettings')}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={24} color={colors.background} />
        </AccessibleTouchableOpacity>
      </AccessibleThemedView>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile */}
        <AccessibleThemedView style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.border }]} />
          <AccessibleThemedText style={styles.userName}>Alex Johnson</AccessibleThemedText>
          <AccessibleThemedText style={styles.memberSince}>
            {t('profile.memberSince', { date: 'March 2025' })}
          </AccessibleThemedText>
          <View style={[styles.planBadge, { backgroundColor: colors.primary + '20' }]}>
            <AccessibleThemedText style={[styles.planText, { color: colors.primary }]}>
              {t('profile.analyticsPlan')}
            </AccessibleThemedText>
          </View>
        </AccessibleThemedView>

        {/* Performance Summary */}
        <AccessibleThemedView style={[styles.performanceSection, { backgroundColor: colors.card }]}>
          <AccessibleThemedText style={styles.sectionTitle}>
            {t('profile.myPerformance')}
          </AccessibleThemedText>

          <View style={styles.performanceStats}>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <AccessibleThemedText style={[styles.statValue, { color: colors.primary }]}>
                {performanceData.followedPicks}
              </AccessibleThemedText>
              <AccessibleThemedText style={styles.statLabel}>
                {t('profile.followedPicks')}
              </AccessibleThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <AccessibleThemedText style={[styles.statValue, { color: colors.success }]}>
                {performanceData.winRate}
              </AccessibleThemedText>
              <AccessibleThemedText style={styles.statLabel}>
                {t('profile.winRate')}
              </AccessibleThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <AccessibleThemedText style={[styles.statValue, { color: colors.primary }]}>
                {performanceData.roi}
              </AccessibleThemedText>
              <AccessibleThemedText style={styles.statLabel}>
                {t('profile.roi')}
              </AccessibleThemedText>
            </View>
          </View>

          {/* Performance Chart */}
          <View style={[styles.chart, { backgroundColor: colors.background }]}>
            {/* Grid Lines */}
            <View style={[styles.gridLine, { top: '25%', backgroundColor: colors.border }]} />
            <View style={[styles.gridLine, { top: '50%', backgroundColor: colors.border }]} />
            <View style={[styles.gridLine, { top: '75%', backgroundColor: colors.border }]} />

            {/* Line Chart (Simplified Representation) */}
            <View style={styles.lineChart}>
              <View style={[styles.lineChartLine, { backgroundColor: colors.primary }]} />
            </View>

            {/* X-Axis Labels */}
            <View style={styles.chartXAxis}>
              {['Apr 1', 'Apr 15', 'May 1', 'May 15', 'Today'].map((label, index) => (
                <AccessibleThemedText key={index} style={styles.chartXLabel}>
                  {label}
                </AccessibleThemedText>
              ))}
            </View>
          </View>

          <AccessibleThemedText style={styles.chartDescription}>
            {t('profile.rollingROI')}
          </AccessibleThemedText>
        </AccessibleThemedView>

        {/* Followed Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AccessibleThemedText style={styles.sectionTitle}>
              {t('profile.myFollowedPicks')}
            </AccessibleThemedText>
            <AccessibleTouchableOpacity
              onPress={viewAllFollowedPicks}
              accessibilityLabel={t('accessibility.viewAllFollowedPicks')}
              accessibilityRole="button"
            >
              <AccessibleThemedText style={[styles.viewAll, { color: colors.primary }]}>
                {t('profile.viewAll')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </View>

          <AccessibleThemedView style={[styles.card, { backgroundColor: colors.card }]}>
            <FlatList
              data={followedPicks}
              renderItem={renderFollowedPick}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            />
          </AccessibleThemedView>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AccessibleThemedText style={styles.sectionTitle}>
              {t('profile.myAlerts')}
            </AccessibleThemedText>
            <AccessibleTouchableOpacity
              onPress={manageAlerts}
              accessibilityLabel={t('accessibility.manageAlerts')}
              accessibilityRole="button"
            >
              <AccessibleThemedText style={[styles.viewAll, { color: colors.primary }]}>
                {t('profile.manage')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </View>

          <AccessibleThemedView style={[styles.card, { backgroundColor: colors.card }]}>
            <FlatList
              data={alerts}
              renderItem={renderAlert}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <AccessibleTouchableOpacity
              style={styles.addAlertButton}
              onPress={addNewAlert}
              accessibilityLabel={t('accessibility.addNewAlert')}
              accessibilityRole="button"
            >
              <AccessibleThemedText style={[styles.addAlertText, { color: colors.primary }]}>
                + {t('profile.addNewAlert')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </AccessibleThemedView>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <AccessibleThemedText style={styles.sectionTitle}>
            {t('profile.accountSettings')}
          </AccessibleThemedText>

          <AccessibleThemedView style={[styles.card, { backgroundColor: colors.card }]}>
            <FlatList
              data={accountOptions}
              renderItem={renderAccountOption}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            />
          </AccessibleThemedView>
        </View>
      </ScrollView>

      {/* Tab Navigation */}
      <AccessibleThemedView
        style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        {['Home', 'Prediction', 'Props', 'Analytics', 'More'].map((tab, index) => (
          <AccessibleTouchableOpacity
            key={index}
            style={styles.tab}
            accessibilityLabel={t(`tabs.${tab.toLowerCase()}`)}
            accessibilityRole="tab"
            accessibilityState={{ selected: index === 4 }}
          >
            <View style={[styles.tabIcon, { backgroundColor: colors.border }]} />
            <AccessibleThemedText
              style={[
                styles.tabLabel,
                {
                  color: index === 4 ? colors.primary : colors.text,
                },
              ]}
            >
              {tab}
            </AccessibleThemedText>
          </AccessibleTouchableOpacity>
        ))}
      </AccessibleThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  profileSection: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    marginBottom: 8,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  planText: {
    fontSize: 12,
    fontWeight: '500',
  },
  performanceSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chart: {
    height: 112,
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  lineChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineChartLine: {
    height: 2,
    width: '100%',
    position: 'absolute',
    top: '40%',
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
  },
  chartXLabel: {
    fontSize: 10,
  },
  chartDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  pickInfo: {
    flex: 1,
  },
  pickTeams: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickDate: {
    fontSize: 12,
  },
  pickStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 12,
  },
  toggleContainer: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  addAlertButton: {
    padding: 12,
    alignItems: 'center',
  },
  addAlertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  accountOptionText: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
});

export default ProfileScreen;
