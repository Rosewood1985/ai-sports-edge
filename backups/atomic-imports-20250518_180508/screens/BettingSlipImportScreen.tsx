import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import PremiumFeature from '../components/PremiumFeature';
import { useTheme } from '../contexts/ThemeContext';
import { bettingSlipImportService } from '../services/bettingSlipImportService';
import {
  Sportsbook,
  ImportMethod,
  ImportedBetType,
  ImportedBetStatus,
  ValidationStatus,
  SuggestionType,
  ImportedBet,
  ImportResult,
  SubscriptionRequirements,
} from '../types/bettingSlipImport';

// TODO: Install these packages with: npm install expo-image-picker expo-clipboard
// import * as ImagePicker from 'expo-image-picker';
// import * as Clipboard from 'expo-clipboard';
// Mock implementations for now
const ImagePicker = {
  requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
  launchCameraAsync: async (options?: any) => ({
    canceled: false,
    assets: [{ uri: 'https://example.com/image.jpg' }],
  }),
  launchImageLibraryAsync: async (options?: any) => ({
    canceled: false,
    assets: [{ uri: 'https://example.com/image.jpg' }],
  }),
  MediaTypeOptions: { Images: 'images' },
};
const Clipboard = {
  getStringAsync: async () => 'Mocked clipboard text',
};

/**
 * Betting Slip Import Screen
 *
 * This screen allows users to import betting slips from various sportsbooks.
 */
const BettingSlipImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [subscriptionRequirements, setSubscriptionRequirements] =
    useState<SubscriptionRequirements | null>(null);
  const [selectedSportsbook, setSelectedSportsbook] = useState<Sportsbook | null>(null);
  const [importMethod, setImportMethod] = useState<ImportMethod | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importedBets, setImportedBets] = useState<ImportedBet[]>([]);

  // Colors for the screen
  const backgroundColor = colors.background;
  const cardBackgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const cardBorderColor = isDark ? '#333333' : '#E0E0E0';
  const textColor = colors.text;
  const primaryColor = colors.primary;

  // Check subscription requirements
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual user ID
        const userId = 'user123';
        const requirements = await bettingSlipImportService.checkSubscriptionRequirements(userId);
        setSubscriptionRequirements(requirements);
      } catch (error) {
        console.error('Error checking subscription requirements:', error);
        Alert.alert('Error', 'Failed to check subscription requirements. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take photos of betting slips.'
          );
        }
      }
    })();
  }, []);

  // Handle sportsbook selection
  const handleSelectSportsbook = (sportsbook: Sportsbook) => {
    setSelectedSportsbook(sportsbook);
    setImportMethod(null);
    setImageUri(null);
    setPastedText('');
    setImportResult(null);
  };

  // Handle import method selection
  const handleSelectImportMethod = (method: ImportMethod) => {
    setImportMethod(method);
    setImageUri(null);
    setPastedText('');
    setImportResult(null);
  };

  // Handle taking a photo
  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle picking an image
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle pasting text
  const handlePasteText = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setPastedText(text);
      } else {
        Alert.alert('Clipboard Empty', 'No text found in clipboard.');
      }
    } catch (error) {
      console.error('Error pasting text:', error);
      Alert.alert('Error', 'Failed to paste text. Please try again.');
    }
  };

  // Handle importing betting slip
  const handleImport = async () => {
    if (!selectedSportsbook || !importMethod) {
      Alert.alert('Missing Information', 'Please select a sportsbook and import method.');
      return;
    }

    try {
      setLoading(true);

      // TODO: Replace with actual user ID
      const userId = 'user123';

      let result: ImportResult;

      if (importMethod === ImportMethod.SCREENSHOT && imageUri) {
        result = await bettingSlipImportService.importFromScreenshot(
          userId,
          selectedSportsbook,
          imageUri
        );
      } else {
        // Mock result for other import methods
        result = {
          success: true,
          message: 'Successfully imported betting slip',
          bets: [
            {
              id: '123',
              userId,
              sportsbook: selectedSportsbook,
              importMethod,
              importTimestamp: Date.now(),
              betTimestamp: Date.now() - 24 * 60 * 60 * 1000,
              betType: ImportedBetType.MONEYLINE,
              sport: 'Basketball',
              league: 'NBA',
              amount: 50,
              odds: -110,
              potentialWinnings: 95.45,
              status: ImportedBetStatus.PENDING,
              description: 'Los Angeles Lakers ML',
              validationStatus: ValidationStatus.VALID,
              aiSuggestion: {
                type: SuggestionType.BETTER_ODDS,
                description: 'FanDuel offers better odds for this bet',
                confidence: 0.85,
                alternativeOdds: -105,
                alternativeSportsbook: Sportsbook.FANDUEL,
                potentialAdditionalWinnings: 2.38,
              },
            },
          ],
        };
      }

      setImportResult(result);
      if (result.success) {
        setImportedBets(result.bets);
      }
    } catch (error) {
      console.error('Error importing betting slip:', error);
      Alert.alert('Error', 'Failed to import betting slip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render sportsbook selection
  const renderSportsbookSelection = () => {
    const sportsbooks = [
      { id: Sportsbook.DRAFTKINGS, name: 'DraftKings', icon: 'logo-dribbble' },
      { id: Sportsbook.FANDUEL, name: 'FanDuel', icon: 'logo-facebook' },
      { id: Sportsbook.BETMGM, name: 'BetMGM', icon: 'logo-google' },
      { id: Sportsbook.CAESARS, name: 'Caesars', icon: 'logo-apple' },
    ];

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Select Sportsbook</ThemedText>
        <View style={styles.sportsbookGrid}>
          {sportsbooks.map(sportsbook => (
            <TouchableOpacity
              key={sportsbook.id}
              style={[
                styles.sportsbookCard,
                {
                  backgroundColor: cardBackgroundColor,
                  borderColor:
                    selectedSportsbook === sportsbook.id ? primaryColor : cardBorderColor,
                  borderWidth: selectedSportsbook === sportsbook.id ? 2 : 1,
                },
              ]}
              onPress={() => handleSelectSportsbook(sportsbook.id)}
            >
              <Ionicons
                name={sportsbook.icon as any}
                size={32}
                color={selectedSportsbook === sportsbook.id ? primaryColor : textColor}
              />
              <ThemedText style={styles.sportsbookName}>{sportsbook.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render import method selection
  const renderImportMethodSelection = () => {
    if (!selectedSportsbook) return null;

    const methods = [
      { id: ImportMethod.SCREENSHOT, name: 'Screenshot', icon: 'camera' },
      { id: ImportMethod.COPY_PASTE, name: 'Copy & Paste', icon: 'copy' },
    ];

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Select Import Method</ThemedText>
        <View style={styles.methodGrid}>
          {methods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                {
                  backgroundColor: cardBackgroundColor,
                  borderColor: importMethod === method.id ? primaryColor : cardBorderColor,
                  borderWidth: importMethod === method.id ? 2 : 1,
                },
              ]}
              onPress={() => handleSelectImportMethod(method.id)}
            >
              <Ionicons
                name={method.icon as any}
                size={32}
                color={importMethod === method.id ? primaryColor : textColor}
              />
              <ThemedText style={styles.methodName}>{method.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render screenshot import
  const renderScreenshotImport = () => {
    if (!selectedSportsbook || importMethod !== ImportMethod.SCREENSHOT) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Take a Screenshot</ThemedText>
        <View style={styles.screenshotContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.screenshotImage} />
          ) : (
            <View
              style={[
                styles.screenshotPlaceholder,
                { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
              ]}
            >
              <Ionicons name="image" size={48} color={textColor} />
              <ThemedText style={styles.screenshotPlaceholderText}>
                Take a photo or select an image of your betting slip
              </ThemedText>
            </View>
          )}

          <View style={styles.screenshotButtons}>
            <TouchableOpacity
              style={[styles.screenshotButton, { backgroundColor: primaryColor }]}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.screenshotButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.screenshotButton, { backgroundColor: primaryColor }]}
              onPress={handlePickImage}
            >
              <Ionicons name="images" size={24} color="#FFFFFF" />
              <Text style={styles.screenshotButtonText}>Pick Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render copy paste import
  const renderCopyPasteImport = () => {
    if (!selectedSportsbook || importMethod !== ImportMethod.COPY_PASTE) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Paste Betting Slip Text</ThemedText>
        <View style={styles.copyPasteContainer}>
          <TextInput
            style={[
              styles.copyPasteInput,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor,
                color: textColor,
              },
            ]}
            multiline
            placeholder="Paste your betting slip text here..."
            placeholderTextColor={isDark ? '#888888' : '#AAAAAA'}
            value={pastedText}
            onChangeText={setPastedText}
          />

          <TouchableOpacity
            style={[styles.pasteButton, { backgroundColor: primaryColor }]}
            onPress={handlePasteText}
          >
            <Ionicons name="clipboard" size={24} color="#FFFFFF" />
            <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render import button
  const renderImportButton = () => {
    if (!selectedSportsbook || !importMethod) return null;

    const isReady = importMethod === ImportMethod.SCREENSHOT ? !!imageUri : !!pastedText;

    return (
      <View style={styles.importButtonContainer}>
        <TouchableOpacity
          style={[
            styles.importButton,
            {
              backgroundColor: isReady ? primaryColor : '#CCCCCC',
              opacity: isReady ? 1 : 0.7,
            },
          ]}
          onPress={handleImport}
          disabled={!isReady || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.importButtonText}>Import Betting Slip</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render import result
  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Import Result</ThemedText>
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: importResult.success ? '#4CAF50' : '#F44336',
              borderWidth: 2,
            },
          ]}
        >
          <View style={styles.resultHeader}>
            <Ionicons
              name={importResult.success ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={importResult.success ? '#4CAF50' : '#F44336'}
            />
            <ThemedText style={styles.resultMessage}>{importResult.message}</ThemedText>
          </View>

          {importResult.success && (
            <View style={styles.importedBetsContainer}>
              {importedBets.map(bet => (
                <View
                  key={bet.id}
                  style={[
                    styles.importedBetCard,
                    { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
                  ]}
                >
                  <View style={styles.importedBetHeader}>
                    <ThemedText style={styles.importedBetType}>
                      {bet.betType.replace(/_/g, ' ')}
                    </ThemedText>
                    <ThemedText style={styles.importedBetAmount}>
                      ${bet.amount.toFixed(2)}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.importedBetDescription}>{bet.description}</ThemedText>

                  <View style={styles.importedBetDetails}>
                    <ThemedText style={styles.importedBetOdds}>
                      Odds: {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                    </ThemedText>
                    <ThemedText style={styles.importedBetWinnings}>
                      Potential Win: ${bet.potentialWinnings.toFixed(2)}
                    </ThemedText>
                  </View>

                  {bet.aiSuggestion && (
                    <View
                      style={[
                        styles.suggestionContainer,
                        {
                          backgroundColor:
                            bet.aiSuggestion.type === SuggestionType.BETTER_ODDS
                              ? '#E3F2FD'
                              : bet.aiSuggestion.type === SuggestionType.GOOD_VALUE
                                ? '#E8F5E9'
                                : bet.aiSuggestion.type === SuggestionType.AVOID
                                  ? '#FFEBEE'
                                  : '#FFF8E1',
                          borderColor:
                            bet.aiSuggestion.type === SuggestionType.BETTER_ODDS
                              ? '#2196F3'
                              : bet.aiSuggestion.type === SuggestionType.GOOD_VALUE
                                ? '#4CAF50'
                                : bet.aiSuggestion.type === SuggestionType.AVOID
                                  ? '#F44336'
                                  : '#FFC107',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          bet.aiSuggestion.type === SuggestionType.BETTER_ODDS
                            ? 'trending-up'
                            : bet.aiSuggestion.type === SuggestionType.GOOD_VALUE
                              ? 'thumbs-up'
                              : bet.aiSuggestion.type === SuggestionType.AVOID
                                ? 'thumbs-down'
                                : 'alert-circle'
                        }
                        size={20}
                        color={
                          bet.aiSuggestion.type === SuggestionType.BETTER_ODDS
                            ? '#2196F3'
                            : bet.aiSuggestion.type === SuggestionType.GOOD_VALUE
                              ? '#4CAF50'
                              : bet.aiSuggestion.type === SuggestionType.AVOID
                                ? '#F44336'
                                : '#FFC107'
                        }
                      />
                      <Text
                        style={[
                          styles.suggestionText,
                          {
                            color:
                              bet.aiSuggestion.type === SuggestionType.BETTER_ODDS
                                ? '#0D47A1'
                                : bet.aiSuggestion.type === SuggestionType.GOOD_VALUE
                                  ? '#1B5E20'
                                  : bet.aiSuggestion.type === SuggestionType.AVOID
                                    ? '#B71C1C'
                                    : '#F57F17',
                          },
                        ]}
                      >
                        {bet.aiSuggestion.description}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {!importResult.success && importResult.errorDetails && (
            <ThemedText style={styles.errorDetails}>{importResult.errorDetails}</ThemedText>
          )}
        </View>
      </View>
    );
  };

  // Render subscription required message
  const renderSubscriptionRequired = () => {
    if (!subscriptionRequirements || subscriptionRequirements.isEligible) return null;

    return (
      <PremiumFeature
        message={`Upgrade to ${subscriptionRequirements.requiredTier} to import betting slips from popular sportsbooks and get AI-powered suggestions for better odds and hedging opportunities.`}
      >
        <View style={styles.premiumFeatureContent}>
          <ThemedText style={styles.premiumFeatureTitle}>Betting Slip Import</ThemedText>
          <ThemedText style={styles.premiumFeatureDescription}>
            Import your betting slips from popular sportsbooks and get AI-powered suggestions for
            better odds and hedging opportunities.
          </ThemedText>
        </View>
      </PremiumFeature>
    );
  };

  // Render loading state
  if (loading && !subscriptionRequirements) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Betting Slip Import</ThemedText>
        <ThemedText style={styles.subtitle}>Import your betting slips from sportsbooks</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Subscription required message */}
        {renderSubscriptionRequired()}

        {/* Main content */}
        {subscriptionRequirements && subscriptionRequirements.isEligible && (
          <>
            {/* Sportsbook selection */}
            {renderSportsbookSelection()}

            {/* Import method selection */}
            {renderImportMethodSelection()}

            {/* Screenshot import */}
            {renderScreenshotImport()}

            {/* Copy paste import */}
            {renderCopyPasteImport()}

            {/* Import button */}
            {renderImportButton()}

            {/* Import result */}
            {renderImportResult()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sportsbookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportsbookCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportsbookName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  methodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  screenshotContainer: {
    alignItems: 'center',
  },
  screenshotImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  screenshotPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenshotPlaceholderText: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  screenshotButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  screenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  screenshotButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  copyPasteContainer: {
    width: '100%',
  },
  copyPasteInput: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  pasteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  importButtonContainer: {
    marginBottom: 24,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  resultCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorDetails: {
    marginTop: 8,
    color: '#F44336',
  },
  importedBetsContainer: {
    marginTop: 8,
  },
  importedBetCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  importedBetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  importedBetType: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  importedBetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  importedBetDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  importedBetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  importedBetOdds: {
    fontSize: 14,
  },
  importedBetWinnings: {
    fontSize: 14,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  suggestionText: {
    marginLeft: 8,
    flex: 1,
  },
  premiumFeatureContent: {
    width: '100%',
    padding: 16,
  },
  premiumFeatureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumFeatureDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default BettingSlipImportScreen;
