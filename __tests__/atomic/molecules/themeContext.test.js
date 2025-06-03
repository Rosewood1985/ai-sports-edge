/**
 * Theme Context Molecule Tests
 * Tests for the theme context molecule.
 */

// External imports
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';

// Internal imports
import { ThemeContext, useTheme } from '../../../atomic/molecules/themeContext';

describe('Theme Context Molecule', () => {
  it('should provide default theme', () => {
    // Arrange
    const wrapper = ({ children }) => (
      <ThemeContext.Provider
        value={{ theme: 'light', effectiveTheme: 'light', toggleTheme: jest.fn() }}
      >
        {children}
      </ThemeContext.Provider>
    );

    // Act
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Assert
    expect(result.current.theme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('should toggle theme', () => {
    // Arrange
    const toggleTheme = jest.fn();
    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={{ theme: 'light', effectiveTheme: 'light', toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );

    // Act
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.toggleTheme();
    });

    // Assert
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
