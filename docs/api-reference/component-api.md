# Component API Reference

This document provides detailed API documentation for UI components in the AI Sports Edge application, organized by their atomic design level.

> **Note:** This document is part of the [API Reference](./README.md) section and follows the [Atomic Architecture](../core-concepts/atomic-architecture.md) principles.

## Table of Contents

- [Atoms](#atoms)
  - [ThemedText](#themedtext)
  - [ThemedView](#themedview)
  - [ResponsiveText](#responsivetext)
- [Molecules](#molecules)
  - [ThemeContext](#themecontext)
  - [LanguageProvider](#languageprovider)
- [Organisms](#organisms)
  - [ThemeProvider](#themeprovider)
  - [FirebaseService](#firebaseservice)
  - [EnvironmentBootstrap](#environmentbootstrap)
- [Related Components](#related-components)
  - [AIPickCard](#aipickcard)
  - [GameCard](#gamecard)
  - [BettingAnalyticsChart](#bettinganalyticschart)
- [Accessibility Components](#accessibility-components)
  - [AccessibleThemedText](#accessiblethemedtext)
  - [AccessibleThemedView](#accessiblethemedview)
  - [AccessibleTouchableOpacity](#accessibletouchableopacity)

## Atoms

Atoms are the basic building blocks of the application. They are the smallest, most fundamental UI components.

### ThemedText

`ThemedText` is a text component that automatically uses the theme's text color and provides consistent typography styles across the application.

#### Props

| Prop       | Type                                                                                                              | Default     | Description                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------- |
| `type`     | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'bodyStd' \| 'bodySmall' \| 'label' \| 'button' \| 'small' \| 'defaultSemiBold'` | `'bodyStd'` | The typography style to apply |
| `color`    | `'primary' \| 'secondary' \| 'tertiary' \| 'action' \| 'statusHigh' \| 'statusMedium' \| 'statusLow'`             | `undefined` | The color variant to apply    |
| `style`    | `StyleProp<TextStyle>`                                                                                            | `undefined` | Additional styles to apply    |
| `children` | `React.ReactNode`                                                                                                 | `undefined` | The content to display        |

Plus all standard React Native `Text` props.

#### Example

```jsx
import { ThemedText } from 'atomic/atoms/ThemedText';

// Basic usage
<ThemedText>Default body text</ThemedText>

// With type and color
<ThemedText type="h1" color="primary">
  Heading with primary color
</ThemedText>

// With custom style
<ThemedText
  type="button"
  color="action"
  style={{ marginBottom: 10 }}
>
  Action Button Text
</ThemedText>
```

### ThemedView

`ThemedView` is a view component that automatically uses the theme's background color and provides consistent styling.

#### Props

| Prop       | Type                                               | Default     | Description                     |
| ---------- | -------------------------------------------------- | ----------- | ------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'card' \| 'elevated'` | `'primary'` | The background variant to apply |
| `style`    | `StyleProp<ViewStyle>`                             | `undefined` | Additional styles to apply      |
| `children` | `React.ReactNode`                                  | `undefined` | The content to display          |

Plus all standard React Native `View` props.

#### Example

```jsx
import { ThemedView } from 'atomic/atoms/ThemedView';

// Basic usage
<ThemedView>
  <ThemedText>Content in a themed container</ThemedText>
</ThemedView>

// With variant
<ThemedView variant="card">
  <ThemedText>Content in a card container</ThemedText>
</ThemedView>
```

### ResponsiveText

`ResponsiveText` is a text component that automatically adjusts its font size based on the device screen size.

#### Props

| Prop       | Type                   | Default     | Description                      |
| ---------- | ---------------------- | ----------- | -------------------------------- |
| `baseSize` | `number`               | `16`        | The base font size to scale from |
| `minSize`  | `number`               | `12`        | The minimum font size            |
| `maxSize`  | `number`               | `24`        | The maximum font size            |
| `style`    | `StyleProp<TextStyle>` | `undefined` | Additional styles to apply       |
| `children` | `React.ReactNode`      | `undefined` | The content to display           |

Plus all standard React Native `Text` props.

#### Example

```jsx
import { ResponsiveText } from 'atomic/atoms/ResponsiveText';

// Basic usage
<ResponsiveText>
  This text will adjust its size based on the screen
</ResponsiveText>

// With custom base size
<ResponsiveText baseSize={20} minSize={16} maxSize={32}>
  Larger responsive text
</ResponsiveText>
```

## Molecules

Molecules are groups of atoms bonded together that form more complex UI components.

### ThemeContext

`ThemeContext` provides theme-related functionality to components.

#### Context Value

| Property      | Type                     | Description                                      |
| ------------- | ------------------------ | ------------------------------------------------ |
| `theme`       | `Theme`                  | The current theme object                         |
| `setTheme`    | `(theme: Theme) => void` | Function to set the current theme                |
| `toggleTheme` | `() => void`             | Function to toggle between light and dark themes |
| `isDark`      | `boolean`                | Whether the current theme is dark                |

#### Example

```jsx
import { useContext } from 'react';
import { ThemeContext } from 'atomic/molecules/themeContext';

function MyComponent() {
  const { theme, toggleTheme, isDark } = useContext(ThemeContext);

  return <Button onPress={toggleTheme} title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`} />;
}
```

### LanguageProvider

`LanguageProvider` provides language-related functionality to components.

#### Context Value

| Property      | Type                                       | Description                                   |
| ------------- | ------------------------------------------ | --------------------------------------------- |
| `language`    | `'en' \| 'es'`                             | The current language code                     |
| `setLanguage` | `(language: 'en' \| 'es') => void`         | Function to set the current language          |
| `translate`   | `(key: string, params?: object) => string` | Function to translate a key                   |
| `isRTL`       | `boolean`                                  | Whether the current language is right-to-left |

#### Example

```jsx
import { useContext } from 'react';
import { LanguageContext } from 'atomic/molecules/language/languageContext';

function MyComponent() {
  const { language, setLanguage, translate } = useContext(LanguageContext);

  return (
    <>
      <Text>{translate('welcome_message')}</Text>
      <Button
        onPress={() => setLanguage(language === 'en' ? 'es' : 'en')}
        title={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
      />
    </>
  );
}
```

## Organisms

Organisms are complex UI components composed of groups of molecules and/or atoms.

### ThemeProvider

`ThemeProvider` is a component that provides theme functionality to the application.

#### Props

| Prop           | Type                            | Default     | Description                                 |
| -------------- | ------------------------------- | ----------- | ------------------------------------------- |
| `initialTheme` | `'light' \| 'dark' \| 'system'` | `'system'`  | The initial theme to use                    |
| `children`     | `React.ReactNode`               | `undefined` | The content to wrap with the theme provider |

#### Example

```jsx
import { ThemeProvider } from 'atomic/organisms/themeProvider';

function App() {
  return (
    <ThemeProvider initialTheme="system">
      <AppContent />
    </ThemeProvider>
  );
}
```

### FirebaseService

`FirebaseService` is a component that provides Firebase functionality to the application.

#### Props

| Prop            | Type                     | Default     | Description                                   |
| --------------- | ------------------------ | ----------- | --------------------------------------------- |
| `children`      | `React.ReactNode`        | `undefined` | The content to wrap with the Firebase service |
| `onInitialized` | `() => void`             | `undefined` | Callback when Firebase is initialized         |
| `onError`       | `(error: Error) => void` | `undefined` | Callback when an error occurs                 |

#### Example

```jsx
import { FirebaseService } from 'atomic/organisms/firebaseService';

function App() {
  return (
    <FirebaseService
      onInitialized={() => console.log('Firebase initialized')}
      onError={error => console.error('Firebase error:', error)}
    >
      <AppContent />
    </FirebaseService>
  );
}
```

### EnvironmentBootstrap

`EnvironmentBootstrap` is a component that initializes the application environment.

#### Props

| Prop       | Type              | Default     | Description                                            |
| ---------- | ----------------- | ----------- | ------------------------------------------------------ |
| `children` | `React.ReactNode` | `undefined` | The content to render after environment initialization |
| `fallback` | `React.ReactNode` | `null`      | The content to render during initialization            |
| `onReady`  | `() => void`      | `undefined` | Callback when environment is ready                     |

#### Example

```jsx
import { EnvironmentBootstrap } from 'atomic/organisms/environmentBootstrap';

function App() {
  return (
    <EnvironmentBootstrap
      fallback={<LoadingScreen />}
      onReady={() => console.log('Environment ready')}
    >
      <AppContent />
    </EnvironmentBootstrap>
  );
}
```

## Related Components

These are additional components that are commonly used in the application but don't strictly follow the atomic design pattern.

### AIPickCard

`AIPickCard` displays AI-generated sports predictions.

#### Props

| Prop          | Type                   | Default     | Description                          |
| ------------- | ---------------------- | ----------- | ------------------------------------ |
| `pick`        | `AIPick`               | `required`  | The AI pick data to display          |
| `onPress`     | `() => void`           | `undefined` | Callback when the card is pressed    |
| `style`       | `StyleProp<ViewStyle>` | `undefined` | Additional styles to apply           |
| `showDetails` | `boolean`              | `false`     | Whether to show detailed information |

#### Example

```jsx
import { AIPickCard } from 'src/components/AIPickCard';

function AIPicksScreen() {
  return (
    <ScrollView>
      {picks.map(pick => (
        <AIPickCard
          key={pick.id}
          pick={pick}
          onPress={() => navigateToDetails(pick.id)}
          showDetails={false}
        />
      ))}
    </ScrollView>
  );
}
```

### GameCard

`GameCard` displays information about a sports game.

#### Props

| Prop       | Type                   | Default     | Description                       |
| ---------- | ---------------------- | ----------- | --------------------------------- |
| `game`     | `Game`                 | `required`  | The game data to display          |
| `onPress`  | `() => void`           | `undefined` | Callback when the card is pressed |
| `style`    | `StyleProp<ViewStyle>` | `undefined` | Additional styles to apply        |
| `showOdds` | `boolean`              | `true`      | Whether to show odds information  |
| `compact`  | `boolean`              | `false`     | Whether to use a compact layout   |

#### Example

```jsx
import { GameCard } from 'components/GameCard';

function GamesScreen() {
  return (
    <FlatList
      data={games}
      renderItem={({ item }) => (
        <GameCard
          game={item}
          onPress={() => navigateToGameDetails(item.id)}
          showOdds={true}
          compact={false}
        />
      )}
      keyExtractor={item => item.id}
    />
  );
}
```

### BettingAnalyticsChart

`BettingAnalyticsChart` displays betting analytics data in a chart format.

#### Props

| Prop         | Type                       | Default    | Description                      |
| ------------ | -------------------------- | ---------- | -------------------------------- |
| `data`       | `BettingAnalyticsData[]`   | `required` | The data to display in the chart |
| `type`       | `'line' \| 'bar' \| 'pie'` | `'line'`   | The type of chart to display     |
| `height`     | `number`                   | `200`      | The height of the chart          |
| `width`      | `number \| string`         | `'100%'`   | The width of the chart           |
| `showLegend` | `boolean`                  | `true`     | Whether to show the legend       |
| `showAxis`   | `boolean`                  | `true`     | Whether to show the axis         |

#### Example

```jsx
import { BettingAnalyticsChart } from 'components/BettingAnalyticsChart';

function AnalyticsScreen() {
  return (
    <View>
      <ThemedText type="h2">Betting Performance</ThemedText>
      <BettingAnalyticsChart
        data={performanceData}
        type="line"
        height={250}
        showLegend={true}
        showAxis={true}
      />
    </View>
  );
}
```

## Accessibility Components

### AccessibleThemedText

The `AccessibleThemedText` component extends the functionality of `ThemedText` with accessibility features.

#### Props

| Prop                 | Type                 | Default   | Description                          |
| -------------------- | -------------------- | --------- | ------------------------------------ |
| `accessibilityLabel` | string               | undefined | Label for screen readers             |
| `accessibilityHint`  | string               | undefined | Hint for screen readers              |
| `accessibilityRole`  | AccessibilityRole    | undefined | Role for screen readers              |
| `accessibilityState` | AccessibilityState   | undefined | State for screen readers             |
| `applyHighContrast`  | boolean              | true      | Whether to apply high contrast mode  |
| `applyLargeText`     | boolean              | true      | Whether to apply large text mode     |
| `applyBoldText`      | boolean              | true      | Whether to apply bold text mode      |
| `highContrastStyle`  | StyleProp<TextStyle> | undefined | Style to apply in high contrast mode |
| `largeTextStyle`     | StyleProp<TextStyle> | undefined | Style to apply in large text mode    |
| `boldTextStyle`      | StyleProp<TextStyle> | undefined | Style to apply in bold text mode     |

Plus all props from `ThemedText`.

### AccessibleThemedView

The `AccessibleThemedView` component extends the functionality of `ThemedView` with accessibility features.

#### Props

| Prop                 | Type                 | Default   | Description                           |
| -------------------- | -------------------- | --------- | ------------------------------------- |
| `accessibilityLabel` | string               | undefined | Label for screen readers              |
| `accessibilityHint`  | string               | undefined | Hint for screen readers               |
| `accessibilityRole`  | AccessibilityRole    | undefined | Role for screen readers               |
| `accessibilityState` | AccessibilityState   | undefined | State for screen readers              |
| `applyHighContrast`  | boolean              | true      | Whether to apply high contrast mode   |
| `applyReducedMotion` | boolean              | true      | Whether to apply reduced motion mode  |
| `highContrastStyle`  | StyleProp<ViewStyle> | undefined | Style to apply in high contrast mode  |
| `reducedMotionStyle` | StyleProp<ViewStyle> | undefined | Style to apply in reduced motion mode |

Plus all props from `ThemedView`.

### AccessibleTouchableOpacity

The `AccessibleTouchableOpacity` component extends the functionality of React Native's `TouchableOpacity` with accessibility features.

#### Props

| Prop                 | Type                 | Default   | Description                      |
| -------------------- | -------------------- | --------- | -------------------------------- |
| `accessibilityLabel` | string               | undefined | Label for screen readers         |
| `accessibilityHint`  | string               | undefined | Hint for screen readers          |
| `accessibilityRole`  | AccessibilityRole    | undefined | Role for screen readers          |
| `accessibilityState` | AccessibilityState   | undefined | State for screen readers         |
| `isFocused`          | boolean              | false     | Whether the component is focused |
| `focusedStyle`       | StyleProp<ViewStyle> | undefined | Style to apply when focused      |

Plus all props from React Native's `TouchableOpacity`.

#### Example

```jsx
import { AccessibleTouchableOpacity } from 'atomic/atoms';

// Basic usage
<AccessibleTouchableOpacity onPress={() => console.log('Pressed')}>
  <Text>Press Me</Text>
</AccessibleTouchableOpacity>

// With accessibility props
<AccessibleTouchableOpacity
  onPress={() => console.log('Pressed')}
  accessibilityLabel="Submit Button"
  accessibilityHint="Submits the form"
  accessibilityRole="button"
>
  <Text>Submit</Text>
</AccessibleTouchableOpacity>
```

## Cross-References

- For information on the underlying architectural principles, see [Atomic Architecture](../core-concepts/atomic-architecture.md)
- For practical guides on creating components, see [Component Guidelines](../implementation-guides/component-guidelines.md)
- For testing components, see [Testing](../implementation-guides/testing.md)
- For information on services that these components may use, see [Service API](service-api.md)
- For information on utility functions that these components may use, see [Utility Functions](utility-functions.md)
- For information on Firebase services used by components, see [Firebase Integration](../core-concepts/firebase-integration.md)
