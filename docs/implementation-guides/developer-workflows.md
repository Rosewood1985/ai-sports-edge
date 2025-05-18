# Developer Workflows

This guide outlines the common development workflows for the AI Sports Edge application. It provides step-by-step instructions for common tasks and best practices for development.

## Development Environment Setup

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Git
- VS Code (recommended)
- Firebase CLI (for cloud functions)

### Initial Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/ai-sports-edge.git
cd ai-sports-edge
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your actual values.

5. Start the development server:

```bash
npm start
# or
yarn start
```

## Git Workflow

We follow a feature branch workflow:

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:

```bash
git add .
git commit -m "feat: add your feature"
```

3. Push your branch to the remote repository:

```bash
git push origin feature/your-feature-name
```

4. Create a pull request on GitHub.

5. After review and approval, merge your branch into the main branch.

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

Example:

```
feat(auth): add login with Google

Implement Google OAuth login using Firebase Authentication.

Closes #123
```

## Development Workflow

### Adding a New Feature

1. **Plan**: Understand the requirements and design the feature.
2. **Create a Branch**: Create a new branch for your feature.
3. **Implement**: Write the code for your feature.
4. **Test**: Test your feature thoroughly.
5. **Document**: Update documentation as needed.
6. **Commit**: Commit your changes with a descriptive message.
7. **Push**: Push your branch to the remote repository.
8. **Pull Request**: Create a pull request for review.

### Implementing a Component

1. Determine the appropriate level in the atomic architecture:

   - Atom: Basic building block
   - Molecule: Combination of atoms
   - Organism: Complex component
   - Template: Layout structure
   - Page: Complete screen

2. Create the component file in the appropriate directory:

```javascript
// atomic/atoms/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../molecules/themeContext';

/**
 * Button component
 * @param {object} props - Component props
 * @param {string} props.text - Button text
 * @param {function} props.onPress - Button press handler
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, tertiary)
 * @returns {React.ReactElement} Button component
 */
const Button = ({ text, onPress, variant = 'primary' }) => {
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

3. Export the component from the index file:

```javascript
// atomic/atoms/index.js
export { default as Button } from './Button';
```

4. Use the component in your application:

```javascript
import { Button } from '../atomic/atoms';

const MyScreen = () => {
  return (
    <View>
      <Button text="Press Me" onPress={() => console.log('Button pressed')} variant="primary" />
    </View>
  );
};
```

### Adding a New Screen

1. Create the screen component in the appropriate directory:

```javascript
// screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MainLayout } from '../atomic/templates';
import { Header, Footer, ProfileContent } from '../atomic/organisms';

const ProfileScreen = ({ navigation }) => {
  return (
    <MainLayout
      header={<Header title="Profile" navigation={navigation} />}
      footer={<Footer navigation={navigation} />}
    >
      <ProfileContent />
    </MainLayout>
  );
};

export default ProfileScreen;
```

2. Add the screen to the navigation:

```javascript
// navigation/AppNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      {/* Other screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
```

## Testing Workflow

### Unit Testing

We use Jest and React Native Testing Library for unit testing:

```javascript
// __tests__/atomic/atoms/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../atomic/atoms';
import { ThemeProvider } from '../../../atomic/organisms';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button text="Test Button" onPress={() => {}} />
      </ThemeProvider>
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <Button text="Test Button" onPress={onPress} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

Run tests with:

```bash
npm test
# or
yarn test
```

### End-to-End Testing

We use Detox for end-to-end testing:

```javascript
// e2e/firstTest.spec.js
describe('Example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.text('Welcome to AI Sports Edge'))).toBeVisible();
  });

  it('should navigate to login screen', async () => {
    await element(by.text('Login')).tap();
    await expect(element(by.text('Sign In'))).toBeVisible();
  });
});
```

Run end-to-end tests with:

```bash
npm run e2e
# or
yarn e2e
```

## Deployment Workflow

### Building for Production

```bash
expo build:android  # For Android
expo build:ios      # For iOS
```

### Publishing Updates

```bash
expo publish
```

### Deploying to GoDaddy

We use SFTP to deploy the web version to GoDaddy:

```bash
./deploy-vscode-sftp.sh
```

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure your `.env` file is set up correctly.
2. **Dependencies**: If you encounter issues with dependencies, try:
   ```bash
   rm -rf node_modules
   npm install
   # or
   yarn install
   ```
3. **Expo**: If you have issues with Expo, try:
   ```bash
   expo doctor
   ```
4. **Firebase**: If you have issues with Firebase, check your Firebase configuration.

## Dependency Management

We use a custom dependency update script to manage package updates and security vulnerabilities. The script provides several options for updating dependencies with different levels of risk.

### Using the Dependency Update Script

Run the script with:

```bash
./scripts/update-dependencies.js
```

The script provides the following options:

1. **Patch updates only (safest)**: Updates only patch versions of dependencies.
2. **Minor and patch updates (recommended)**: Updates minor and patch versions of dependencies.
3. **All updates including major versions**: Updates all dependencies to their latest versions (may break compatibility).
4. **Update specific packages**: Updates only the packages you specify.
5. **Security-focused updates**: Prioritizes fixing security vulnerabilities, focusing on critical and high severity issues.
6. **Check for security vulnerabilities**: Runs npm audit to check for vulnerabilities without updating.

### Security Features

The script includes special handling for security vulnerabilities:

- Prioritizes known security-critical packages
- Detects and reports nested dependencies with vulnerabilities
- Groups updates by severity (critical, high, moderate)
- Provides detailed reporting on vulnerability fixes
- Supports `--legacy-peer-deps` flag for React Native dependencies

### Best Practices for Dependency Updates

1. **Regular Updates**: Run the script regularly to keep dependencies up to date.
2. **Incremental Updates**: Prefer patch and minor updates over major updates.
3. **Test After Updates**: Always test the application after updating dependencies.
4. **Security First**: Prioritize security-focused updates.
5. **Backup**: The script automatically creates backups before updates, but consider additional backups for major updates.

### Getting Help

If you need help, you can:

- Check the documentation
- Ask in the team Slack channel
- Create an issue on GitHub

## Best Practices

1. **Follow the Atomic Architecture**: Use the atomic architecture for all new components.
2. **Write Tests**: Write tests for all new features.
3. **Document Your Code**: Use JSDoc comments to document your code.
4. **Use TypeScript**: Use TypeScript for type safety.
5. **Follow the Style Guide**: Use ESLint and Prettier to maintain code style.
6. **Keep Components Small**: Keep components small and focused on a single responsibility.
7. **Use Hooks**: Use React hooks for state management and side effects.
8. **Optimize Performance**: Use React.memo, useCallback, and useMemo to optimize performance.
9. **Handle Errors**: Always handle errors gracefully.
10. **Support Accessibility**: Make sure your components are accessible.

## Related Documentation

- [Component Guidelines](component-guidelines.md)
- [Testing](testing.md)
- [Atomic Architecture](../core-concepts/atomic-architecture.md)
