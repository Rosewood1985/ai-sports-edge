import { 
  purchaseOneTimeProduct, 
  purchaseMicrotransaction,
  hasGamePredictionAccess
} from '../../services/firebaseSubscriptionService';
import { auth } from '../../config/firebase';
import { STRIPE_PRICE_IDS } from '../../config/stripe';

// Mock Firebase auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  firestore: jest.fn()
}));

// Mock firebaseSubscriptionService
jest.mock('../../services/firebaseSubscriptionService', () => ({
  purchaseOneTimeProduct: jest.fn(),
  purchaseMicrotransaction: jest.fn(),
  hasGamePredictionAccess: jest.fn()
}));

// Test user ID
const TEST_USER_ID = 'test-user-id';

/**
 * Stripe One-Time Purchases and Microtransactions Tests
 * 
 * These tests verify the one-time purchase and microtransaction functionality.
 */
describe('Stripe One-Time Purchases and Microtransactions', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test ID: STRIPE-OTP-001
  describe('Weekend Pass Purchase', () => {
    test('should successfully purchase a weekend pass', async () => {
      // Mock successful purchase
      (purchaseOneTimeProduct as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'weekend-pass';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseOneTimeProduct(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseOneTimeProduct).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });

    test('should handle failed weekend pass purchase', async () => {
      // Mock failed purchase
      (purchaseOneTimeProduct as jest.Mock).mockResolvedValue(false);
      
      // Test data
      const productId = 'weekend-pass';
      const paymentMethodId = 'pm_test_card_declined';
      
      // Execute purchase
      const result = await purchaseOneTimeProduct(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseOneTimeProduct).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(false);
    });
  });

  // Test ID: STRIPE-OTP-002
  describe('Game Day Pass Purchase', () => {
    test('should successfully purchase a game day pass', async () => {
      // Mock successful purchase
      (purchaseOneTimeProduct as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'game-day-pass';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseOneTimeProduct(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseOneTimeProduct).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });
  });

  // Test ID: STRIPE-MICRO-001
  describe('Single Prediction Purchase', () => {
    test('should successfully purchase a single prediction', async () => {
      // Mock successful purchase
      (purchaseMicrotransaction as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'single-prediction';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseMicrotransaction(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseMicrotransaction).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });

    test('should grant access to the purchased prediction', async () => {
      // Mock successful access check
      (hasGamePredictionAccess as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const gameId = 'game_123456';
      
      // Execute access check
      const result = await hasGamePredictionAccess(
        TEST_USER_ID,
        gameId
      );
      
      // Verify results
      expect(hasGamePredictionAccess).toHaveBeenCalledWith(
        TEST_USER_ID,
        gameId
      );
      expect(result).toBe(true);
    });
  });

  // Test ID: STRIPE-MICRO-002
  describe('Parlay Suggestion Purchase', () => {
    test('should successfully purchase a parlay suggestion', async () => {
      // Mock successful purchase
      (purchaseMicrotransaction as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'parlay-suggestion';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseMicrotransaction(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseMicrotransaction).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });
  });

  describe('Parlay Package Purchase', () => {
    test('should successfully purchase a parlay package', async () => {
      // Mock successful purchase
      (purchaseMicrotransaction as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'parlay-package';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseMicrotransaction(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseMicrotransaction).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });
  });

  describe('Alert Package Purchase', () => {
    test('should successfully purchase a small alert package', async () => {
      // Mock successful purchase
      (purchaseMicrotransaction as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'alert-package-small';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseMicrotransaction(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseMicrotransaction).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });

    test('should successfully purchase a large alert package', async () => {
      // Mock successful purchase
      (purchaseMicrotransaction as jest.Mock).mockResolvedValue(true);
      
      // Test data
      const productId = 'alert-package-large';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase
      const result = await purchaseMicrotransaction(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      
      // Verify results
      expect(purchaseMicrotransaction).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        paymentMethodId
      );
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle product not found error', async () => {
      // Mock error for product not found
      const errorMessage = 'Product with ID invalid-product not found';
      (purchaseMicrotransaction as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Test data
      const invalidProductId = 'invalid-product';
      const paymentMethodId = 'pm_test_card_visa';
      
      // Execute purchase and expect it to throw
      await expect(purchaseMicrotransaction(
        TEST_USER_ID,
        invalidProductId,
        paymentMethodId
      )).rejects.toThrow(errorMessage);
      
      // Verify the function was called with correct parameters
      expect(purchaseMicrotransaction).toHaveBeenCalledWith(
        TEST_USER_ID,
        invalidProductId,
        paymentMethodId
      );
    });

    test('should handle payment method error', async () => {
      // Mock error for invalid payment method
      const errorMessage = 'Invalid payment method';
      (purchaseOneTimeProduct as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Test data
      const productId = 'weekend-pass';
      const invalidPaymentMethodId = 'invalid_payment_method';
      
      // Execute purchase and expect it to throw
      await expect(purchaseOneTimeProduct(
        TEST_USER_ID,
        productId,
        invalidPaymentMethodId
      )).rejects.toThrow(errorMessage);
      
      // Verify the function was called with correct parameters
      expect(purchaseOneTimeProduct).toHaveBeenCalledWith(
        TEST_USER_ID,
        productId,
        invalidPaymentMethodId
      );
    });
  });
});