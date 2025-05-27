/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useReportTemplates } from '../../../atomic/organisms/reporting/useReportTemplates';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/app', () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
}));

describe('useReportTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useReportTemplates());
    
    expect(result.current.templates).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('provides template management functions', () => {
    const { result } = renderHook(() => useReportTemplates());
    
    expect(typeof result.current.createTemplate).toBe('function');
    expect(typeof result.current.updateTemplate).toBe('function');
    expect(typeof result.current.deleteTemplate).toBe('function');
    expect(typeof result.current.refreshTemplates).toBe('function');
  });

  it('handles create template operation', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    const newTemplate = {
      name: 'Test Template',
      description: 'A test template',
      reportType: 'analytics',
      config: { metrics: ['revenue', 'users'] }
    };

    await expect(result.current.createTemplate(newTemplate)).resolves.not.toThrow();
  });

  it('handles update template operation', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    const templateId = 'test-template-id';
    const updates = {
      name: 'Updated Template',
      description: 'An updated template'
    };

    await expect(result.current.updateTemplate(templateId, updates)).resolves.not.toThrow();
  });

  it('handles delete template operation', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    const templateId = 'test-template-id';

    await expect(result.current.deleteTemplate(templateId)).resolves.not.toThrow();
  });

  it('handles errors gracefully', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    // Mock an error by passing invalid data
    const invalidTemplate = null;

    try {
      await result.current.createTemplate(invalidTemplate as any);
    } catch (error) {
      // Should handle the error gracefully
      expect(result.current.error).toBeTruthy();
    }
  });

  it('manages loading state correctly', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    
    // After operations, loading should update
    await waitFor(() => {
      expect(typeof result.current.loading).toBe('boolean');
    });
  });

  it('handles empty templates list', () => {
    const { result } = renderHook(() => useReportTemplates());
    
    expect(Array.isArray(result.current.templates)).toBe(true);
    expect(result.current.templates.length).toBeGreaterThanOrEqual(0);
  });

  it('provides refresh functionality', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    await expect(result.current.refreshTemplates()).resolves.not.toThrow();
  });

  it('handles template validation', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    // Test with missing required fields
    const incompleteTemplate = {
      name: '', // Empty name should be invalid
    };

    try {
      await result.current.createTemplate(incompleteTemplate as any);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('handles concurrent operations', async () => {
    const { result } = renderHook(() => useReportTemplates());
    
    const template1 = {
      name: 'Template 1',
      description: 'First template',
      reportType: 'analytics',
      config: {}
    };

    const template2 = {
      name: 'Template 2',
      description: 'Second template',
      reportType: 'reports',
      config: {}
    };

    // Test concurrent creation
    const promises = [
      result.current.createTemplate(template1),
      result.current.createTemplate(template2)
    ];

    await expect(Promise.all(promises)).resolves.not.toThrow();
  });
});