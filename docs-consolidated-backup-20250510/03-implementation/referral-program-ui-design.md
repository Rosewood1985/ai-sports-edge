# Referral Program & Leaderboard UI/UX Design

## Overview

This document outlines the UI/UX design for the referral program and leaderboard system in AI Sports Edge. The design follows the app's existing neon UI design system while introducing new gamification elements to enhance user engagement.

## Design Principles

1. **Gamification First**: Design elements should emphasize achievement, progress, and competition.
2. **Visual Feedback**: Provide clear visual feedback for actions and milestones.
3. **Accessibility**: Ensure all elements are accessible and usable by all users.
4. **Consistency**: Maintain consistency with the existing neon UI design system.
5. **Progressive Disclosure**: Reveal features and information progressively to avoid overwhelming users.

## Key Screens

### 1. Referral Program Card

**Location**: Home screen or Rewards screen

**Purpose**: Entry point to the referral program

**Design Elements**:
- Neon-styled card with glowing border
- Prominent display of user's referral code
- "Share" button with animated icon
- Visual indicator of current referral count
- Progress bar to next milestone
- Brief explanation of benefits

**User Flow**:
1. User sees referral card on home screen
2. Taps to view full referral program details
3. Alternatively, taps "Share" to immediately share their code

![Referral Program Card Mockup](https://example.com/mockups/referral-card.png)

### 2. Referral Program Screen

**Location**: Accessible from Referral Program Card or Rewards section

**Purpose**: Comprehensive view of the referral program

**Design Elements**:
- Header with animated referral badge
- Referral code display with copy and share buttons
- Milestone progress visualization
- List of rewards with unlock status
- Leaderboard preview (top 3 users)
- "View Full Leaderboard" button

**Sections**:
1. **Your Referral Code**: Large, easily readable code with copy/share functionality
2. **How It Works**: Brief explanation of the referral process
3. **Your Progress**: Visual representation of milestones and progress
4. **Rewards**: List of available rewards and unlock conditions
5. **Leaderboard Preview**: Snapshot of current leaderboard standings

**User Flow**:
1. User navigates to Referral Program screen
2. Views their current progress and available rewards
3. Copies or shares their referral code
4. Optionally navigates to full leaderboard

![Referral Program Screen Mockup](https://example.com/mockups/referral-screen.png)

### 3. Leaderboard Screen

**Location**: Accessible from Referral Program Screen

**Purpose**: Display competitive rankings and gamification elements

**Design Elements**:
- Tabs for different time periods (Weekly, Monthly, All-Time)
- Animated podium for top 3 users
- Scrollable list of ranked users
- Highlight for current user's position
- Badge icons indicating user tiers
- Privacy controls for user's own leaderboard presence

**Sections**:
1. **Time Period Selector**: Tabs to switch between Weekly, Monthly, and All-Time views
2. **Top Performers Podium**: Visual highlight of top 3 users with badges
3. **Leaderboard List**: Scrollable list of all ranked users
4. **Your Ranking**: Highlighted entry showing the user's current position
5. **Privacy Settings**: Controls for how the user appears on the leaderboard

**User Flow**:
1. User navigates to Leaderboard screen
2. Views current rankings across different time periods
3. Finds their own position in the rankings
4. Optionally adjusts their privacy settings

![Leaderboard Screen Mockup](https://example.com/mockups/leaderboard-screen.png)

### 4. Milestone Achievement Modal

**Location**: Appears when a milestone is reached

**Purpose**: Celebrate achievement and explain rewards

**Design Elements**:
- Full-screen modal with celebratory animation
- Large badge or trophy icon
- Confetti or particle effects
- Clear explanation of the reward earned
- "Claim" or "Continue" button

**User Flow**:
1. User reaches a referral milestone
2. Modal appears with celebration animation
3. User reads about their reward
4. User taps "Claim" or "Continue" to dismiss

![Milestone Achievement Modal Mockup](https://example.com/mockups/milestone-modal.png)

## UI Components

### 1. ReferralMilestoneProgress Component

**Purpose**: Display progress toward referral milestones

**Design Elements**:
- Horizontal timeline with milestone markers
- Progress bar showing completion percentage
- Milestone icons with locked/unlocked states
- Tooltip explanations of each milestone

**States**:
- **Locked**: Grayed out icon with lock symbol
- **Next Up**: Highlighted with pulsing animation
- **Unlocked**: Colorful icon with checkmark

![ReferralMilestoneProgress Component](https://example.com/mockups/milestone-progress.png)

### 2. ReferralBadge Component

**Purpose**: Display user's referral status badge

**Design Elements**:
- Circular badge with tiered designs
- Glow effect based on tier level
- Animated elements for higher tiers

**Variants**:
- **Rookie Referrer**: Blue badge with star outline
- **Elite Referrer**: Orange badge with star half-filled
- **Hall of Fame**: Gold badge with full star and animated glow

**Sizes**:
- Small: For leaderboard entries
- Medium: For profile displays
- Large: For celebration screens

![ReferralBadge Component](https://example.com/mockups/referral-badges.png)

### 3. LeaderboardEntry Component

**Purpose**: Display a single user entry in the leaderboard

**Design Elements**:
- Rank number with styled background
- User avatar or placeholder
- Username with optional "You" indicator
- Referral count with icon
- Badge indicator showing tier

**States**:
- **Current User**: Highlighted background, "You" label
- **Top 3**: Special styling with gold, silver, or bronze accents
- **Standard**: Regular styling for all other entries

![LeaderboardEntry Component](https://example.com/mockups/leaderboard-entry.png)

## Animations and Transitions

### 1. Milestone Achievement

- **Trigger**: User reaches a new milestone
- **Animation**: Radial burst from milestone icon, followed by confetti
- **Duration**: 2 seconds
- **Easing**: Elastic out

### 2. Leaderboard Position Change

- **Trigger**: User's position in leaderboard changes
- **Animation**: Smooth vertical slide with number counter
- **Duration**: 0.5 seconds
- **Easing**: Ease-in-out

### 3. Badge Upgrade

- **Trigger**: User reaches a new badge tier
- **Animation**: Badge morphs from previous tier to new tier with glow pulse
- **Duration**: 1.5 seconds
- **Easing**: Bounce

## Color Scheme

The referral program and leaderboard will use the existing neon color scheme with these specific applications:

### Badge Tiers
- **Rookie**: `#3498db` to `#2980b9` gradient
- **Elite**: `#f39c12` to `#d35400` gradient
- **Hall of Fame**: `#f1c40f` to `#e67e22` gradient with `#fff` glow

### Milestone Progress
- **Locked**: `#444444`
- **In Progress**: `#3498db`
- **Completed**: `#2ecc71`

### Leaderboard Rankings
- **1st Place**: `#f1c40f` (Gold)
- **2nd Place**: `#bdc3c7` (Silver)
- **3rd Place**: `#cd7f32` (Bronze)
- **Current User**: `rgba(52, 152, 219, 0.1)` (Highlight background)

## Typography

Follow the existing neon UI typography with these specific applications:

### Headings
- **Screen Titles**: NeonText component with `type="heading"` and `glow={true}`
- **Section Headers**: NeonText component with `type="subheading"` and `glow={true}`

### Body Text
- **Explanations**: Regular text with `color={textColor}` and `fontSize={14}`
- **Statistics**: Bold text with `color={primaryColor}` and `fontSize={18}`
- **Leaderboard Entries**: Semi-bold text with `fontSize={16}`

## Responsive Design

The UI should adapt to different screen sizes:

### Small Screens (< 360px)
- Simplified milestone progress view
- Compact leaderboard entries
- Single-column layout

### Medium Screens (360px - 480px)
- Standard layout as designed
- Full feature set

### Large Screens (> 480px)
- Two-column layout for referral program screen
- Expanded leaderboard with additional statistics
- Larger celebration animations

## Accessibility Considerations

1. **Color Contrast**: Ensure all text meets WCAG AA standards for contrast
2. **Screen Readers**: Include proper labels for all interactive elements
3. **Touch Targets**: Minimum 44x44px for all touchable elements
4. **Animations**: Provide option to reduce animations for users with vestibular disorders
5. **Text Size**: Support dynamic text sizing for users with visual impairments

## Implementation Notes

1. **Component Reuse**: Leverage existing NeonCard, NeonText, and NeonButton components
2. **Animation Library**: Use React Native Animated API for simple animations and Lottie for complex ones
3. **Responsive Layout**: Use flexbox and percentage-based sizing for adaptability
4. **Asset Management**: Optimize badge and celebration graphics for performance
5. **Accessibility Testing**: Test with VoiceOver and TalkBack screen readers

## User Testing Plan

Before final implementation, conduct user testing with:

1. **Existing Users**: Focus on clarity of referral process and appeal of rewards
2. **New Users**: Test understanding of the referral program without prior context
3. **Competitive Users**: Evaluate engagement with leaderboard and gamification elements
4. **Casual Users**: Assess if the design encourages participation from less competitive users

## Next Steps

1. Create high-fidelity mockups in Figma
2. Develop interactive prototypes for user testing
3. Refine designs based on feedback
4. Implement components in React Native
5. Conduct accessibility and performance testing
6. Launch with A/B testing to measure engagement