# "Bet Now" Button Design Specifications

## Overview

This document outlines the design specifications for the "Bet Now" buttons that will be implemented throughout the AI Sports Edge platform. These buttons will be styled with a neon effect to match the site's aesthetic and will be designed to be attention-grabbing without being intrusive.

## Design Principles

1. **Attention-Grabbing**: Buttons should stand out and draw the user's attention
2. **On-Brand**: Buttons should match the neon aesthetic of the site
3. **Responsive**: Buttons should look good on all screen sizes
4. **Accessible**: Buttons should be accessible to all users
5. **Performant**: Animations should not impact page/app performance

## Visual Design

### Base Button Design

#### Web
- **Border Radius**: 4px
- **Padding**: 10px 20px (medium), 8px 16px (small), 12px 24px (large)
- **Font**: Bold, uppercase
- **Default Colors**: Gradient from #FF0055 to #FF3300
- **Text Color**: White
- **Shadow/Glow**: 0 0 10px #FF3300
- **Hover Effect**: Scale to 1.05x, increase glow intensity

#### Mobile
- **Border Radius**: 4px
- **Padding**: 10px 20px (medium), 8px 16px (small), 12px 24px (large)
- **Font**: Bold, uppercase
- **Default Colors**: Gradient from #FF0055 to #FF3300
- **Text Color**: White
- **Shadow/Glow**: 0 0 10px #FF3300
- **Press Effect**: Scale to 0.98x

### Team-Colored Button Design

For premium users who have selected a favorite team, the button will use the team's colors:

- **Primary Color**: Team's primary color (for button background)
- **Secondary Color**: Team's secondary color (for text)
- **Neon Primary Color**: Neon variant of team's primary color (for glow)
- **Neon Secondary Color**: Neon variant of team's secondary color (for hover effects)

### Button Sizes

#### Small
- **Height**: 32px
- **Font Size**: 14px
- **Padding**: 8px 16px
- **Use Cases**: Header, compact spaces

#### Medium (Default)
- **Height**: 40px
- **Font Size**: 16px
- **Padding**: 10px 20px
- **Use Cases**: Most placements

#### Large
- **Height**: 48px
- **Font Size**: 18px
- **Padding**: 12px 24px
- **Use Cases**: Call-to-action areas, pricing page

### Button Positions

#### Inline
- **Margin**: 0.5rem
- **Use Cases**: Within content, next to other elements

#### Floating
- **Position**: Fixed at bottom right
- **Margin**: 2rem from bottom, 2rem from right
- **Z-Index**: 1000
- **Use Cases**: After scrolling, after viewing content

#### Fixed
- **Width**: 100%
- **Margin**: 1rem 0
- **Use Cases**: Footer, full-width sections

## Animation Specifications

### Pulsating Glow Effect

- **Animation**: Pulse between normal and high glow intensity
- **Duration**: 2 seconds per cycle
- **Timing Function**: Ease-in-out
- **Implementation**:
  ```css
  @keyframes pulse {
    0% {
      box-shadow: 0 0 10px currentColor;
    }
    50% {
      box-shadow: 0 0 20px currentColor;
    }
    100% {
      box-shadow: 0 0 10px currentColor;
    }
  }
  ```

### Neon Flicker Effect

- **Animation**: Occasionally reduce opacity briefly
- **Frequency**: Random, approximately every 3 seconds
- **Duration**: 150ms per flicker
- **Implementation**:
  ```css
  @keyframes flicker {
    0% {
      opacity: 1;
    }
    25% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
    75% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }
  ```

### Power Surge Animation

- **Animation**: Occasionally increase glow intensity dramatically
- **Frequency**: Random, approximately every 10 seconds
- **Duration**: 500ms per surge
- **Implementation**: JavaScript-controlled animation that temporarily increases the glow intensity

## Placement Guidelines

### Fixed Placements

#### Header
- **Position**: Right side of navigation
- **Size**: Small
- **Style**: Inline
- **Animation**: Pulsating

#### Footer
- **Position**: Centered in footer
- **Size**: Medium
- **Style**: Fixed width
- **Animation**: Pulsating

#### Pricing Page
- **Position**: Below each subscription plan
- **Size**: Large
- **Style**: Fixed width
- **Animation**: Pulsating

#### Home Page
- **Position**: In hero section and after key content sections
- **Size**: Large
- **Style**: Inline or fixed width depending on section
- **Animation**: Pulsating

### Dynamic Placements

#### Game Cards
- **Position**: Bottom of card
- **Size**: Medium
- **Style**: Fixed width
- **Animation**: Pulsating
- **Trigger**: Always visible

#### Odds Display
- **Position**: Next to favorable odds
- **Size**: Small
- **Style**: Inline
- **Animation**: Pulsating
- **Trigger**: Always visible

#### Favorite Team Content
- **Position**: After team name or logo
- **Size**: Small
- **Style**: Inline
- **Animation**: Pulsating
- **Trigger**: When viewing content related to user's favorite team

#### Post-Interaction
- **Position**: Floating at bottom right
- **Size**: Medium
- **Style**: Floating
- **Animation**: Power surge
- **Trigger**: After viewing predictions or certain user actions

## Accessibility Considerations

### Color Contrast
- Ensure text has sufficient contrast against button background
- Provide alternative styling for users with color vision deficiencies

### Animation Control
- Provide option to reduce or disable animations
- Respect user's reduced motion preferences

### Touch Targets
- Ensure buttons are large enough for easy tapping on mobile (minimum 44x44px)
- Provide adequate spacing between buttons

### Screen Reader Support
- Include proper ARIA labels
- Ensure buttons are properly announced by screen readers

## Responsive Behavior

### Mobile Devices
- Adjust button size for touch targets
- Consider floating button placement carefully to avoid covering content
- Optimize animations for mobile performance

### Tablets
- Use medium-sized buttons
- Adjust placement based on tablet layout

### Desktop
- Use full range of button sizes based on context
- Take advantage of hover effects

## Implementation Notes

### Web Implementation
- Use CSS for animations where possible
- Use React state for dynamic animations
- Ensure buttons don't cause layout shifts

### Mobile Implementation
- Use React Native Animated API for animations
- Optimize animations for performance
- Ensure buttons don't impact app responsiveness

## Design Mockups

### Web Button Variations

```
+----------------+    +----------------+    +----------------+
|    BET NOW     |    |    BET NOW     |    |    BET NOW     |
+----------------+    +----------------+    +----------------+
     Default              Team-Colored           Animated
```

### Mobile Button Variations

```
+----------------+    +----------------+    +----------------+
|    BET NOW     |    |    BET NOW     |    |    BET NOW     |
+----------------+    +----------------+    +----------------+
     Tab Bar              In-Content            Floating
```

### Button States

```
+----------------+    +----------------+    +----------------+
|    BET NOW     |    |    BET NOW     |    |    BET NOW     |
+----------------+    +----------------+    +----------------+
     Normal               Hover/Press          Animating
```

## Team Color Examples

### NBA Example: Los Angeles Lakers
- **Primary Color**: #552583 (Purple)
- **Secondary Color**: #FDB927 (Gold)
- **Neon Primary Color**: #7747A3 (Neon Purple)
- **Neon Secondary Color**: #FFDB8C (Neon Gold)

### NFL Example: Kansas City Chiefs
- **Primary Color**: #E31837 (Red)
- **Secondary Color**: #FFB81C (Gold)
- **Neon Primary Color**: #FF3857 (Neon Red)
- **Neon Secondary Color**: #FFD83C (Neon Gold)

### MLB Example: New York Yankees
- **Primary Color**: #0C2340 (Navy)
- **Secondary Color**: #FFFFFF (White)
- **Neon Primary Color**: #2C4360 (Neon Navy)
- **Neon Secondary Color**: #FFFFFF (White)

### NHL Example: Vegas Golden Knights
- **Primary Color**: #B4975A (Gold)
- **Secondary Color**: #333F42 (Steel Gray)
- **Neon Primary Color**: #D4B77A (Neon Gold)
- **Neon Secondary Color**: #535F62 (Neon Steel Gray)