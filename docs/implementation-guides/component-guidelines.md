# Component Guidelines

This guide provides guidelines for creating and using components in the AI Sports Edge application. It covers best practices, naming conventions, and implementation details for components at each level of the atomic architecture.

## Atomic Architecture Overview

The AI Sports Edge application follows the atomic architecture pattern, which organizes components into a hierarchy based on their complexity and reusability:

1. **Atoms**: Fundamental building blocks (basic UI elements, primitive functions, core utilities)
2. **Molecules**: Cohesive atom groupings (simple composed components, basic service functions)
3. **Organisms**: Complex components integrating molecules/atoms (complete features, service modules)
4. **Templates**: Layout structures (screen layouts, data flow patterns)
5. **Pages**: Specific implementations (screens, complete features)

For a more detailed overview of the atomic architecture, see the [Atomic Architecture](../core-concepts/atomic-architecture.md) documentation.

## General Guidelines

### Component Structure

All components should follow a consistent structure:

```javascript
// Import statements
import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

// Component documentation
/**
 * Component description
 * @param {object} props - Component props
 * @param {string} props.propName - Prop description
 * @returns {React.ReactElement} Component
 */
const ComponentName = ({ propName }) => {
  // Component logic

  // Component rendering
  return (
    <View>
      <Text>{propName}</Text>
    </View>
  );
};

// PropTypes
ComponentName.propTypes = {
  propName: PropTypes.string.isRequired,
};

// Default props
ComponentName.defaultProps = {
  propName: 'Default value',
};

// Export
export default ComponentName;
```

### Naming Conventions

- **Component Names**: Use PascalCase for component names (e.g., `Button`, `UserProfile`)
- **File Names**: Use PascalCase for component file names, matching the component name (e.g., `Button.js`, `UserProfile.js`)
- **Directory Names**: Use camelCase for directory names (e.g., `atoms`, `molecules`)
- **Prop Names**: Use camelCase for prop names (e.g., `onClick`, `backgroundColor`)
- **Event Handlers**: Prefix event handlers with `on` or `handle` (e.g., `onClick`, `handleSubmit`)
- **Boolean Props**: Prefix boolean props with `is`, `has`, or `should` (e.g., `isDisabled`, `hasError`)

### Documentation

All components should be documented with JSDoc comments:

```javascript
/**
 * Button component
 * @param {object} props - Component props
 * @param {string} props.text - Button text
 * @param {function} props.onPress - Button press handler
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, tertiary)
 * @returns {React.ReactElement} Button component
 * @example
 * <Button text="Press me" onPress={() => console.log('Pressed')} variant="primary" />
 */
```

### PropTypes

All components should define PropTypes for type checking:

```javascript
import PropTypes from 'prop-types';

Button.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
};

Button.defaultProps = {
  variant: 'primary',
};
```

### Styles

Use StyleSheet for defining styles:

```javascript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
```

Use the theme for colors and other design tokens:

```javascript
import { useTheme } from '../molecules/themeContext';

const MyComponent = () => {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background, padding: spacing.medium }}>
      <Text style={{ color: colors.text }}>Hello, world!</Text>
    </View>
  );
};
```

## Atoms

Atoms are the basic building blocks of the application. They are the smallest components that can be reused.

### Guidelines for Atoms

1. **Keep them simple**: Atoms should be simple and focused on a single responsibility.
2. **Make them reusable**: Atoms should be designed for reuse across the application.
3. **Avoid dependencies**: Atoms should have minimal dependencies on other components.
4. **Use props for customization**: Use props to customize the appearance and behavior of atoms.
5. **Provide sensible defaults**: Provide default values for props to make atoms easy to use.

### Example Atom

```javascript
// atomic/atoms/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../molecules/themeContext';

/**
 * Button component
 * @param {object} props - Component props
 * @param {string} props.text - Button text
 * @param {function} props.onPress - Button press handler
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, tertiary)
 * @returns {React.ReactElement} Button component
 */
const Button = ({ text, onPress, variant }) => {
  const { colors } = useTheme();

  const buttonStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.white,
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: colors.primary,
    },
  };

  return (
    <TouchableOpacity style={[styles.button, buttonStyles[variant]]} onPress={onPress}>
      <Text style={[styles.text, { color: buttonStyles[variant].color }]}>{text}</Text>
    </TouchableOpacity>
  );
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
};

Button.defaultProps = {
  variant: 'primary',
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Button;
```

## Molecules

Molecules are combinations of atoms that work together to provide more complex functionality.

### Guidelines for Molecules

1. **Compose from atoms**: Molecules should be composed of atoms and provide more complex functionality.
2. **Keep them focused**: Molecules should be focused on a specific task or feature.
3. **Limit dependencies**: Molecules should have limited dependencies on other components.
4. **Use props for customization**: Use props to customize the appearance and behavior of molecules.
5. **Provide sensible defaults**: Provide default values for props to make molecules easy to use.

### Example Molecule

```javascript
// atomic/molecules/FormField.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Input, ErrorText } from '../atoms';
import { useTheme } from './themeContext';

/**
 * FormField component
 * @param {object} props - Component props
 * @param {string} props.label - Field label
 * @param {string} props.value - Field value
 * @param {function} props.onChangeText - Change handler
 * @param {string} [props.error] - Error message
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.secureTextEntry=false] - Whether to hide text entry
 * @returns {React.ReactElement} FormField component
 */
const FormField = ({ label, value, onChangeText, error, placeholder, secureTextEntry }) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { borderColor: error ? colors.error : colors.border }]}
      />
      {error ? <ErrorText text={error} /> : null}
    </View>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  secureTextEntry: PropTypes.bool,
};

FormField.defaultProps = {
  error: null,
  placeholder: '',
  secureTextEntry: false,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});

export default FormField;
```

## Organisms

Organisms are complex components that combine molecules and atoms to provide complete functionality.

### Guidelines for Organisms

1. **Compose from molecules and atoms**: Organisms should be composed of molecules and atoms.
2. **Provide complete functionality**: Organisms should provide complete functionality for a specific feature.
3. **Manage state**: Organisms can manage their own state or receive state from props.
4. **Handle side effects**: Organisms can handle side effects like API calls.
5. **Use hooks for logic**: Use hooks to encapsulate complex logic.

### Example Organism

```javascript
// atomic/organisms/LoginForm.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Button } from '../atoms';
import { FormField } from '../molecules';
import { useAuth } from '../../hooks/useAuth';

/**
 * LoginForm component
 * @param {object} props - Component props
 * @param {function} props.onSuccess - Success callback
 * @returns {React.ReactElement} LoginForm component
 */
const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { signIn, loading, error } = useAuth();

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        await signIn(email, password);
        onSuccess();
      } catch (err) {
        // Error is handled by useAuth hook
      }
    }
  };

  return (
    <View style={styles.container}>
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Enter your password"
        secureTextEntry
      />
      {error ? <ErrorText text={error} /> : null}
      <Button text={loading ? 'Loading...' : 'Sign In'} onPress={handleSubmit} disabled={loading} />
    </View>
  );
};

LoginForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default LoginForm;
```

## Templates

Templates are layout components that provide structure for pages.

### Guidelines for Templates

1. **Focus on layout**: Templates should focus on layout and structure, not functionality.
2. **Use composition**: Templates should use composition to provide flexibility.
3. **Accept children**: Templates should accept children to render content.
4. **Provide slots**: Templates can provide slots for specific content (e.g., header, footer).
5. **Be responsive**: Templates should be responsive to different screen sizes.

### Example Template

```javascript
// atomic/templates/MainLayout.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../molecules/themeContext';

/**
 * MainLayout component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.header - Header content
 * @param {React.ReactNode} [props.footer] - Footer content
 * @param {boolean} [props.scrollable=true] - Whether content is scrollable
 * @returns {React.ReactElement} MainLayout component
 */
const MainLayout = ({ children, header, footer, scrollable }) => {
  const { colors } = useTheme();

  const Content = scrollable ? ScrollView : View;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <Content style={styles.content}>{children}</Content>
      {footer}
    </View>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node.isRequired,
  footer: PropTypes.node,
  scrollable: PropTypes.bool,
};

MainLayout.defaultProps = {
  footer: null,
  scrollable: true,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default MainLayout;
```

## Pages

Pages are complete screens that use templates, organisms, molecules, and atoms to provide a complete user interface.

### Guidelines for Pages

1. **Use templates**: Pages should use templates for layout.
2. **Compose from organisms, molecules, and atoms**: Pages should compose from organisms, molecules, and atoms.
3. **Handle navigation**: Pages can handle navigation between screens.
4. **Manage state**: Pages can manage state or receive state from props.
5. **Handle side effects**: Pages can handle side effects like API calls.

### Example Page

```javascript
// atomic/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { MainLayout } from '../templates';
import { Header, Footer, ProfileContent, LoadingIndicator } from '../organisms';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';

/**
 * ProfilePage component
 * @param {object} props - Component props
 * @param {object} props.navigation - Navigation object
 * @returns {React.ReactElement} ProfilePage component
 */
const ProfilePage = ({ navigation }) => {
  const { user } = useAuth();
  const { profile, loading, error, fetchProfile } = useProfile();

  useEffect(() => {
    if (user) {
      fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  return (
    <MainLayout
      header={<Header title="Profile" navigation={navigation} />}
      footer={<Footer navigation={navigation} />}
    >
      {loading ? (
        <LoadingIndicator />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <ProfileContent profile={profile} onLogout={handleLogout} />
      )}
    </MainLayout>
  );
};

ProfilePage.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default ProfilePage;
```

## Best Practices

### Performance Optimization

1. **Memoize components**: Use React.memo to prevent unnecessary re-renders.
2. **Optimize hooks**: Use useCallback and useMemo to optimize hooks.
3. **Lazy loading**: Use lazy loading for components that are not immediately needed.
4. **Virtualization**: Use FlatList or SectionList for long lists.
5. **Image optimization**: Optimize images for performance.

### Accessibility

1. **Use semantic components**: Use semantic components like Button instead of TouchableOpacity.
2. **Provide accessibility labels**: Use accessibilityLabel prop to provide labels for screen readers.
3. **Support keyboard navigation**: Make sure components are keyboard accessible.
4. **Test with screen readers**: Test components with screen readers like VoiceOver or TalkBack.
5. **Support dynamic text sizes**: Make sure components work with different text sizes.

### Testing

1. **Write unit tests**: Write unit tests for all components.
2. **Test edge cases**: Test edge cases like empty states, loading states, and error states.
3. **Use snapshots**: Use snapshot tests to catch unintended changes.
4. **Test accessibility**: Test accessibility with tools like react-native-accessibility-engine.
5. **Test performance**: Test performance with tools like react-native-performance.

## Related Documentation

- [Atomic Architecture](../core-concepts/atomic-architecture.md)
- [Developer Workflows](developer-workflows.md)
- [Testing](testing.md)
