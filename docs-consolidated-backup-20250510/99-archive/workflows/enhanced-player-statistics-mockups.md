# Enhanced Player Statistics Mockups

This document provides visual mockups and design specifications for the enhanced player statistics features across web, iOS, and Android platforms.

## Design System

### Color Palette

```
Primary Colors:
- Neon Blue: #0a7ea4
- Neon Green: #34C759
- Neon Red: #FF3B30
- Dark Background: #1c1c1e
- Light Text: #FFFFFF
- Dark Text: #000000
```

### Typography

```
Headings:
- Font: System font, semi-bold
- Sizes: 24px (h1), 20px (h2), 18px (h3)

Body Text:
- Font: System font, regular
- Sizes: 16px (primary), 14px (secondary), 12px (tertiary)

Metrics:
- Font: System font, medium
- Sizes: 18px (primary metrics), 16px (secondary metrics)
```

### Spacing

```
- Base unit: 8px
- Content padding: 16px
- Card margin: 8px
- Section spacing: 24px
```

## Screen Mockups

### Advanced Player Metrics Screen

```
┌─────────────────────────────────────────┐
│ ← ADVANCED METRICS                      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Player Name                         │ │
│ │ Team Name                           │ │
│ │                                     │ │
│ │ ┌─────────────┐    ┌─────────────┐  │ │
│ │ │ OFFENSIVE   │    │ DEFENSIVE   │  │ │
│ │ └─────────────┘    └─────────────┘  │ │
│ │                                     │ │
│ │ True Shooting %: 58.5%              │ │
│ │ Effective FG%: 52.3%                │ │
│ │ Offensive Rating: 112.4             │ │
│ │                                     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │         RECENT PERFORMANCE      │ │ │
│ │ │                                 │ │ │
│ │ │ [Line Chart with Neon Accents]  │ │ │
│ │ │                                 │ │ │
│ │ │                                 │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ VIEW HISTORICAL TRENDS →        │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Historical Trends Screen

```
┌─────────────────────────────────────────┐
│ ← HISTORICAL TRENDS                     │
├─────────────────────────────────────────┤
│ Player Name                             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ SELECT METRIC                       │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐ │ │
│ │ │POINTS│ │ASST │ │REBS │ │STEALS   │ │ │
│ │ └─────┘ └─────┘ └─────┘ └─────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ POINTS - LAST 5 GAMES               │ │
│ │                                     │ │
│ │ [Line Chart with Neon Highlights]   │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ TREND ANALYSIS                      │ │
│ │                                     │ │
│ │ ↗️ Strong upward trend              │ │
│ │                                     │ │
│ │ 15.2% increase in recent games      │ │
│ │                                     │ │
│ │ Performance Insights:               │ │
│ │ • Consistent scoring output         │ │
│ │ • Last game was above average       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Player Comparison Screen

```
┌─────────────────────────────────────────┐
│ ← PLAYER COMPARISON                     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Player 1 Name      VS    Player 2 Name│
│ │ Team 1                   Team 2      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ │ │
│ │ │OFFENSIVE│ │DEFENSIVE│ │OVERALL  │ │ │
│ │ └─────────┘ └─────────┘ └─────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Bar Chart Comparison with Neon]    │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ OFFENSIVE ADVANTAGE                 │ │
│ │                                     │ │
│ │ 🏆 Player 1 has the edge in 3 of 4  │ │
│ │    metrics                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ DETAILED COMPARISON                 │ │
│ │                                     │ │
│ │ Metric    Player 1    Player 2  Diff│ │
│ │ TS%       58.5%       52.3%    +6.2%│ │
│ │ EFG%      54.2%       48.7%    +5.5%│ │
│ │ Off Rtg   112.4       108.3    +4.1 │ │
│ │ Usage     25.3%       28.7%    -3.4%│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Upgrade Prompt (After 4 Views)

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ✖                                 │  │
│  │                                   │  │
│  │     UNLOCK PREMIUM FEATURES       │  │
│  │                                   │  │
│  │ Get access to advanced metrics,   │  │
│  │ historical trends, and player     │  │
│  │ comparison tools.                 │  │
│  │                                   │  │
│  │ ┌───────────────────────────────┐ │  │
│  │ │      Premium Subscription     │ │  │
│  │ │                               │ │  │
│  │ │          $9.99/month          │ │  │
│  │ │                               │ │  │
│  │ │   Full access to all premium  │ │  │
│  │ │           features            │ │  │
│  │ │                               │ │  │
│  │ │      [SUBSCRIBE NOW]          │ │  │
│  │ └───────────────────────────────┘ │  │
│  │                                   │  │
│  │ ┌───────────────────────────────┐ │  │
│  │ │      One-Time Purchases       │ │  │
│  │ │                               │ │  │
│  │ │ Advanced Metrics      $0.99   │ │  │
│  │ │ Player Comparison     $0.99   │ │  │
│  │ │ Historical Trends     $1.99   │ │  │
│  │ │                               │ │  │
│  │ │ Premium Bundle        $2.99   │ │  │
│  │ │ [BEST VALUE]                  │ │  │
│  │ └───────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Animation Specifications

### Neon Effects
- **Glow Effect**: Text and borders with a subtle glow in the primary color
- **Pulse Animation**: Important buttons and call-to-actions pulse subtly to draw attention
- **Transition Effects**: Smooth transitions between screens with a slight glow trail

### Data Visualization Animations
- **Chart Loading**: Charts animate in from left to right when data loads
- **Value Changes**: Values that change animate with a flash of neon color
- **Selection Highlight**: Selected items highlight with an increased glow effect

### Upgrade Prompt Animation
- **Modal Entry**: Fade in with a slight scale up
- **Button Pulse**: Subscribe button pulses with neon glow
- **Highlight Effects**: Best value option has a persistent glow effect

## Responsive Design Guidelines

### Mobile (iOS & Android)
- Single column layout
- Full-width cards
- Scrollable content
- Bottom navigation

### Tablet
- Two-column layout where appropriate
- Larger charts and visualizations
- Side navigation options

### Web
- Multi-column layout
- Larger data visualizations
- Sidebar navigation
- Hover effects for interactive elements

## Accessibility Considerations

- Maintain minimum contrast ratios despite neon effects
- Provide alternative text for all charts and visualizations
- Ensure all interactive elements are keyboard accessible
- Support system font size adjustments
- Include alternative non-animated version for users with motion sensitivity

## Implementation Notes

- Use native platform animations when possible for better performance
- Implement shared color and typography constants
- Create reusable animation components
- Ensure smooth degradation on older devices