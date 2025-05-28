# AI Sports Edge UI/UX Design System

This document outlines the refined design system for AI Sports Edge, a mobile app built in React Native with Expo. The design system has been implemented for both the mobile app (iOS/Android) and the web app, with support for English and Spanish languages.

## 1. Color Palette

The app uses a dark mode design with a black background and neon blue accents:

```
Primary Background: #000000 (Pure Black)
Surface Background: #121212 (Dark Gray)
Elevated Background: #1A1A1A (Slightly Lighter Gray)

Primary Text: #FFFFFF (White)
Secondary Text: #B0B0B0 (Light Gray)
Tertiary Text: #808080 (Medium Gray)

Primary Action: #00F0FF (Bright Neon Blue)
Subtle Action: #40E0D0 (Desaturated Neon Blue)
Accent: #00F0FF (Same as primary action)

Border Subtle: #808080 (Medium Gray)

Status High: #39FF14 (Neon Green)
Status Medium: #FFF000 (Neon Yellow)
Status Low: #FF1010 (Neon Red)
```

## 2. Typography

The design uses a dual-font approach:

```
Headings: Orbitron (geometric, futuristic font)
Body Text: Inter (clean, modern sans-serif)

Font Sizes:
- small: 12px
- label: 13px
- bodyStd: 15px
- bodyLg: 17px
- button: 16px
- h3: 21px
- h2: 26px
- h1: 34px

Font Weights:
- regular: '400'
- medium: '500'
- semibold: '600'
- bold: '700'
- heavy: '800'
```

## 3. Spacing

Consistent spacing scale:

```
xxs: 4px
xs: 8px
sm: 16px
md: 24px
lg: 32px
xl: 40px
xxl: 48px
```

## 4. Border Radius

Consistent border radius scale:

```
xs: 2px
sm: 4px
md: 8px
lg: 16px
xl: 24px
```

## 5. Component Styling

### Text Components

The `ThemedText` component provides consistent text styling across the app:

- Uses semantic type props (`h1`, `h2`, `h3`, `bodyLg`, `bodyStd`, `label`, `small`, `button`, `link`)
- Uses semantic color props (`primary`, `secondary`, `tertiary`, `action`, `accent`, `statusHigh`, `statusMedium`, `statusLow`)
- Automatically applies the correct font family, size, weight, and color based on the type and color props

### View Components

The `ThemedView` component provides consistent container styling:

- Uses semantic background props (`primary`, `surface`, `transparent`)
- Applies the correct background color based on the background prop

### Button Components

The `BetNowButton` component has been updated to use the theme system:

- Uses theme colors for background, text, and glow effects
- Uses theme spacing for padding and margins
- Uses theme border radius for rounded corners
- Supports different sizes (`small`, `medium`, `large`)
- Supports different positions (`inline`, `floating`, `fixed`)
- Includes animation effects (pulse, surge)

### Card Components

Both `GameCard` and `NeonGameCard` components have been updated:

- Use theme colors for backgrounds, borders, and text
- Use theme spacing for padding and margins
- Use theme border radius for rounded corners
- Use status colors for confidence indicators
- Include hover and active states with appropriate animations

## 6. Neon Effects

The design includes various neon effects to enhance the futuristic look:

```css
--neon-glow: 0 0 10px rgba(0, 240, 255, 0.5);
--neon-text-glow: 0 0 5px rgba(0, 240, 255, 0.9);
--neon-border: 1px solid rgba(0, 240, 255, 0.5);
```

## 7. Motion and Interaction

Subtle animations and transitions enhance the user experience:

- Button hover/tap effects with scale transforms
- Card hover effects with elevation changes
- Glowing effects that pulse or surge
- Smooth transitions between states (0.3s ease)

## 8. Accessibility

The design system includes accessibility considerations:

- Sufficient color contrast for text readability
- Focus states for keyboard navigation
- Semantic HTML structure
- Screen reader support with appropriate ARIA attributes
- Support for different text sizes

## 9. Responsive Design

The design adapts to different screen sizes:

- Mobile-first approach
- Flexible layouts that adjust to screen width
- Appropriate spacing and sizing for different devices
- Consistent experience across platforms

## 10. Internationalization

The design system supports multiple languages:

- English and Spanish language support
- Flexible text containers that accommodate different text lengths
- Appropriate font support for different character sets
- RTL support (if needed in the future)

## 11. Implementation Details

The design system has been implemented across the following components:

1. Core theme definition in `styles/theme.ts`
2. Color constants in `constants/Colors.ts`
3. Theme provider in `components/UIThemeProvider.tsx`
4. Text component in `components/ThemedText.tsx`
5. View component in `components/ThemedView.tsx`
6. Button component in `components/BetNowButton.tsx`
7. Card components in `components/GameCard.tsx` and `components/NeonGameCard.tsx`
8. Header component in `components/Header.tsx`
9. Web styles in `aisportsedge-deploy/neon-ui.css`
10. Web HTML in `aisportsedge-deploy/index.html` and `aisportsedge-deploy/es/index.html`

## 12. Future Improvements

Potential areas for future enhancement:

1. Create more specialized components for common UI patterns
2. Implement a storybook for component documentation and testing
3. Add more animation variants for different interaction types
4. Expand the color palette for more varied UI elements
5. Add dark/light mode toggle (if light mode is desired)
6. Implement more accessibility features
7. Add more language support