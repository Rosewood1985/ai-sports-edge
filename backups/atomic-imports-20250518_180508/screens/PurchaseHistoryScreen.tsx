import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { formatDate } from '../utils/dateUtils';
import { ThemedText, ThemedView } from '../components/ThemedComponents'
import { ThemedView } from '../atomic/atoms/ThemedView'
import { ThemedText } from '../atomic/atoms/ThemedText';

// Define the purchase history item type
interface PurchaseHistoryItem {
  id: string;
  name: string;
  date: string;
  price?: number;
  gameId?: string;
  productType: string;
  status: 'active' | 'expired' | 'pending';
}

const PurchaseHistoryScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load purchase history
  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to view your purchase history.');
        navigation.navigate('Auth');
        return;
      }
      
      // Get purchase history from AsyncStorage
      const purchaseHistoryJson = await AsyncStorage.getItem(`user_purchases_${user.uid}`);
      let purchaseHistory: PurchaseHistoryItem[] = [];
      
      if (purchaseHistoryJson) {
        purchaseHistory = JSON.parse(purchaseHistoryJson);
      }
      
      // Sort purchases by date (newest first)
      purchaseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPurchases(purchaseHistory);
    } catch (error) {
      console.error('Error loading purchase history:', error);
      Alert.alert('Error', 'Failed to load purchase history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load purchase history on mount
  useEffect(() => {
    loadPurchaseHistory();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPurchaseHistory();
  };

  // Render purchase item
  const renderPurchaseItem = ({ item }: { item: PurchaseHistoryItem }) => {
    // Determine icon based on product type
    let icon = 'cart-outline';
    if (item.productType === 'odds_access') icon = 'stats-chart';
    if (item.productType === 'premium_stats') icon = 'analytics';
    if (item.productType === 'expert_picks') icon = 'star';
    if (item.productType === 'player_comparison') icon = 'people';
    
    // Determine status color
    const statusColor = 
      item.status === 'active' ? '#4CAF50' : 
      item.status === 'expired' ? '#F44336' : 
      '#FFC107';
    
    return (
      <TouchableOpacity 
        style={[styles.purchaseItem, { borderBottomColor: colors.border }]}
        onPress={() => {
          if (item.gameId) {
            navigation.navigate('Game', { gameId: item.gameId });
          }
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color={colors.primary} />
        </View>
        
        <View style={styles.purchaseDetails}>
          <ThemedText style={styles.purchaseName}>{item.name}</ThemedText>
          <ThemedText style={styles.purchaseDate}>
            Purchased on {formatDate(new Date(item.date))}
          </ThemedText>
          
          {item.price && (
            <ThemedText style={styles.purchasePrice}>
              ${(item.price / 100).toFixed(2)}
            </ThemedText>
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cart-outline" size={64} color={colors.text} style={{ opacity: 0.5 }} />
      <ThemedText style={styles.emptyStateText}>
        You haven't made any purchases yet.
      </ThemedText>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.browseButtonText}>Browse Features</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Purchase History</ThemedText>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading purchase history...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={purchases}
          renderItem={renderPurchaseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  purchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    marginRight: 12,
  },
  purchaseDetails: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  purchaseDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  purchasePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PurchaseHistoryScreen;