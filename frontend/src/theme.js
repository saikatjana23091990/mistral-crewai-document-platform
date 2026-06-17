import { createTheme, alpha } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2F6BFF',
      dark: '#2456D4',
      light: '#5E8BFF',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F3F6FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2340',
      secondary: '#5E6782',
    },
    divider: '#E5EAF5',
    sidebar: {
      main: '#12295A',
      muted: '#8EA2D5',
      active: '#2F6BFF',
      hover: '#1A3878',
      border: '#214489',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontSize: '1.4rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1.05rem',
      fontWeight: 600,
    },
    body2: {
      color: '#5E6782',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E5EAF5',
          boxShadow: '0 6px 16px rgba(18, 41, 90, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #E5EAF5',
          boxShadow: '0 8px 20px rgba(18, 41, 90, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F3F6FC',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha('#12295A', 0.25),
          borderRadius: '6px',
        },
      },
    },
  },
})

export default theme
