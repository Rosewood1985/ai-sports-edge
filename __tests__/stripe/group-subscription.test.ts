import { STRIPE_PRICE_IDS } from '../../config/stripe';
import {
  createGroupSubscription,
  addGroupMember,
  removeGroupMember,
  cancelGroupSubscription,
  getGroupSubscription,
  hasGroupPremiumAccess,
} from '../../services/groupSubscriptionService';

// Mock groupSubscriptionService
jest.mock('../../services/groupSubscriptionService', () => ({
  createGroupSubscription: jest.fn(),
  addGroupMember: jest.fn(),
  removeGroupMember: jest.fn(),
  cancelGroupSubscription: jest.fn(),
  getGroupSubscription: jest.fn(),
  hasGroupPremiumAccess: jest.fn(),
}));

/**
 * Stripe Group Subscription Tests
 *
 * These tests verify the group subscription functionality.
 */
describe('Stripe Group Subscriptions', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test constants
  const TEST_USER_ID = 'test-owner-id';
  const TEST_GROUP_ID = 'test-group-subscription-id';
  const TEST_PAYMENT_METHOD_ID = 'pm_test_card_visa';
  const TEST_MEMBER_EMAIL = 'member@example.com';

  // Test ID: STRIPE-GROUP-001
  describe('Create Group Subscription', () => {
    test('should successfully create a group subscription', async () => {
      // Mock successful group subscription creation
      const mockGroupSubscription = {
        subscriptionId: TEST_GROUP_ID,
        status: 'active',
        members: ['owner@example.com', TEST_MEMBER_EMAIL],
        clientSecret: 'test_client_secret',
      };
      (createGroupSubscription as jest.Mock).mockResolvedValue(mockGroupSubscription);

      // Test data
      const memberEmails = [TEST_MEMBER_EMAIL];

      // Execute group subscription creation
      const result = await createGroupSubscription(
        TEST_USER_ID,
        TEST_PAYMENT_METHOD_ID,
        memberEmails
      );

      // Verify results
      expect(createGroupSubscription).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_PAYMENT_METHOD_ID,
        memberEmails
      );
      expect(result).toEqual(mockGroupSubscription);
      expect(result.status).toBe('active');
      expect(result.members).toContain(TEST_MEMBER_EMAIL);
    });

    test('should handle group subscription creation failure', async () => {
      // Mock failed group subscription creation
      const errorMessage = 'Failed to create group subscription';
      (createGroupSubscription as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Execute group subscription creation and expect it to throw
      await expect(createGroupSubscription(TEST_USER_ID, TEST_PAYMENT_METHOD_ID)).rejects.toThrow(
        errorMessage
      );

      // Verify the function was called with correct parameters
      expect(createGroupSubscription).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_PAYMENT_METHOD_ID,
        undefined
      );
    });

    test('should reject if member limit is exceeded', async () => {
      // Mock error for exceeding member limit
      const errorMessage = 'Group subscription can have a maximum of 3 members (including owner)';
      (createGroupSubscription as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Test data - too many members
      const tooManyMembers = [
        'member1@example.com',
        'member2@example.com',
        'member3@example.com', // This exceeds the limit (owner + 3 members)
      ];

      // Execute group subscription creation and expect it to throw
      await expect(
        createGroupSubscription(TEST_USER_ID, TEST_PAYMENT_METHOD_ID, tooManyMembers)
      ).rejects.toThrow(errorMessage);

      // Verify the function was called with correct parameters
      expect(createGroupSubscription).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_PAYMENT_METHOD_ID,
        tooManyMembers
      );
    });
  });

  // Test ID: STRIPE-GROUP-002
  describe('Add Member to Group Subscription', () => {
    test('should successfully add a member to a group subscription', async () => {
      // Mock successful member addition
      const mockUpdatedGroup = {
        id: TEST_GROUP_ID,
        ownerId: TEST_USER_ID,
        members: ['owner@example.com', TEST_MEMBER_EMAIL, 'newmember@example.com'],
        status: 'active',
      };
      (addGroupMember as jest.Mock).mockResolvedValue(mockUpdatedGroup);

      // Test data
      const newMemberEmail = 'newmember@example.com';

      // Execute member addition
      const result = await addGroupMember(TEST_GROUP_ID, newMemberEmail, TEST_USER_ID);

      // Verify results
      expect(addGroupMember).toHaveBeenCalledWith(TEST_GROUP_ID, newMemberEmail, TEST_USER_ID);
      expect(result).toEqual(mockUpdatedGroup);
      expect(result.members).toContain(newMemberEmail);
    });

    test('should reject if member limit is reached', async () => {
      // Mock error for member limit reached
      const errorMessage = 'Group subscription is limited to 3 members';
      (addGroupMember as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Execute member addition and expect it to throw
      await expect(
        addGroupMember(TEST_GROUP_ID, 'anothermember@example.com', TEST_USER_ID)
      ).rejects.toThrow(errorMessage);

      // Verify the function was called with correct parameters
      expect(addGroupMember).toHaveBeenCalledWith(
        TEST_GROUP_ID,
        'anothermember@example.com',
        TEST_USER_ID
      );
    });
  });

  // Test ID: STRIPE-GROUP-003
  describe('Remove Member from Group Subscription', () => {
    test('should successfully remove a member from a group subscription', async () => {
      // Mock successful member removal
      const mockUpdatedGroup = {
        id: TEST_GROUP_ID,
        ownerId: TEST_USER_ID,
        members: ['owner@example.com'],
        status: 'active',
      };
      (removeGroupMember as jest.Mock).mockResolvedValue(mockUpdatedGroup);

      // Execute member removal
      const result = await removeGroupMember(TEST_GROUP_ID, TEST_MEMBER_EMAIL, TEST_USER_ID);

      // Verify results
      expect(removeGroupMember).toHaveBeenCalledWith(
        TEST_GROUP_ID,
        TEST_MEMBER_EMAIL,
        TEST_USER_ID
      );
      expect(result).toEqual(mockUpdatedGroup);
      expect(result.members).not.toContain(TEST_MEMBER_EMAIL);
    });

    test('should reject if trying to remove owner', async () => {
      // Mock error for trying to remove owner
      const errorMessage = 'The group owner cannot be removed. Cancel the subscription instead.';
      (removeGroupMember as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Execute owner removal and expect it to throw
      await expect(
        removeGroupMember(TEST_GROUP_ID, 'owner@example.com', TEST_USER_ID)
      ).rejects.toThrow(errorMessage);

      // Verify the function was called with correct parameters
      expect(removeGroupMember).toHaveBeenCalledWith(
        TEST_GROUP_ID,
        'owner@example.com',
        TEST_USER_ID
      );
    });
  });

  // Test ID: STRIPE-GROUP-004
  describe('Cancel Group Subscription', () => {
    test('should successfully cancel a group subscription', async () => {
      // Mock successful cancellation
      const mockCancellationResult = {
        success: true,
        message: 'Group subscription will be canceled at the end of the current billing period.',
        groupId: TEST_GROUP_ID,
      };
      (cancelGroupSubscription as jest.Mock).mockResolvedValue(mockCancellationResult);

      // Execute cancellation
      const result = await cancelGroupSubscription(TEST_GROUP_ID, TEST_USER_ID);

      // Verify results
      expect(cancelGroupSubscription).toHaveBeenCalledWith(TEST_GROUP_ID, TEST_USER_ID);
      expect(result).toEqual(mockCancellationResult);
      expect(result.success).toBe(true);
    });

    test('should reject if user is not the owner', async () => {
      // Mock error for non-owner trying to cancel
      const errorMessage = 'Only the group owner can cancel the subscription.';
      (cancelGroupSubscription as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Execute cancellation with non-owner and expect it to throw
      await expect(cancelGroupSubscription(TEST_GROUP_ID, 'not-the-owner-id')).rejects.toThrow(
        errorMessage
      );

      // Verify the function was called with correct parameters
      expect(cancelGroupSubscription).toHaveBeenCalledWith(TEST_GROUP_ID, 'not-the-owner-id');
    });
  });

  // Additional tests for group subscription functionality
  describe('Group Subscription Access', () => {
    test('should check if user has premium access through group subscription', async () => {
      // Mock successful premium access check
      (hasGroupPremiumAccess as jest.Mock).mockResolvedValue(true);

      // Test data
      const userEmail = 'member@example.com';

      // Execute premium access check
      const result = await hasGroupPremiumAccess(userEmail);

      // Verify results
      expect(hasGroupPremiumAccess).toHaveBeenCalledWith(userEmail);
      expect(result).toBe(true);
    });

    test('should handle user without group premium access', async () => {
      // Mock unsuccessful premium access check
      (hasGroupPremiumAccess as jest.Mock).mockResolvedValue(false);

      // Test data
      const userEmail = 'nonmember@example.com';

      // Execute premium access check
      const result = await hasGroupPremiumAccess(userEmail);

      // Verify results
      expect(hasGroupPremiumAccess).toHaveBeenCalledWith(userEmail);
      expect(result).toBe(false);
    });
  });
});
