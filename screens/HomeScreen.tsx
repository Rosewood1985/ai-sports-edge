import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

// Define the navigation param list
type RootStackParamList = {
  Home: undefined;
  ParlayOdds: undefined;
  AnalyticsDashboard: undefined;
  OddsComparison: undefined;
};

// Define the navigation prop type
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

/**
 * HomeScreen component
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const navigateToParlayOdds = () => {
    navigation.navigate('ParlayOdds');
  };
  
  const navigateToAnalyticsDashboard = () => {
    navigation.navigate('AnalyticsDashboard');
  };
  
  const navigateToOddsComparison = () => {
    navigation.navigate('OddsComparison');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Sports Edge</Text>
          <Text style={styles.subtitle}>Your Edge in Sports Betting</Text>
        </View>
        
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          
          <TouchableOpacity
            style={styles.parlayCard}
            onPress={navigateToParlayOdds}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Live Parlay Odds</Text>
                <Text style={styles.cardDescription}>
                  Build custom parlays with real-time odds and maximize your potential payouts
                </Text>
                <View style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>Try Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.cardIconContainer}>
                <Ionicons name="trending-up" size={48} color={Colors.neon.blue} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.parlayCard, { borderColor: Colors.neon.purple, borderWidth: 1 }]}
            onPress={navigateToAnalyticsDashboard}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, { color: Colors.neon.purple }]}>Analytics Dashboard</Text>
                <Text style={styles.cardDescription}>
                  Monitor microtransaction and cookie performance with real-time analytics
                </Text>
                <View style={[styles.cardButton, { backgroundColor: Colors.neon.purple }]}>
                  <Text style={styles.cardButtonText}>View Dashboard</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.cardIconContainer}>
                <Ionicons name="analytics" size={48} color={Colors.neon.purple} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.parlayCard, { borderColor: Colors.neon.green, borderWidth: 1 }]}
            onPress={navigateToOddsComparison}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, { color: Colors.neon.green }]}>Odds Comparison</Text>
                <Text style={styles.cardDescription}>
                  Compare odds between DraftKings and FanDuel to find the best value for your bets
                </Text>
                <View style={[styles.cardButton, { backgroundColor: Colors.neon.green }]}>
                  <Text style={styles.cardButtonText}>Compare Odds</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.cardIconContainer}>
                <Ionicons name="git-compare-outline" size={48} color={Colors.neon.green} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 24 : 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  featuredSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  parlayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 20 : 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  cardTextContent: {
    flex: 1,
    paddingRight: 10,
    minWidth: 200,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: Colors.neon.blue,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neon.blue,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 13,
  },
  cardIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
});

export default HomeScreen;