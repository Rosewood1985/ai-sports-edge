/**
 * Below are the colors that are used in the app.
 * These definitions align with the UI/UX strategy defined for AI Sports Edge.
 */

const tintColorLight = '#0a7ea4'; // Original light tint - retained for reference
const tintColorDark = '#FFFFFF'; // New primary text color for dark mode

export const Colors = {
  light: {
    // TODO: Update light theme values based on design system if light mode is needed
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primaryBackground: '#FFFFFF',
    surfaceBackground: '#F2F2F7', // Example light surface
    primaryText: '#11181C',
    secondaryText: '#687076',
    tertiaryText: '#A0A0A0',
    primaryAction: '#007AFF', // Example light primary action
    subtleAction: '#5AC8FA', // Example light subtle action
    borderSubtle: '#D1D1D6',
  },
  dark: {
    // Backgrounds
    primaryBackground: '#000000', // Base layer, use sparingly
    surfaceBackground: '#121212', // Cards, Modals, elevated surfaces

    // Text
    primaryText: '#FFFFFF', // Headlines, key info
    secondaryText: '#B0B0B0', // Body copy, labels
    tertiaryText: '#808080', // Disabled states, subtle info, borders

    // Actions & Accents (Neon Blue)
    primaryAction: '#00F0FF', // Primary buttons, active states, key highlights (Bright Neon Blue)
    subtleAction: '#40E0D0', // Secondary highlights, icons (Desaturated Neon Blue)
    accent: '#00F0FF', // Alias for primary action or specific accent use

    // Icons (Can alias text colors or use specific values)
    iconPrimary: '#FFFFFF', // Use primaryText
    iconSecondary: '#B0B0B0', // Use secondaryText
    iconTertiary: '#808080', // Use tertiaryText

    // Tabs (Example using new roles)
    tabIconDefault: '#808080', // Tertiary Text color
    tabIconSelected: '#FFFFFF', // Primary Text color (or primaryAction for more emphasis)

    // Borders
    borderSubtle: '#808080', // Use tertiaryText color

    // Original 'tint' mapping (Mapped to primaryText for selected elements)
    tint: tintColorDark, // #FFFFFF
  },
  status: {
    // Confidence Indicators
    highConfidence: '#39FF14', // Neon Green
    mediumConfidence: '#FFF000', // Neon Yellow
    lowConfidence: '#FF1010', // Neon Red

    // Add other status colors as needed (e.g., info, warning)
    // info: '#00BFFF', // Example
    // warning: '#FFD700', // Example
  },
};

export default Colors;
