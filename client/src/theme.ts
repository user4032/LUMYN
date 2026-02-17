import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#5865F2' : '#5865F2', // Discord Blurple
      light: '#747FF5',
      dark: '#4752C4',
    },
    secondary: {
      main: mode === 'dark' ? '#0088CC' : '#2AABEE', // Telegram Blue  
      light: '#5FC3FF',
      dark: '#006BA6',
    },
    background: {
      default: mode === 'dark' ? '#36393f' : '#f2f3f5',
      paper: mode === 'dark' ? '#2f3136' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#dcddde' : '#2e3338',
      secondary: mode === 'dark' ? '#96989d' : '#747f8d',
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(6, 6, 7, 0.08)',
    action: {
      hover: mode === 'dark' ? 'rgba(79, 84, 92, 0.4)' : 'rgba(116, 127, 141, 0.08)',
      selected: mode === 'dark' ? 'rgba(88, 101, 242, 0.3)' : 'rgba(88, 101, 242, 0.15)',
    },
    error: {
      main: '#ed4245',
    },
    success: {
      main: '#3ba55d',
    },
    warning: {
      main: '#faa81a',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.375,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.25,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)',
    '0 2px 4px rgba(0,0,0,0.1)',
    '0 4px 8px rgba(0,0,0,0.12)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.15)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 500,
          padding: '6px 16px',
        },
        contained: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          color: '#ffffff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
          '&:active': {
            backgroundColor: theme.palette.primary.dark,
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.text.secondary,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 4,
          color: theme.palette.text.secondary,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)',
        },
        elevation2: {
          boxShadow: '0 2px 10px 0 rgba(0,0,0,0.2)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          backgroundColor: theme.palette.mode === 'dark' ? '#40444b' : '#e3e5e8',
          transition: 'background-color 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#383a40' : '#d9dbdd',
          },
          '&.Mui-focused': {
            backgroundColor: theme.palette.mode === 'dark' ? '#383a40' : '#d9dbdd',
          },
        }),
        input: ({ theme }) => ({
          color: theme.palette.text.primary,
          padding: '10px 12px',
          '&::placeholder': {
            color: theme.palette.text.secondary,
            opacity: 1,
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
          fontWeight: 600,
        }),
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          padding: '16px 24px',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          fontWeight: 500,
        }),
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 600,
          fontSize: '0.7rem',
        },
      },
    },
  },
});

