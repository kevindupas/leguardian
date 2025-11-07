// LeGuardian Modern & Friendly Design System
// Tons frais et apaisants pour rassurer les parents

// Couleurs principales (Bleu ciel, Vert menthe, Mauve)
const PRIMARY_BLUE = '#5DADE2';      // Bleu ciel doux - Confiance, rassurant
const SECONDARY_GREEN = '#48C9B0';   // Vert menthe - Sécurité, succès
const ACCENT_PURPLE = '#B39DDB';     // Mauve - Bienveillance

// Light mode
const LIGHT_WHITE = '#FFFFFF';
const LIGHT_BG = '#F8F9FB';
const LIGHT_BG_MEDIUM = '#E8EAEF';
const LIGHT_TEXT_PRIMARY = '#2C3E50';
const LIGHT_TEXT_SECONDARY = '#7F8C8D';

// Dark mode
const DARK_BG = '#1A1A1A';
const DARK_BG_SECONDARY = '#2A2A2A';
const DARK_TEXT_PRIMARY = '#F5F5F5';
const DARK_TEXT_SECONDARY = '#B0B0B0';

// Couleurs statuts événements
const STATUS_DANGER = '#FF6B6B';     // Danger - Rouge doux
const STATUS_WARNING = '#FFB366';    // Perdu - Orange chaud
const STATUS_SUCCESS = '#48C9B0';    // Arrivé - Vert menthe

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  white: string;
  lightBg: string;
  mediumBg: string;
  textPrimary: string;
  textSecondary: string;
  danger: string;
  warning: string;
  success: string;
  gradientBlue: string[];
  gradientGreen: string[];
}

const lightColors: ColorScheme = {
  primary: PRIMARY_BLUE,
  secondary: SECONDARY_GREEN,
  accent: ACCENT_PURPLE,
  white: LIGHT_WHITE,
  lightBg: LIGHT_BG,
  mediumBg: LIGHT_BG_MEDIUM,
  textPrimary: LIGHT_TEXT_PRIMARY,
  textSecondary: LIGHT_TEXT_SECONDARY,
  danger: STATUS_DANGER,
  warning: STATUS_WARNING,
  success: STATUS_SUCCESS,
  gradientBlue: [PRIMARY_BLUE, '#7EC8E3'],
  gradientGreen: [SECONDARY_GREEN, '#5FD9C1'],
};

const darkColors: ColorScheme = {
  primary: PRIMARY_BLUE,
  secondary: SECONDARY_GREEN,
  accent: ACCENT_PURPLE,
  white: DARK_BG,
  lightBg: DARK_BG_SECONDARY,
  mediumBg: '#353535',
  textPrimary: DARK_TEXT_PRIMARY,
  textSecondary: DARK_TEXT_SECONDARY,
  danger: STATUS_DANGER,
  warning: STATUS_WARNING,
  success: STATUS_SUCCESS,
  gradientBlue: [PRIMARY_BLUE, '#7EC8E3'],
  gradientGreen: [SECONDARY_GREEN, '#5FD9C1'],
};

export const LeGuardianColors = lightColors;

export const getColors = (isDark: boolean): ColorScheme => {
  return isDark ? darkColors : lightColors;
};

// Export pour compatibilité avec le code existant
export default {
  light: {
    text: LIGHT_TEXT_PRIMARY,
    background: LIGHT_WHITE,
    tint: PRIMARY_BLUE,
    tabIconDefault: LIGHT_TEXT_SECONDARY,
    tabIconSelected: PRIMARY_BLUE,
  },
  dark: {
    text: DARK_TEXT_PRIMARY,
    background: DARK_BG,
    tint: SECONDARY_GREEN,
    tabIconDefault: DARK_TEXT_SECONDARY,
    tabIconSelected: SECONDARY_GREEN,
  },
};
