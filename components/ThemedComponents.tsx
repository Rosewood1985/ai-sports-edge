import React from 'react';
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet,
  TextStyle,
  ViewStyle,
  TextInputProps,
  TouchableOpacityProps,
  ScrollViewProps,
  ViewProps
} from 'react-native';
import { useTheme } from '@react-navigation/native';

/**
 * ThemedText component that automatically uses the theme's text color
 * and accepts standard Text props like numberOfLines.
 */
import { TextProps } from 'react-native'; // Import TextProps

export const ThemedText: React.FC<TextProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  return (
    <Text style={[{ color: colors.text }, style]} {...props}>
      {children}
    </Text>
  );
};

/**
 * ThemedView component that automatically uses the theme's background color
 */
export const ThemedView: React.FC<ViewProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.background }, style]} {...props}>
      {children}
    </View>
  );
};

/**
 * ThemedCard component that provides a card-like container with theme-aware styling
 */
export const ThemedCard: React.FC<ViewProps> = ({ style, children, ...props }) => {
  const { colors, dark } = useTheme();
  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: dark ? colors.card : colors.card,
          borderColor: colors.border,
          shadowColor: dark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)'
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

/**
 * ThemedInput component that automatically uses the theme's colors
 */
export const ThemedInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  const { colors } = useTheme();
  return (
    <TextInput
      style={[
        styles.input,
        {
          color: colors.text,
          backgroundColor: colors.card,
          borderColor: colors.border
        },
        style
      ]}
      placeholderTextColor={colors.text + '80'} // 50% opacity
      {...props}
    />
  );
};

/**
 * ThemedButton component that automatically uses the theme's primary color
 */
export const ThemedButton: React.FC<
  TouchableOpacityProps & {
    title: string;
    titleStyle?: TextStyle;
    variant?: 'filled' | 'outlined' | 'text';
  }
> = ({ style, title, titleStyle, variant = 'filled', ...props }) => {
  const { colors } = useTheme();
  
  let buttonStyle: ViewStyle = {};
  let textStyle: TextStyle = {};
  
  switch (variant) {
    case 'filled':
      buttonStyle = {
        backgroundColor: colors.primary,
      };
      textStyle = {
        color: '#ffffff',
      };
      break;
    case 'outlined':
      buttonStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      };
      textStyle = {
        color: colors.primary,
      };
      break;
    case 'text':
      buttonStyle = {
        backgroundColor: 'transparent',
      };
      textStyle = {
        color: colors.primary,
      };
      break;
  }
  
  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, style]}
      {...props}
    >
      <Text style={[styles.buttonText, textStyle, titleStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * ThemedScrollView component that automatically uses the theme's background color
 */
export const ThemedScrollView: React.FC<ScrollViewProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={[{ backgroundColor: colors.background }, style]}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

/**
 * ThemedDivider component that provides a horizontal line with theme-aware styling
 */
export const ThemedDivider: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.border },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginVertical: 8,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
});