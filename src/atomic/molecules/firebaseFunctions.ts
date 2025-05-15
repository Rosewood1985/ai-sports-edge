import { getFunctions } from 'firebase/functions';
import { httpsCallable } from 'firebase/functions';
import firebaseApp from '../atoms/firebaseApp';

/**
 * Firebase Functions Molecule
 * Provides Cloud Functions functionality
 */

// Initialize Firebase Functions
const functions = getFunctions(firebaseApp);

/**
 * Call a Firebase Cloud Function
 * @param functionName Name of the function to call
 * @param data Data to pass to the function
 * @returns Promise resolving to function result
 */
const callFunction = async <T, R>(functionName: string, data?: T): Promise<R> => {
  try {
    const functionRef = httpsCallable<T, R>(functions, functionName);
    const result = await functionRef(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
};

export {
  functions,
  callFunction
};