const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("./stripeConfig").stripe;

// Initialize Firestore
const db = admin.firestore();

/**
 * Create a group subscription
 * @param {Object} data - Request data
 * @param {string} data.paymentMethodId - Stripe payment method ID
 * @param {string} data.priceId - Stripe price ID for group subscription
 * @param {Array<string>} data.memberEmails - Array of member emails (optional)
 * @returns {Object} - Group subscription details
 */
exports.createGroupSubscription = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to create a group subscription."
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    // Validate required fields
    if (!data.paymentMethodId || !data.priceId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Payment method ID and price ID are required."
      );
    }

    // Get user document
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found."
      );
    }

    const userData = userDoc.data();

    // Check if user already has a Stripe customer ID
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUserId: userId
        }
      });
      
      customerId = customer.id;
      
      // Update user document with Stripe customer ID
      await userRef.update({
        stripeCustomerId: customerId
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: customerId
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: data.paymentMethodId
      }
    });

    // Create subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: data.priceId
        }
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription"
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        type: "group_subscription",
        firebaseUserId: userId
      }
    });

    // Initialize members array with owner's email
    const members = [userEmail];
    
    // Add additional members if provided
    if (data.memberEmails && Array.isArray(data.memberEmails)) {
      // Filter out owner's email and duplicates
      const additionalMembers = data.memberEmails.filter(
        email => email !== userEmail && !members.includes(email)
      );
      
      members.push(...additionalMembers);
    }

    // Create group subscription in Firestore
    const groupSubscriptionRef = db.collection("groupSubscriptions").doc(subscription.id);
    
    await groupSubscriptionRef.set({
      ownerId: userId,
      ownerEmail: userEmail,
      members: members,
      status: subscription.status,
      priceId: data.priceId,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      maxMembers: 3, // Maximum number of members allowed
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId
    });

    // Update user's subscription status
    await userRef.update({
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      subscriptionType: "group_owner",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Track analytics
    await db.collection("analytics").add({
      event: "group_subscription_created",
      userId: userId,
      subscriptionId: subscription.id,
      memberCount: members.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notifications to members
    for (const memberEmail of members) {
      if (memberEmail !== userEmail) {
        // Find user by email
        const membersQuery = await db.collection("users")
          .where("email", "==", memberEmail)
          .limit(1)
          .get();

        if (!membersQuery.empty) {
          const memberDoc = membersQuery.docs[0];
          const memberId = memberDoc.id;

          // Update member's subscription status
          await db.collection("users").doc(memberId).update({
            subscriptionStatus: "active",
            subscriptionType: "group_member",
            groupSubscriptionId: subscription.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Add notification
          await db.collection("users").doc(memberId).collection("notifications").add({
            type: "group_subscription_invitation",
            title: "Group Subscription Invitation",
            message: `You've been added to a group subscription by ${userEmail}. You now have access to premium features!`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    // Return subscription details
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      members: members,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
  } catch (error) {
    console.error("Error creating group subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Add a member to a group subscription
 * @param {Object} data - Request data
 * @param {string} data.groupId - Group subscription ID
 * @param {string} data.memberEmail - Email of the member to add
 * @returns {Object} - Updated group subscription
 */
exports.addGroupMember = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to add a member to a group subscription."
    );
  }

  const userId = context.auth.uid;

  try {
    // Validate required fields
    if (!data.groupId || !data.memberEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Group ID and member email are required."
      );
    }

    // Get group subscription
    const groupRef = db.collection("groupSubscriptions").doc(data.groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Group subscription not found."
      );
    }

    const groupData = groupDoc.data();

    // Verify user is the owner
    if (groupData.ownerId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only the group owner can add members."
      );
    }

    // Check if group is active
    if (groupData.status !== "active") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Cannot add members to an inactive group subscription."
      );
    }

    // Check if member limit is reached
    if (groupData.members.length >= groupData.maxMembers) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Group subscription is limited to ${groupData.maxMembers} members.`
      );
    }

    // Check if member is already in the group
    if (groupData.members.includes(data.memberEmail)) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Member is already in the group."
      );
    }
    
    // Check if member is already part of another active group subscription
    const otherGroupsQuery = await db.collection("groupSubscriptions")
      .where("members", "array-contains", data.memberEmail)
      .where("status", "==", "active")
      .limit(1)
      .get();
      
    if (!otherGroupsQuery.empty) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "This user is already part of another active group subscription."
      );
    }

    // Add member to group
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayUnion(data.memberEmail),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Find user by email
    const membersQuery = await db.collection("users")
      .where("email", "==", data.memberEmail)
      .limit(1)
      .get();

    if (!membersQuery.empty) {
      const memberDoc = membersQuery.docs[0];
      const memberId = memberDoc.id;

      // Update member's subscription status
      await db.collection("users").doc(memberId).update({
        subscriptionStatus: "active",
        subscriptionType: "group_member",
        groupSubscriptionId: data.groupId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add notification
      await db.collection("users").doc(memberId).collection("notifications").add({
        type: "group_subscription_invitation",
        title: "Group Subscription Invitation",
        message: `You've been added to a group subscription by ${groupData.ownerEmail}. You now have access to premium features!`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Track analytics
    await db.collection("analytics").add({
      event: "group_member_added",
      userId: userId,
      subscriptionId: data.groupId,
      memberEmail: data.memberEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return updated group subscription
    const updatedGroupDoc = await groupRef.get();
    return {
      id: updatedGroupDoc.id,
      ...updatedGroupDoc.data()
    };
  } catch (error) {
    console.error("Error adding group member:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Remove a member from a group subscription
 * @param {Object} data - Request data
 * @param {string} data.groupId - Group subscription ID
 * @param {string} data.memberEmail - Email of the member to remove
 * @returns {Object} - Updated group subscription
 */
exports.removeGroupMember = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to remove a member from a group subscription."
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    // Validate required fields
    if (!data.groupId || !data.memberEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Group ID and member email are required."
      );
    }

    // Get group subscription
    const groupRef = db.collection("groupSubscriptions").doc(data.groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Group subscription not found."
      );
    }

    const groupData = groupDoc.data();

    // Verify user is the owner or the member being removed
    if (groupData.ownerId !== userId && userEmail !== data.memberEmail) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only the group owner or the member themselves can remove a member."
      );
    }

    // Check if owner is trying to remove themselves
    if (groupData.ownerEmail === data.memberEmail) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The group owner cannot be removed. Cancel the subscription instead."
      );
    }

    // Check if member is in the group
    if (!groupData.members.includes(data.memberEmail)) {
      throw new functions.https.HttpsError(
        "not-found",
        "Member is not in the group."
      );
    }

    // Remove member from group
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayRemove(data.memberEmail),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Find user by email
    const membersQuery = await db.collection("users")
      .where("email", "==", data.memberEmail)
      .limit(1)
      .get();

    if (!membersQuery.empty) {
      const memberDoc = membersQuery.docs[0];
      const memberId = memberDoc.id;

      // Update member's subscription status
      await db.collection("users").doc(memberId).update({
        subscriptionStatus: "inactive",
        subscriptionType: null,
        groupSubscriptionId: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add notification
      await db.collection("users").doc(memberId).collection("notifications").add({
        type: "group_subscription_removal",
        title: "Removed from Group Subscription",
        message: "You have been removed from a group subscription and no longer have access to premium features.",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Track analytics
    await db.collection("analytics").add({
      event: "group_member_removed",
      userId: userId,
      subscriptionId: data.groupId,
      memberEmail: data.memberEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return updated group subscription
    const updatedGroupDoc = await groupRef.get();
    return {
      id: updatedGroupDoc.id,
      ...updatedGroupDoc.data()
    };
  } catch (error) {
    console.error("Error removing group member:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cancel a group subscription
 * @param {Object} data - Request data
 * @param {string} data.groupId - Group subscription ID
 * @returns {Object} - Cancellation result
 */
exports.cancelGroupSubscription = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to cancel a group subscription."
    );
  }

  const userId = context.auth.uid;

  try {
    // Validate required fields
    if (!data.groupId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Group ID is required."
      );
    }

    // Get group subscription
    const groupRef = db.collection("groupSubscriptions").doc(data.groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Group subscription not found."
      );
    }

    const groupData = groupDoc.data();

    // Verify user is the owner
    if (groupData.ownerId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only the group owner can cancel the subscription."
      );
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(data.groupId, {
      cancel_at_period_end: true
    });

    // Update group subscription in Firestore
    await groupRef.update({
      cancelAtPeriodEnd: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Track analytics
    await db.collection("analytics").add({
      event: "group_subscription_canceled",
      userId: userId,
      subscriptionId: data.groupId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return cancellation result
    return {
      success: true,
      message: "Group subscription will be canceled at the end of the current billing period.",
      groupId: data.groupId
    };
  } catch (error) {
    console.error("Error canceling group subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Handle Stripe webhook events for group subscriptions
 * @param {Object} event - Stripe event object
 */
exports.handleGroupSubscriptionWebhook = async (event) => {
  const db = admin.firestore();

  try {
    switch (event.type) {
    case "customer.subscription.updated":
      const subscription = event.data.object;
        
      // Check if this is a group subscription
      if (subscription.metadata && subscription.metadata.type === "group_subscription") {
        // Get the group subscription
        const groupRef = db.collection("groupSubscriptions").doc(subscription.id);
        const groupDoc = await groupRef.get();
          
        if (groupDoc.exists) {
          const groupData = groupDoc.data();
            
          // Update group subscription status
          await groupRef.update({
            status: subscription.status,
            currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
            
          // Update owner's subscription status
          await db.collection("users").doc(groupData.ownerId).update({
            subscriptionStatus: subscription.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
            
          // Update members' subscription status
          for (const memberEmail of groupData.members) {
            if (memberEmail !== groupData.ownerEmail) {
              const membersQuery = await db.collection("users")
                .where("email", "==", memberEmail)
                .limit(1)
                .get();
                
              if (!membersQuery.empty) {
                const memberDoc = membersQuery.docs[0];
                await db.collection("users").doc(memberDoc.id).update({
                  subscriptionStatus: subscription.status,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          }
        }
      }
      break;
        
    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object;
        
      // Check if this is a group subscription
      if (deletedSubscription.metadata && deletedSubscription.metadata.type === "group_subscription") {
        // Get the group subscription
        const groupRef = db.collection("groupSubscriptions").doc(deletedSubscription.id);
        const groupDoc = await groupRef.get();
          
        if (groupDoc.exists) {
          const groupData = groupDoc.data();
            
          // Update group subscription status
          await groupRef.update({
            status: "canceled",
            canceledAt: admin.firestore.Timestamp.fromMillis(deletedSubscription.canceled_at * 1000),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
            
          // Update owner's subscription status
          await db.collection("users").doc(groupData.ownerId).update({
            subscriptionStatus: "canceled",
            subscriptionType: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
            
          // Update members' subscription status
          for (const memberEmail of groupData.members) {
            if (memberEmail !== groupData.ownerEmail) {
              const membersQuery = await db.collection("users")
                .where("email", "==", memberEmail)
                .limit(1)
                .get();
                
              if (!membersQuery.empty) {
                const memberDoc = membersQuery.docs[0];
                await db.collection("users").doc(memberDoc.id).update({
                  subscriptionStatus: "canceled",
                  subscriptionType: null,
                  groupSubscriptionId: null,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                  
                // Add notification
                await db.collection("users").doc(memberDoc.id).collection("notifications").add({
                  type: "group_subscription_ended",
                  title: "Group Subscription Ended",
                  message: "The group subscription you were part of has ended. You no longer have access to premium features.",
                  read: false,
                  createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          }
        }
      }
      break;
    }
  } catch (error) {
    console.error("Error handling group subscription webhook:", error);
  }
};

/**
 * Prepare payment for group subscription
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {Array<string>} data.memberEmails - Array of member emails
 * @returns {Object} - Payment setup data
 */
exports.prepareGroupSubscriptionPayment = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to create a group subscription."
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    // Validate required fields
    if (!data.userId || !data.memberEmails) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "User ID and member emails are required."
      );
    }

    // Validate member count
    if (data.memberEmails.length > 2) { // Max 3 members including owner
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Group subscription can have a maximum of 3 members (including owner)."
      );
    }

    // Get user document
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found."
      );
    }

    const userData = userDoc.data();

    // Check if user already has a Stripe customer ID
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUserId: userId
        }
      });
      
      customerId = customer.id;
      
      // Update user document with Stripe customer ID
      await userRef.update({
        stripeCustomerId: customerId
      });
    }

    // Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: "2023-10-16" }
    );

    // Create a payment intent for the group subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 14999, // $149.99
      currency: "usd",
      customer: customerId,
      setup_future_usage: "off_session",
      metadata: {
        type: "group_subscription",
        firebaseUserId: userId
      }
    });

    // Return the payment setup data
    return {
      customerId,
      ephemeralKey: ephemeralKey.secret,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error("Error preparing group subscription payment:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Transfer group subscription ownership to another member
 * @param {Object} data - Request data
 * @param {string} data.groupId - Group subscription ID
 * @param {string} data.newOwnerEmail - Email of the new owner
 * @returns {Object} - Updated group subscription
 */
exports.transferGroupOwnership = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to transfer group ownership."
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    // Validate required fields
    if (!data.groupId || !data.newOwnerEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Group ID and new owner email are required."
      );
    }

    // Get group subscription
    const groupRef = db.collection("groupSubscriptions").doc(data.groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Group subscription not found."
      );
    }

    const groupData = groupDoc.data();

    // Verify user is the current owner
    if (groupData.ownerId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only the group owner can transfer ownership."
      );
    }

    // Check if group is active
    if (groupData.status !== "active") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Cannot transfer ownership of an inactive group subscription."
      );
    }

    // Check if new owner is a member of the group
    if (!groupData.members.includes(data.newOwnerEmail)) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The new owner must be a member of the group."
      );
    }

    // Find new owner by email
    const newOwnerQuery = await db.collection("users")
      .where("email", "==", data.newOwnerEmail)
      .limit(1)
      .get();

    if (newOwnerQuery.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "New owner user not found."
      );
    }

    const newOwnerDoc = newOwnerQuery.docs[0];
    const newOwnerId = newOwnerDoc.id;
    const newOwnerData = newOwnerDoc.data();

    // Check if new owner has a Stripe customer ID
    let newOwnerCustomerId = newOwnerData.stripeCustomerId;

    if (!newOwnerCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: data.newOwnerEmail,
        metadata: {
          firebaseUserId: newOwnerId
        }
      });
      
      newOwnerCustomerId = customer.id;
      
      // Update new owner document with Stripe customer ID
      await db.collection("users").doc(newOwnerId).update({
        stripeCustomerId: newOwnerCustomerId
      });
    }

    // Update subscription in Stripe to use new owner's customer
    await stripe.subscriptions.update(data.groupId, {
      customer: newOwnerCustomerId,
      metadata: {
        firebaseUserId: newOwnerId
      }
    });

    // Update group subscription in Firestore
    await groupRef.update({
      ownerId: newOwnerId,
      ownerEmail: data.newOwnerEmail,
      stripeCustomerId: newOwnerCustomerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update previous owner's subscription status
    await db.collection("users").doc(userId).update({
      subscriptionStatus: "active",
      subscriptionType: "group_member",
      subscriptionId: null,
      groupSubscriptionId: data.groupId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update new owner's subscription status
    await db.collection("users").doc(newOwnerId).update({
      subscriptionStatus: "active",
      subscriptionType: "group_owner",
      subscriptionId: data.groupId,
      groupSubscriptionId: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add notifications
    // Notify previous owner
    await db.collection("users").doc(userId).collection("notifications").add({
      type: "group_ownership_transferred",
      title: "Group Ownership Transferred",
      message: `You have transferred ownership of your group subscription to ${data.newOwnerEmail}.`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify new owner
    await db.collection("users").doc(newOwnerId).collection("notifications").add({
      type: "group_ownership_received",
      title: "Group Ownership Received",
      message: `${userEmail} has transferred ownership of their group subscription to you. You are now responsible for managing the subscription.`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Track analytics
    await db.collection("analytics").add({
      event: "group_ownership_transferred",
      previousOwnerId: userId,
      newOwnerId: newOwnerId,
      subscriptionId: data.groupId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return updated group subscription
    const updatedGroupDoc = await groupRef.get();
    return {
      id: updatedGroupDoc.id,
      ...updatedGroupDoc.data()
    };
  } catch (error) {
    console.error("Error transferring group ownership:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Export the functions
module.exports = {
  createGroupSubscription: exports.createGroupSubscription,
  addGroupMember: exports.addGroupMember,
  removeGroupMember: exports.removeGroupMember,
  cancelGroupSubscription: exports.cancelGroupSubscription,
  prepareGroupSubscriptionPayment: exports.prepareGroupSubscriptionPayment,
  transferGroupOwnership: exports.transferGroupOwnership,
  handleGroupSubscriptionWebhook: exports.handleGroupSubscriptionWebhook
};