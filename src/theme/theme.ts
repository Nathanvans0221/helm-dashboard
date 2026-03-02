import { createTheme } from '@mui/material/styles';

// Silver Fern Brand Colors
const FERN = '#69936C';         // Primary brand green
const FERN_DARK = '#4A7A4D';    // Darker fern for hover states
const RICH_SOIL = '#2A2C2E';    // Dark charcoal (neutral)
const SPRING = '#A1DBA6';       // CTA / accent green
const STIRLING = '#B3B3B3';     // Medium gray
const LIGHT_SILVER = '#F2F2F2'; // Off-white backgrounds

// Dark mode palette — neutral grays
const BG_DEFAULT = '#1B1D1F';   // Main background
const BG_PAPER = '#252729';     // Card/paper surfaces
const BG_ELEVATED = '#2E3032';  // Elevated surfaces

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: FERN, dark: FERN_DARK, light: SPRING },
    secondary: { main: SPRING },
    background: { default: BG_DEFAULT, paper: BG_PAPER },
    success: { main: '#63B76B' },   // RESTOCK green
    warning: { main: '#E8B023' },   // REPORT gold
    error: { main: '#BA3636' },     // FULFILL red
    info: { main: '#6296BC' },      // ANALYZE blue
    text: {
      primary: LIGHT_SILVER,
      secondary: STIRLING,
    },
    divider: 'rgba(200, 200, 200, 0.12)',
  },
  typography: {
    fontFamily: '"Montserrat", "Inter", "Helvetica", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '0.02em' },
    h5: { fontWeight: 600, letterSpacing: '0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body2: { fontWeight: 400, lineHeight: 1.6 },
    caption: { fontWeight: 400, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid rgba(200, 200, 200, 0.1)`,
          backgroundColor: BG_PAPER,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          textTransform: 'none',
          fontWeight: 600,
        },
        text: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(200, 200, 200, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BG_DEFAULT,
        },
      },
    },
  },
});

export const STATUS_COLORS: Record<string, string> = {
  INITIALIZED: STIRLING,
  READY: '#6296BC',       // ANALYZE blue
  IN_PROGRESS: FERN,      // Brand green — active work
  PENDING: '#E8B023',     // REPORT gold
  COMPLETED: '#63B76B',   // RESTOCK green (brighter success)
  DENIED: '#BA3636',      // FULFILL red
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#BA3636',
  HIGH: '#DB6E14',        // PRODUCE orange
  NORMAL: FERN,
  LOW: STIRLING,
};

// Re-export brand constants for components
export const BRAND = {
  fern: FERN,
  fernDark: FERN_DARK,
  spring: SPRING,
  richSoil: RICH_SOIL,
  stirling: STIRLING,
  lightSilver: LIGHT_SILVER,
  bgDefault: BG_DEFAULT,
  bgPaper: BG_PAPER,
  bgElevated: BG_ELEVATED,
} as const;
