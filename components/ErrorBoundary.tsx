import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { safeErrorCapture } from '../services/errorUtils';
import { error as logError, LogCategory } from '../services/loggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logging service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to our logging service
    logError(LogCategory.APP, 'React error boundary caught error', error, {
      componentStack: errorInfo.componentStack
    });
    
    // Send to error tracking service
    safeErrorCapture(error, {
      extra: {
        componentStack: errorInfo.componentStack
      }
    });
    
    // Update state with error details
    this.setState({
      errorInfo
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>The app encountered an unexpected error</Text>
          
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
            
            {this.state.errorInfo && (
              <>
                <Text style={styles.errorTitle}>Component Stack:</Text>
                <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
              </>
            )}
          </ScrollView>
          
          <Button title="Try Again" onPress={this.resetError} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc3545',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#6c757d',
  },
  errorContainer: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#343a40',
  },
  errorText: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;