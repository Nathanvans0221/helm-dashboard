import { createTheme } from '@mui/material/styles';

// Silver Fern Brand Colors
const FERN = '#69936C';         // Primary brand green
const FERN_DARK = '#4A7A4D';    // Darker fern for hover states
const RICH_SOIL = '#2A2C2E';    // Dark charcoal (neutral)
const SPRING = '#A1DBA6';       // CTA / accent green
const STIRLING = '#B3B3B3';     // Medium gray
const LIGHT_SILVER = '#F2F2F2'; // Off-white

// Dark palette — neutral grays
const DARK_BG_DEFAULT = '#1B1D1F';
const DARK_BG_PAPER = '#252729';
const DARK_BG_ELEVATED = '#2E3032';

// Light palette
const LIGHT_BG_DEFAULT = '#F4F5F7';
const LIGHT_BG_PAPER = '#FFFFFF';

const sharedTypography = {
  fontFamily: '"Montserrat", "Inter", "Helvetica", sans-serif',
  h4: { fontWeight: 700, letterSpacing: '0.02em' },
  h5: { fontWeight: 600, letterSpacing: '0.01em' },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
  body2: { fontWeight: 400, lineHeight: 1.6 },
  caption: { fontWeight: 400, letterSpacing: '0.01em' },
} as const;

const sharedComponents = {
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 600, fontSize: '0.75rem' } as const,
    },
  },
  MuiButton: {
    styleOverrides: {
      contained: {
        fontWeight: 600,
        textTransform: 'none' as const,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
      outlined: {
        textTransform: 'none' as const,
        fontWeight: 600,
      },
      text: {
        textTransform: 'none' as const,
        fontWeight: 600,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 4 },
    },
  },
};

export function getTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: FERN, dark: FERN_DARK, light: SPRING },
      secondary: { main: SPRING },
      background: {
        default: isDark ? DARK_BG_DEFAULT : LIGHT_BG_DEFAULT,
        paper: isDark ? DARK_BG_PAPER : LIGHT_BG_PAPER,
      },
      success: { main: '#63B76B' },
      warning: { main: '#E8B023' },
      error: { main: '#BA3636' },
      info: { main: '#6296BC' },
      text: {
        primary: isDark ? LIGHT_SILVER : '#1B1D1F',
        secondary: isDark ? STIRLING : '#6B7280',
      },
      divider: isDark ? 'rgba(200, 200, 200, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: sharedTypography,
    shape: { borderRadius: 8 },
    components: {
      ...sharedComponents,
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(200, 200, 200, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: isDark ? DARK_BG_PAPER : LIGHT_BG_PAPER,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? DARK_BG_DEFAULT : LIGHT_BG_DEFAULT,
          },
        },
      },
    },
  });
}

// Default export for backward compat
export const theme = getTheme('dark');

export const STATUS_COLORS: Record<string, string> = {
  INITIALIZED: STIRLING,
  READY: '#6296BC',
  IN_PROGRESS: FERN,
  PENDING: '#E8B023',
  COMPLETED: '#63B76B',
  DENIED: '#BA3636',
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#BA3636',
  HIGH: '#DB6E14',
  NORMAL: FERN,
  LOW: STIRLING,
};

export const BRAND = {
  fern: FERN,
  fernDark: FERN_DARK,
  spring: SPRING,
  richSoil: RICH_SOIL,
  stirling: STIRLING,
  lightSilver: LIGHT_SILVER,
  bgDefault: DARK_BG_DEFAULT,
  bgPaper: DARK_BG_PAPER,
  bgElevated: DARK_BG_ELEVATED,
} as const;
