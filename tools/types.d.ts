/**
 * Type definitions for the AI Sports Edge CLI tools
 */

// Extend the Jest namespace
declare namespace jest {
  interface Mock<T = any, Y extends any[] = any> {
    (...args: Y): T;
    mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
    mockReturnValue: (value: T) => Mock<T, Y>;
    mockReturnValueOnce: (value: T) => Mock<T, Y>;
    mockResolvedValue: (value: T) => Mock<T, Y>;
    mockResolvedValueOnce: (value: T) => Mock<T, Y>;
    mockRejectedValue: (value: any) => Mock<T, Y>;
    mockRejectedValueOnce: (value: any) => Mock<T, Y>;
    mockClear: () => Mock<T, Y>;
    mockReset: () => Mock<T, Y>;
    mockRestore: () => Mock<T, Y>;
    mockName: (name: string) => Mock<T, Y>;
    getMockName: () => string;
    mock: {
      calls: Y[];
      instances: T[];
      invocationCallOrder: number[];
      results: { type: string; value: any }[];
    };
  }

  // Mock functions
  function fn<T = any, Y extends any[] = any>(): Mock<T, Y>;
  function fn<T = any, Y extends any[] = any>(implementation: (...args: Y) => T): Mock<T, Y>;
  function clearAllMocks(): void;
  function resetAllMocks(): void;
  function restoreAllMocks(): void;
  function spyOn<T extends {}, M extends keyof T>(object: T, method: M): Mock<T[M], any[]>;
  function mock(moduleName: string, factory?: any, options?: any): void;
  function isolateModules(fn: () => void): void;
}

// Declare global Jest functions
declare const describe: (name: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const beforeAll: (fn: () => void) => void;
declare const afterAll: (fn: () => void) => void;
declare const it: (name: string, fn: () => void, timeout?: number) => void;
declare const test: typeof it;
declare const expect: any;

// Extend the Commander namespace
declare namespace commander {
  interface Command {
    hook(event: string, callback: (thisCommand: any, actionCommand: any) => void): Command;
  }
}

// Declare the context-aware operations interface
interface ContextAwareOperations {
  trackFile: (filePath: string) => boolean;
  updateContext: (context: Record<string, any>) => void;
  getContext: () => Record<string, any>;
  saveContext: () => void;
  loadContext: () => Record<string, any>;
  clearContext: () => void;
  getTrackedFiles?: () => string[];
  hasFileChanged?: (filePath: string) => boolean;
}