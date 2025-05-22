import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useHaptics } from '../../../hooks/useMobile';

interface MobileInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  type?: 'default' | 'email' | 'phone' | 'number' | 'decimal';
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  theme?: 'dark' | 'light';
}

export const MobileInput: React.FC<MobileInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  type = 'default',
  multiline = false,
  numberOfLines = 1,
  icon,
  rightIcon,
  style = {},
  inputStyle = {},
  theme = 'dark',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const haptics = useHaptics();

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    haptics.lightImpact();
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim, haptics]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme === 'dark' ? '#374151' : '#D1D5DB', error ? '#EF4444' : '#3B82F6'],
  });

  const keyboardTypeMap: Record<string, any> = {
    email: 'email-address',
    phone: 'phone-pad',
    number: 'numeric',
    decimal: 'decimal-pad',
    default: 'default',
  };

  const keyboardType = keyboardTypeMap[type];

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 8,
            color: theme === 'dark' ? '#D1D5DB' : '#374151',
          }}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
          borderWidth: 2,
          borderColor: borderColor,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 12 : 16,
          minHeight: 56, // Touch-friendly height
        }}
      >
        {icon && <View style={{ marginRight: 12 }}>{icon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            {
              flex: 1,
              fontSize: 16,
              color: theme === 'dark' ? '#FFFFFF' : '#111827',
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
          {...props}
        />

        {rightIcon && <View style={{ marginLeft: 12 }}>{rightIcon}</View>}
      </Animated.View>

      {error && (
        <Text
          style={{
            fontSize: 12,
            color: '#EF4444',
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default MobileInput;
