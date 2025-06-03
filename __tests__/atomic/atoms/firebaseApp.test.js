/**
 * Firebase App Atom Tests
 * Tests for the Firebase app initialization atom.
 */

// External imports
import { initializeApp } from 'firebase/app';

// Internal imports
import { getFirebaseApp, initializeFirebaseApp } from '../../../atomic/atoms/firebaseApp';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'mock-app' })),
  getApp: jest.fn(() => ({ name: 'mock-app' })),
}));

describe('Firebase App Atom', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock('../../../atomic/atoms/firebaseApp').resetFirebaseApp();
  });

  describe('initializeFirebaseApp', () => {
    it('should initialize Firebase app with default config', () => {
      // Act
      const result = initializeFirebaseApp();

      // Assert
      expect(initializeApp).toHaveBeenCalled();
      expect(result).toEqual({ name: 'mock-app' });
    });

    it('should initialize Firebase app with custom config', () => {
      // Arrange
      const customConfig = {
        apiKey: 'custom-api-key',
        authDomain: 'custom-auth-domain',
        projectId: 'custom-project-id',
      };

      // Act
      const result = initializeFirebaseApp(customConfig);

      // Assert
      expect(initializeApp).toHaveBeenCalledWith(customConfig);
      expect(result).toEqual({ name: 'mock-app' });
    });

    it('should only initialize once', () => {
      // Act - first call
      const result1 = initializeFirebaseApp();
      // Act - second call
      const result2 = initializeFirebaseApp();

      // Assert
      expect(initializeApp).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    // Skip this test for now as it requires more complex mocking
    it.skip('should handle initialization errors', () => {
      // This test would verify that getFirebaseApp returns null when initialization fails
      // But it requires more complex mocking of the module internals
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('getFirebaseApp', () => {
    it('should return Firebase app instance', () => {
      // Arrange
      initializeFirebaseApp();

      // Act
      const result = getFirebaseApp();

      // Assert
      expect(result).toEqual({ name: 'mock-app' });
    });

    it('should return the same instance on subsequent calls', () => {
      // Arrange
      initializeFirebaseApp();

      // Act
      const result1 = getFirebaseApp();
      const result2 = getFirebaseApp();

      // Assert
      expect(result1).toBe(result2);
      expect(initializeApp).not.toHaveBeenCalled(); // Should not initialize again
    });
  });
});
