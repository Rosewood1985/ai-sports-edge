import { PrivacyRequestStatus } from '../../atomic/atoms/privacy/gdprConfig';
import { DataAccessManager } from '../../atomic/molecules/privacy/DataAccessManager';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-request-id' })),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        userId: 'mock-user-id',
        type: 'access',
        status: 'completed',
        dataCategories: ['profileData', 'usageData'],
        format: 'json',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        downloadUrl: 'https://example.com/download',
        verificationStatus: 'verified',
      })),
      id: 'mock-request-id',
    })
  ),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: jest.fn(callback => {
        callback({
          data: jest.fn(() => ({
            userId: 'mock-user-id',
            type: 'access',
            status: 'completed',
            dataCategories: ['profileData', 'usageData'],
            format: 'json',
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: new Date(),
            downloadUrl: 'https://example.com/download',
            verificationStatus: 'verified',
          })),
          id: 'mock-request-id',
        });
      }),
    })
  ),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  updateDoc: jest.fn(() => Promise.resolve()),
  Timestamp: {
    now: jest.fn(() => new Date()),
  },
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  uploadString: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/download')),
}));

describe('DataAccessManager', () => {
  let dataAccessManager: DataAccessManager;

  beforeEach(() => {
    jest.clearAllMocks();
    dataAccessManager = new DataAccessManager();
  });

  describe('createDataAccessRequest', () => {
    it('should create a data access request', async () => {
      const userId = 'mock-user-id';
      const dataCategories = ['profileData', 'usageData'];
      const format = 'json';

      const requestId = await dataAccessManager.createDataAccessRequest(
        userId,
        dataCategories,
        format
      );

      expect(requestId).toBe('mock-request-id');
    });
  });

  describe('getDataAccessRequest', () => {
    it('should get a data access request by ID', async () => {
      const requestId = 'mock-request-id';

      const request = await dataAccessManager.getDataAccessRequest(requestId);

      expect(request).toBeDefined();
      expect(request?.id).toBe('mock-request-id');
      expect(request?.userId).toBe('mock-user-id');
      expect(request?.status).toBe('completed');
    });
  });

  describe('getUserDataAccessRequests', () => {
    it('should get all data access requests for a user', async () => {
      const userId = 'mock-user-id';

      const requests = await dataAccessManager.getUserDataAccessRequests(userId);

      expect(requests).toBeDefined();
      expect(requests.length).toBe(1);
      expect(requests[0].id).toBe('mock-request-id');
      expect(requests[0].userId).toBe('mock-user-id');
      expect(requests[0].status).toBe('completed');
    });
  });

  describe('getDownloadUrl', () => {
    it('should get the download URL for a completed request', async () => {
      const requestId = 'mock-request-id';

      const downloadUrl = await dataAccessManager.getDownloadUrl(requestId);

      expect(downloadUrl).toBe('https://example.com/download');
    });
  });
});
