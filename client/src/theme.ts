import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#FFFFFF' : '#000000', // Vercel чистий контраст
      light: mode === 'dark' ? '#FAFAFA' : '#333333',
      dark: mode === 'dark' ? '#E5E5E5' : '#000000',
    },
    secondary: {
      main: mode === 'dark' ? '#0070F3' : '#0070F3', // Vercel синій акцент
      light: '#3291FF',
      dark: '#0761D1',
    },
    background: {
      default: mode === 'dark' ? '#000000' : '#FFFFFF', // Чистий чорний/білий
      paper: mode === 'dark' ? '#0A0A0A' : '#FAFAFA', // Ледь сірий
    },
    text: {
      primary: mode === 'dark' ? '#FFFFFF' : '#000000',
      secondary: mode === 'dark' ? '#A1A1AA' : '#666666', // Сірий текст
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    action: {
      hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      selected: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    error: {
      main: '#E00',
    },
    success: {
      main: '#0070F3',
    },
    warning: {
      main: '#F5A623',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      letterSpacing: '-0.04em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.03em',
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      letterSpacing: '-0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '-0.005em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 5,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 5,
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.15s ease',
        },
        contained: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
          color: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
          boxShadow: 'none',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000'}`,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#E5E5E5' : '#333333',
            borderColor: theme.palette.mode === 'dark' ? '#E5E5E5' : '#333333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.text.primary,
          },
        }),
        text: ({ theme }) => ({
          color: theme.palette.text.secondary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 5,
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
        root: ({ theme }) => ({
          backgroundImage: 'none',
          borderRadius: 8,
          border: `1px solid ${theme.palette.divider}`,
        }),
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 5,
          backgroundColor: theme.palette.background.paper,
          transition: 'all 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
            transition: 'border-color 0.15s ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.secondary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.primary,
            borderWidth: '1px',
          },
        }),
        input: ({ theme }) => ({
          color: theme.palette.text.primary,
          padding: '10px 14px',
          fontSize: '0.9375rem',
          '&::placeholder': {
            color: theme.palette.text.secondary,
            opacity: 0.6,
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
          fontWeight: 600,
          fontSize: '1.25rem',
        }),
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          padding: '16px 24px',
          gap: '12px',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 5,
          fontWeight: 500,
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 600,
          fontSize: '0.7rem',
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 8,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: theme.palette.text.secondary,
          },
        }),
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: '4px',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 5,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }),
      },
    },
  },
});

