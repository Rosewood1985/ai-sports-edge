import { getStorage } from 'firebase/storage';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  uploadString as fbUploadString,
  uploadBytesResumable
} from 'firebase/storage';
import firebaseApp from '../atoms/firebaseApp';

/**
 * Firebase Storage Molecule
 * Provides storage functionality
 */

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

/**
 * Upload a file to Firebase Storage
 * @param path Storage path
 * @param file File to upload
 * @returns Promise resolving to download URL
 */
const uploadFile = async (path: string, file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error(`Error uploading file to ${path}:`, error);
    throw error;
  }
};

/**
 * Upload a file with progress tracking
 * @param path Storage path
 * @param file File to upload
 * @param onProgress Progress callback
 * @returns Promise resolving to download URL
 */
const uploadFileWithProgress = (
  path: string, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error(`Error uploading file to ${path}:`, error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    } catch (error) {
      console.error(`Error setting up upload for ${path}:`, error);
      reject(error);
    }
  });
};

/**
 * Upload a string to Firebase Storage
 * @param path Storage path
 * @param content String content
 * @param contentType Content type (default: text/plain)
 * @returns Promise resolving to download URL
 */
const uploadString = async (
  path: string,
  content: string,
  contentType: string = 'text/plain'
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const metadata = { contentType };
    await fbUploadString(storageRef, content, 'raw', metadata);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error(`Error uploading string to ${path}:`, error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param path Storage path
 * @returns Promise resolving to download URL
 */
const getFileUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error(`Error getting download URL for ${path}:`, error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path Storage path
 */
const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error(`Error deleting file at ${path}:`, error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param path Storage path
 * @returns Promise resolving to array of file references
 */
const listFiles = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return result.items.map(item => item.fullPath);
  } catch (error) {
    console.error(`Error listing files in ${path}:`, error);
    throw error;
  }
};

export {
  storage,
  uploadFile,
  uploadFileWithProgress,
  getFileUrl,
  deleteFile,
  listFiles,
  ref
};