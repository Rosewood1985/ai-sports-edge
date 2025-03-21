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
    padding: 20,
    paddingTop: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  featuredSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  parlayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  },
  cardTextContent: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.neon.blue,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neon.blue,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 5,
  },
  cardIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
});

export default HomeScreen;