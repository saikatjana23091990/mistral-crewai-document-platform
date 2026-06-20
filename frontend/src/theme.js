import { createTheme, alpha } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7C3AED', // Vibrant purple
      dark: '#6D28D9',
      light: '#A78BFA',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8F9FE', // Very light lavender off-white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E1B4B', // Deep purple-black
      secondary: '#6B7280', // Gray
    },
    divider: '#EDE9FE', // Light purple divider
    header: {
      main: '#FFFFFF',
      text: '#1E1B4B',
    },
  },
  shape: {
    borderRadius: 8, // Minimal corners
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1E1B4B',
    },
    h5: {
      fontSize: '1.4rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#1E1B4B',
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#1E1B4B',
    },
    body2: {
      color: '#6B7280',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #EDE9FE',
          boxShadow: '4px 4px 12px rgba(124, 58, 237, 0.05), -4px -4px 12px rgba(255, 255, 255, 0.8)', // Neomorphic shadow minimal
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #EDE9FE',
          boxShadow: '4px 4px 12px rgba(124, 58, 237, 0.05), -4px -4px 12px rgba(255, 255, 255, 0.8)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 20px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
          },
        },
        outlinedPrimary: {
          borderColor: '#C4B5FD',
          color: '#7C3AED',
          '&:hover': {
            backgroundColor: '#F5F3FF',
            borderColor: '#7C3AED',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8F9FE',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha('#7C3AED', 0.25),
          borderRadius: '6px',
        },
      },
    },
  },
})

export default theme
