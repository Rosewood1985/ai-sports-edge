/**
 * Storage Utilities for Privacy Data
 *
 * This file contains utilities for secure data storage, encryption/decryption,
 * and data anonymization for privacy-related data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Prefix for privacy-related storage keys
const PRIVACY_STORAGE_PREFIX = 'privacy_';

// Encryption key storage key
const ENCRYPTION_KEY_STORAGE_KEY = 'privacy_encryption_key';

/**
 * Generate a random encryption key
 * @returns A random encryption key
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

/**
 * Get the encryption key from secure storage, or generate a new one if not found
 * @returns The encryption key
 */
export async function getEncryptionKey(): Promise<string> {
  let encryptionKey: string | null = null;

  // Try to get the encryption key from secure storage
  if (Platform.OS !== 'web') {
    try {
      encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting encryption key from secure storage:', error);
    }
  } else {
    try {
      encryptionKey = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting encryption key from async storage:', error);
    }
  }

  // If no encryption key is found, generate a new one and store it
  if (!encryptionKey) {
    encryptionKey = generateEncryptionKey();

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, encryptionKey);
      } catch (error) {
        console.error('Error storing encryption key in secure storage:', error);
      }
    } else {
      try {
        await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, encryptionKey);
      } catch (error) {
        console.error('Error storing encryption key in async storage:', error);
      }
    }
  }

  return encryptionKey;
}

/**
 * Encrypt data using AES encryption
 * @param data The data to encrypt
 * @param key The encryption key (optional, will use the stored key if not provided)
 * @returns The encrypted data as a string
 */
export async function encryptData(data: any, key?: string): Promise<string> {
  const encryptionKey = key || (await getEncryptionKey());
  const jsonData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonData, encryptionKey).toString();
}

/**
 * Decrypt data using AES encryption
 * @param encryptedData The encrypted data as a string
 * @param key The encryption key (optional, will use the stored key if not provided)
 * @returns The decrypted data
 */
export async function decryptData(encryptedData: string, key?: string): Promise<any> {
  const encryptionKey = key || (await getEncryptionKey());
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  const jsonData = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonData);
}

/**
 * Store privacy data securely
 * @param key The storage key
 * @param data The data to store
 * @param encrypt Whether to encrypt the data (default: true)
 * @returns Promise that resolves when the data is stored
 */
export async function storePrivacyData(
  key: string,
  data: any,
  encrypt: boolean = true
): Promise<void> {
  const storageKey = `${PRIVACY_STORAGE_PREFIX}${key}`;

  // Encrypt the data if requested
  const storageData = encrypt ? await encryptData(data) : JSON.stringify(data);

  // Store the data
  if (Platform.OS !== 'web' && encrypt) {
    try {
      await SecureStore.setItemAsync(storageKey, storageData);
    } catch (error) {
      console.error(`Error storing privacy data in secure storage for key ${key}:`, error);
      // Fall back to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(storageKey, storageData);
    }
  } else {
    await AsyncStorage.setItem(storageKey, storageData);
  }
}

/**
 * Retrieve privacy data
 * @param key The storage key
 * @param encrypted Whether the data is encrypted (default: true)
 * @returns The retrieved data, or null if not found
 */
export async function retrievePrivacyData(
  key: string,
  encrypted: boolean = true
): Promise<any | null> {
  const storageKey = `${PRIVACY_STORAGE_PREFIX}${key}`;
  let storageData: string | null = null;

  // Retrieve the data
  if (Platform.OS !== 'web' && encrypted) {
    try {
      storageData = await SecureStore.getItemAsync(storageKey);
    } catch (error) {
      console.error(`Error retrieving privacy data from secure storage for key ${key}:`, error);
      // Fall back to AsyncStorage if SecureStore fails
      storageData = await AsyncStorage.getItem(storageKey);
    }
  } else {
    storageData = await AsyncStorage.getItem(storageKey);
  }

  // Return null if no data is found
  if (!storageData) {
    return null;
  }

  // Decrypt the data if it's encrypted
  return encrypted ? await decryptData(storageData) : JSON.parse(storageData);
}

/**
 * Remove privacy data
 * @param key The storage key
 * @returns Promise that resolves when the data is removed
 */
export async function removePrivacyData(key: string): Promise<void> {
  const storageKey = `${PRIVACY_STORAGE_PREFIX}${key}`;

  // Remove the data from both storage types to ensure it's completely removed
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(storageKey);
    } catch (error) {
      console.error(`Error removing privacy data from secure storage for key ${key}:`, error);
    }
  }

  await AsyncStorage.removeItem(storageKey);
}

/**
 * List all privacy data keys
 * @returns Array of privacy data keys (without the prefix)
 */
export async function listPrivacyDataKeys(): Promise<string[]> {
  // Get all keys from AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();

  // Filter for privacy keys and remove the prefix
  return allKeys
    .filter(key => key.startsWith(PRIVACY_STORAGE_PREFIX))
    .map(key => key.substring(PRIVACY_STORAGE_PREFIX.length));
}

/**
 * Clear all privacy data
 * @returns Promise that resolves when all privacy data is cleared
 */
export async function clearAllPrivacyData(): Promise<void> {
  const keys = await listPrivacyDataKeys();

  // Remove each privacy data item
  for (const key of keys) {
    await removePrivacyData(key);
  }
}

/**
 * Anonymize personal data by replacing it with placeholders
 * @param data The data to anonymize
 * @param fieldsToAnonymize Array of field paths to anonymize
 * @returns The anonymized data
 */
export function anonymizeData(data: any, fieldsToAnonymize: string[]): any {
  // Clone the data to avoid modifying the original
  const anonymizedData = JSON.parse(JSON.stringify(data));

  // Anonymize each field
  for (const fieldPath of fieldsToAnonymize) {
    const fieldParts = fieldPath.split('.');
    let current = anonymizedData;

    // Navigate to the parent object of the field
    for (let i = 0; i < fieldParts.length - 1; i++) {
      const part = fieldParts[i];

      // Skip if the part doesn't exist
      if (current[part] === undefined) {
        break;
      }

      current = current[part];
    }

    // Get the field name
    const fieldName = fieldParts[fieldParts.length - 1];

    // Skip if the field doesn't exist
    if (current[fieldName] === undefined) {
      continue;
    }

    // Anonymize the field based on its type
    const value = current[fieldName];

    if (typeof value === 'string') {
      if (value.includes('@')) {
        // Email address
        current[fieldName] = 'anonymized@example.com';
      } else if (/^\d+$/.test(value)) {
        // Numeric string (e.g., phone number)
        current[fieldName] = '0000000000';
      } else {
        // Regular string
        current[fieldName] = 'ANONYMIZED';
      }
    } else if (typeof value === 'number') {
      // Number
      current[fieldName] = 0;
    } else if (typeof value === 'boolean') {
      // Boolean
      current[fieldName] = false;
    } else if (Array.isArray(value)) {
      // Array
      current[fieldName] = [];
    } else if (typeof value === 'object' && value !== null) {
      // Object
      current[fieldName] = {};
    }
  }

  return anonymizedData;
}

/**
 * Hash sensitive data using SHA-256
 * @param data The data to hash
 * @returns The hashed data
 */
export function hashSensitiveData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Mask sensitive data by replacing characters with asterisks
 * @param data The data to mask
 * @param visibleChars Number of characters to leave visible at the beginning and end
 * @returns The masked data
 */
export function maskSensitiveData(data: string, visibleChars: number = 2): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const prefix = data.substring(0, visibleChars);
  const suffix = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);

  return `${prefix}${masked}${suffix}`;
}

export default {
  generateEncryptionKey,
  getEncryptionKey,
  encryptData,
  decryptData,
  storePrivacyData,
  retrievePrivacyData,
  removePrivacyData,
  listPrivacyDataKeys,
  clearAllPrivacyData,
  anonymizeData,
  hashSensitiveData,
  maskSensitiveData,
};
