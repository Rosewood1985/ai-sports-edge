import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { auth } from '../config/firebase';
import { STRIPE_PRICE_IDS } from '../config/stripe';

// Initialize Firestore and Functions
const firestore = getFirestore();
const functions = getFunctions();

// Maximum number of users allowed in a group subscription
export const MAX_GROUP_MEMBERS = 3;

// Group subscription price (total)
export const GROUP_SUBSCRIPTION_PRICE = 14999; // $149.99

/**
 * Create a new group subscription
 * @param ownerId User ID of the group owner
 * @param paymentMethodId Stripe payment method ID
 * @param memberEmails Array of member emails (optional, can be added later)
 * @returns Group subscription object
 */
export const createGroupSubscription = async (
  ownerId: string,
  paymentMethodId: string,
  memberEmails?: string[]
): Promise<any> => {
  try {
    // Validate member count
    if (memberEmails && memberEmails.length > MAX_GROUP_MEMBERS - 1) {
      throw new Error(
        `Group subscription can have a maximum of ${MAX_GROUP_MEMBERS} members (including owner)`
      );
    }

    // Call the Cloud Function to create the group subscription
    const createGroupSubscriptionFn = httpsCallable(functions, 'createGroupSubscription');
    const result = await createGroupSubscriptionFn({
      paymentMethodId,
      priceId: STRIPE_PRICE_IDS.GROUP_PRO_MONTHLY,
      memberEmails,
    });

    // Return the group subscription data
    return result.data;
  } catch (error: any) {
    console.error('Error creating group subscription:', error);
    throw new Error(error.message || 'Failed to create group subscription');
  }
};

/**
 * Get a group subscription by ID
 * @param groupId Group subscription ID
 * @returns Group subscription object or null if not found
 */
export const getGroupSubscription = async (groupId: string): Promise<any> => {
  try {
    // Get the group subscription document
    const groupSubscriptionRef = doc(firestore, 'groupSubscriptions', groupId);
    const groupSubscriptionDoc = await getDoc(groupSubscriptionRef);

    if (!groupSubscriptionDoc.exists()) {
      return null;
    }

    return {
      id: groupSubscriptionDoc.id,
      ...groupSubscriptionDoc.data(),
    };
  } catch (error) {
    console.error('Error getting group subscription:', error);
    return null;
  }
};

/**
 * Get all group subscriptions owned by a user
 * @param userId User ID
 * @returns Array of group subscriptions
 */
export const getOwnedGroupSubscriptions = async (userId: string): Promise<any[]> => {
  try {
    // Query group subscriptions owned by the user
    const groupSubscriptionsRef = collection(firestore, 'groupSubscriptions');
    const q = query(groupSubscriptionsRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);

    // Convert query snapshot to array of group subscriptions
    const groupSubscriptions: any[] = [];
    querySnapshot.forEach(doc => {
      groupSubscriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return groupSubscriptions;
  } catch (error) {
    console.error('Error getting owned group subscriptions:', error);
    return [];
  }
};

/**
 * Get all group subscriptions a user is a member of
 * @param userEmail User email
 * @returns Array of group subscriptions
 */
export const getMemberGroupSubscriptions = async (userEmail: string): Promise<any[]> => {
  try {
    // Query group subscriptions where the user is a member
    const groupSubscriptionsRef = collection(firestore, 'groupSubscriptions');
    const q = query(groupSubscriptionsRef, where('members', 'array-contains', userEmail));
    const querySnapshot = await getDocs(q);

    // Convert query snapshot to array of group subscriptions
    const groupSubscriptions: any[] = [];
    querySnapshot.forEach(doc => {
      groupSubscriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return groupSubscriptions;
  } catch (error) {
    console.error('Error getting member group subscriptions:', error);
    return [];
  }
};

/**
 * Check if a user is part of any active group subscription
 * @param userEmail User email
 * @returns Boolean indicating if the user is part of an active group subscription
 */
export const isPartOfActiveGroupSubscription = async (userEmail: string): Promise<boolean> => {
  try {
    // Query active group subscriptions where the user is a member
    const groupSubscriptionsRef = collection(firestore, 'groupSubscriptions');
    const q = query(
      groupSubscriptionsRef,
      where('members', 'array-contains', userEmail),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking group subscription membership:', error);
    return false;
  }
};

/**
 * Add a member to a group subscription
 * @param groupId Group subscription ID
 * @param memberEmail Email of the member to add
 * @param ownerId User ID of the group owner (for verification)
 * @returns Updated group subscription object
 */
export const addGroupMember = async (
  groupId: string,
  memberEmail: string,
  ownerId: string
): Promise<any> => {
  try {
    // Call the Cloud Function to add a member to the group subscription
    const addGroupMemberFn = httpsCallable(functions, 'addGroupMember');
    const result = await addGroupMemberFn({
      groupId,
      memberEmail,
    });

    // Return the updated group subscription data
    return result.data;
  } catch (error: any) {
    console.error('Error adding group member:', error);
    throw new Error(error.message || 'Failed to add group member');
  }
};

/**
 * Remove a member from a group subscription
 * @param groupId Group subscription ID
 * @param memberEmail Email of the member to remove
 * @param ownerId User ID of the group owner (for verification)
 * @returns Updated group subscription object
 */
export const removeGroupMember = async (
  groupId: string,
  memberEmail: string,
  ownerId: string
): Promise<any> => {
  try {
    // Call the Cloud Function to remove a member from the group subscription
    const removeGroupMemberFn = httpsCallable(functions, 'removeGroupMember');
    const result = await removeGroupMemberFn({
      groupId,
      memberEmail,
    });

    // Return the updated group subscription data
    return result.data;
  } catch (error: any) {
    console.error('Error removing group member:', error);
    throw new Error(error.message || 'Failed to remove group member');
  }
};

/**
 * Cancel a group subscription
 * @param groupId Group subscription ID
 * @param ownerId User ID of the group owner (for verification)
 * @returns Result of the cancellation
 */
export const cancelGroupSubscription = async (groupId: string, ownerId: string): Promise<any> => {
  try {
    // Call the Cloud Function to cancel the group subscription
    const cancelGroupSubscriptionFn = httpsCallable(functions, 'cancelGroupSubscription');
    const result = await cancelGroupSubscriptionFn({
      groupId,
    });

    // Return the cancellation result
    return result.data;
  } catch (error: any) {
    console.error('Error canceling group subscription:', error);
    throw new Error(error.message || 'Failed to cancel group subscription');
  }
};

/**
 * Check if a user has access to premium features through a group subscription
 * @param userEmail User email
 * @returns Boolean indicating if the user has premium access through a group subscription
 */
export const hasGroupPremiumAccess = async (userEmail: string): Promise<boolean> => {
  try {
    // Check if the user is part of an active group subscription
    return await isPartOfActiveGroupSubscription(userEmail);
  } catch (error) {
    console.error('Error checking group premium access:', error);
    return false;
  }
};

/**
 * Transfer ownership of a group subscription to another member
 * @param groupId Group subscription ID
 * @param newOwnerEmail Email of the new owner
 * @param currentOwnerId User ID of the current owner (for verification)
 * @returns Updated group subscription object
 */
export const transferGroupOwnership = async (
  groupId: string,
  newOwnerEmail: string,
  currentOwnerId: string
): Promise<any> => {
  try {
    // Call the Cloud Function to transfer ownership
    const transferGroupOwnershipFn = httpsCallable(functions, 'transferGroupOwnership');
    const result = await transferGroupOwnershipFn({
      groupId,
      newOwnerEmail,
    });

    // Return the updated group subscription data
    return result.data;
  } catch (error: any) {
    console.error('Error transferring group ownership:', error);
    throw new Error(error.message || 'Failed to transfer group ownership');
  }
};
