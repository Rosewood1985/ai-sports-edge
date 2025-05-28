/**
 * Atomic Atom: Error Message
 * Simple error message component using UI theme system
 * Location: /atomic/atoms/ErrorMessage.tsx
 */
import React from 'react';
import { TextStyle } from 'react-native';
import { useUITheme } from '../../components/UIThemeProvider';
import { ThemedText } from './ThemedText';

interface ErrorMessageProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Optional style overrides
   */
  style?: TextStyle;
}

/**
 * ErrorMessage component displays an error message
 * @param {ErrorMessageProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const ErrorMessage = ({ message, style }: ErrorMessageProps): JSX.Element => {
  const { theme } = useUITheme();
  
  const errorStyle: TextStyle = {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.bodyStd,
    marginVertical: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium as '500',
    fontFamily: theme.typography.fontFamily.body,
  };

  return (
    <ThemedText style={[errorStyle, style]}>
      {message}
    </ThemedText>
  );
};

export default ErrorMessage;