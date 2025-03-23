import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../styles/theme';

interface ToastProps {
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface ToastOptions extends ToastProps {
  id?: number;
}

// Singleton instance for Toast
class ToastManager {
  private static instance: ToastManager;
  private toasts: ToastOptions[] = [];
  private listeners: ((toasts: ToastOptions[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public show(options: ToastOptions): number {
    const id = Date.now();
    const toast = { ...options, id };
    this.toasts.push(toast);
    this.notifyListeners();

    // Auto-hide toast after duration
    setTimeout(() => {
      this.hide(id);
    }, options.duration || 3000);

    return id;
  }

  public hide(id: number): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  public addListener(listener: (toasts: ToastOptions[]) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (toasts: ToastOptions[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

// ToastMessage component
const ToastMessage: React.FC<ToastProps> = ({
  message,
  duration = 3000,
  position = 'bottom',
  style,
  textStyle,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration - 600),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, duration]);

  const positionStyle = position === 'top' ? styles.top : styles.bottom;

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        { opacity },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.text, textStyle]}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// ToastContainer component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const toastManager = ToastManager.getInstance();

  useEffect(() => {
    const handleToastsChange = (newToasts: ToastOptions[]) => {
      setToasts(newToasts);
    };

    toastManager.addListener(handleToastsChange);

    return () => {
      toastManager.removeListener(handleToastsChange);
    };
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          duration={toast.duration}
          position={toast.position}
          style={toast.style}
          textStyle={toast.textStyle}
        />
      ))}
    </>
  );
};

// Export Toast API
export const Toast = {
  show: (options: ToastOptions): number => {
    return ToastManager.getInstance().show(options);
  },
  hide: (id: number): void => {
    ToastManager.getInstance().hide(id);
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  top: {
    top: Platform.OS === 'ios' ? 50 : 30,
  },
  bottom: {
    bottom: Platform.OS === 'ios' ? 50 : 30,
  },
  content: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: '80%',
  },
  text: {
    color: colors.text.primary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Toast;