/**
 * Data Access Manager
 *
 * This class manages data access requests, allowing users to request access to their personal data.
 * It handles the creation, processing, and completion of data access requests, as well as
 * generating data exports in various formats.
 */

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import { getDataCategory } from '../../atoms/privacy/dataCategories';
import { PrivacyRequestStatus, PrivacyRequestType } from '../../atoms/privacy/gdprConfig';
import { DataAccessRequest, DataFormat } from '../../atoms/privacy/privacyTypes';

/**
 * Class for managing data access requests
 */
export class DataAccessManager {
  private db = getFirestore();
  private storage = getStorage();
  private requestsCollection = 'privacyRequests';

  /**
   * Create a data access request
   * @param userId The user ID
   * @param dataCategories The data categories to include in the request
   * @param format The format to export the data in
   * @returns The ID of the created request
   */
  async createDataAccessRequest(
    userId: string,
    dataCategories: string[],
    format: DataFormat = 'json'
  ): Promise<string> {
    try {
      // Create the request
      const request: Omit<DataAccessRequest, 'id'> = {
        userId,
        type: PrivacyRequestType.ACCESS,
        status: PrivacyRequestStatus.PENDING,
        dataCategories,
        format,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
        completedAt: undefined,
        downloadUrl: undefined,
        verificationStatus: 'pending',
      };

      // Add the request to Firestore
      const docRef = await addDoc(collection(this.db, this.requestsCollection), request);

      console.log(`Created data access request ${docRef.id} for user ${userId}`);

      // Start processing the request asynchronously
      this.processDataAccessRequest(docRef.id).catch(error => {
        console.error(`Error processing data access request ${docRef.id}:`, error);
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating data access request:', error);
      throw error;
    }
  }

  /**
   * Get a data access request by ID
   * @param requestId The request ID
   * @returns The data access request, or null if not found
   */
  async getDataAccessRequest(requestId: string): Promise<DataAccessRequest | null> {
    try {
      const docRef = doc(this.db, this.requestsCollection, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as Omit<DataAccessRequest, 'id'>;

      // Verify that this is a data access request
      if (data.type !== PrivacyRequestType.ACCESS) {
        return null;
      }

      return {
        id: docSnap.id,
        ...data,
      };
    } catch (error) {
      console.error(`Error getting data access request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get all data access requests for a user
   * @param userId The user ID
   * @returns Array of data access requests
   */
  async getUserDataAccessRequests(userId: string): Promise<DataAccessRequest[]> {
    try {
      const q = query(
        collection(this.db, this.requestsCollection),
        where('userId', '==', userId),
        where('type', '==', PrivacyRequestType.ACCESS)
      );

      const querySnapshot = await getDocs(q);
      const requests: DataAccessRequest[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<DataAccessRequest, 'id'>;
        requests.push({
          id: doc.id,
          ...data,
        });
      });

      return requests;
    } catch (error) {
      console.error(`Error getting data access requests for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process a data access request
   * @param requestId The request ID
   */
  async processDataAccessRequest(requestId: string): Promise<void> {
    try {
      // Get the request
      const request = await this.getDataAccessRequest(requestId);
      if (!request) {
        throw new Error(`Data access request ${requestId} not found`);
      }

      // Update the request status to processing
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.PROCESSING,
        updatedAt: Timestamp.now(),
      });

      // Collect the user's data
      const userData = await this.collectUserData(request.userId, request.dataCategories);

      // Generate the data export
      const exportData = await this.generateDataExport(userData, request.format);

      // Upload the export to Firebase Storage
      const downloadUrl = await this.uploadDataExport(requestId, exportData, request.format);

      // Update the request status to completed
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.COMPLETED,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        downloadUrl,
      });

      console.log(`Completed data access request ${requestId}`);
    } catch (error) {
      console.error(`Error processing data access request ${requestId}:`, error);

      // Update the request status to failed
      await updateDoc(doc(this.db, this.requestsCollection, requestId), {
        status: PrivacyRequestStatus.FAILED,
        updatedAt: Timestamp.now(),
      });
    }
  }

  /**
   * Collect user data for a data access request
   * @param userId The user ID
   * @param dataCategories The data categories to collect
   * @returns The collected user data
   */
  private async collectUserData(userId: string, dataCategories: string[]): Promise<any> {
    const userData: Record<string, any> = {};

    try {
      // Get user profile data
      if (dataCategories.includes('accountData') || dataCategories.includes('profileData')) {
        const userDoc = await getDoc(doc(this.db, 'users', userId));
        if (userDoc.exists()) {
          userData.profile = userDoc.data();
        }
      }

      // Get user activity data
      if (dataCategories.includes('usageData')) {
        const activityQuery = query(collection(this.db, 'activity'), where('userId', '==', userId));
        const activitySnapshot = await getDocs(activityQuery);
        userData.activity = [];
        activitySnapshot.forEach(doc => {
          userData.activity.push(doc.data());
        });
      }

      // Get user analytics data
      if (dataCategories.includes('analyticsData')) {
        const analyticsQuery = query(
          collection(this.db, 'analytics'),
          where('userId', '==', userId)
        );
        const analyticsSnapshot = await getDocs(analyticsQuery);
        userData.analytics = [];
        analyticsSnapshot.forEach(doc => {
          userData.analytics.push(doc.data());
        });
      }

      // Get user marketing data
      if (dataCategories.includes('marketingData')) {
        const marketingQuery = query(
          collection(this.db, 'marketing'),
          where('userId', '==', userId)
        );
        const marketingSnapshot = await getDocs(marketingQuery);
        userData.marketing = [];
        marketingSnapshot.forEach(doc => {
          userData.marketing.push(doc.data());
        });
      }

      // Get user payment data
      if (dataCategories.includes('paymentData')) {
        const paymentsQuery = query(collection(this.db, 'payments'), where('userId', '==', userId));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        userData.payments = [];
        paymentsSnapshot.forEach(doc => {
          userData.payments.push(doc.data());
        });
      }

      // Get user communication data
      if (dataCategories.includes('communicationData')) {
        const communicationsQuery = query(
          collection(this.db, 'communications'),
          where('userId', '==', userId)
        );
        const communicationsSnapshot = await getDocs(communicationsQuery);
        userData.communications = [];
        communicationsSnapshot.forEach(doc => {
          userData.communications.push(doc.data());
        });
      }

      return userData;
    } catch (error) {
      console.error(`Error collecting user data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a data export in the specified format
   * @param data The data to export
   * @param format The format to export the data in
   * @returns The exported data as a string
   */
  private async generateDataExport(data: any, format: DataFormat): Promise<string> {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'csv':
          return this.convertToCSV(data);
        case 'xml':
          return this.convertToXML(data);
        default:
          return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error(`Error generating data export in ${format} format:`, error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   * @param data The data to convert
   * @returns The data in CSV format
   */
  private convertToCSV(data: any): string {
    // This is a simplified implementation
    // In a real application, you would use a library like json2csv
    let csv = '';

    // Process each section of the data
    for (const [section, items] of Object.entries(data)) {
      csv += `\n\n${section.toUpperCase()}\n`;

      if (Array.isArray(items)) {
        // If the section is an array of objects
        if (items.length > 0) {
          // Get the headers from the first item
          const headers = Object.keys(items[0]);
          csv += headers.join(',') + '\n';

          // Add each item as a row
          for (const item of items) {
            const row = headers.map(header => {
              const value = item[header];
              return typeof value === 'object' ? JSON.stringify(value) : String(value);
            });
            csv += row.join(',') + '\n';
          }
        }
      } else if (typeof items === 'object' && items !== null) {
        // If the section is a single object
        for (const [key, value] of Object.entries(items)) {
          csv += `${key},${typeof value === 'object' ? JSON.stringify(value) : String(value)}\n`;
        }
      }
    }

    return csv;
  }

  /**
   * Convert data to XML format
   * @param data The data to convert
   * @returns The data in XML format
   */
  private convertToXML(data: any): string {
    // This is a simplified implementation
    // In a real application, you would use a library like js2xmlparser
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n';

    // Process each section of the data
    for (const [section, items] of Object.entries(data)) {
      xml += `  <${section}>\n`;

      if (Array.isArray(items)) {
        // If the section is an array of objects
        for (const item of items) {
          xml += '    <item>\n';
          for (const [key, value] of Object.entries(item)) {
            xml += `      <${key}>${
              typeof value === 'object' ? JSON.stringify(value) : String(value)
            }</${key}>\n`;
          }
          xml += '    </item>\n';
        }
      } else if (typeof items === 'object' && items !== null) {
        // If the section is a single object
        for (const [key, value] of Object.entries(items)) {
          xml += `    <${key}>${
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          }</${key}>\n`;
        }
      }

      xml += `  </${section}>\n`;
    }

    xml += '</userData>';
    return xml;
  }

  /**
   * Upload a data export to Firebase Storage
   * @param requestId The request ID
   * @param data The data to upload
   * @param format The format of the data
   * @returns The download URL for the uploaded data
   */
  private async uploadDataExport(
    requestId: string,
    data: string,
    format: DataFormat
  ): Promise<string> {
    try {
      const storageRef = ref(this.storage, `data-exports/${requestId}.${format}`);

      // Upload the data
      await uploadString(storageRef, data);

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      return downloadUrl;
    } catch (error) {
      console.error(`Error uploading data export for request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get the download URL for a completed data access request
   * @param requestId The request ID
   * @returns The download URL, or null if the request is not completed
   */
  async getDownloadUrl(requestId: string): Promise<string | null> {
    try {
      const request = await this.getDataAccessRequest(requestId);

      if (!request || request.status !== PrivacyRequestStatus.COMPLETED) {
        return null;
      }

      return request.downloadUrl || null;
    } catch (error) {
      console.error(`Error getting download URL for request ${requestId}:`, error);
      throw error;
    }
  }
}

export default DataAccessManager;
