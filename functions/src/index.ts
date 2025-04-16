import * as admin from 'firebase-admin';
import * as microtransactions from './microtransactions';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export const createOneTimePayment = microtransactions.createOneTimePayment;
export const verifyPurchase = microtransactions.verifyPurchase;
export const getUserPurchases = microtransactions.getUserPurchases;