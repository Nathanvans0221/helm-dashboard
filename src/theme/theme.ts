import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
    secondary: { main: '#a78bfa' },
    background: { default: '#0f172a', paper: '#1e293b' },
    success: { main: '#34d399' },
    warning: { main: '#fbbf24' },
    error: { main: '#f87171' },
    info: { main: '#38bdf8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid rgba(148, 163, 184, 0.1)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
  },
});

export const STATUS_COLORS: Record<string, string> = {
  INITIALIZED: '#94a3b8',
  READY: '#60a5fa',
  IN_PROGRESS: '#fbbf24',
  PENDING: '#fb923c',
  COMPLETED: '#34d399',
  DENIED: '#f87171',
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  NORMAL: '#60a5fa',
  LOW: '#94a3b8',
};
