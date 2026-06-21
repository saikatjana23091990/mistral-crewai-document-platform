import { createTheme, alpha } from '@mui/material/styles'
const themeColors = {
  purple: {
    primary: { main: '#7C3AED', dark: '#6D28D9', light: '#A78BFA', contrastText: '#ffffff' },
    background: { default: '#F8F9FE', paper: '#FFFFFF' },
    divider: '#EDE9FE',
    shadow: 'rgba(124, 58, 237',
    buttonGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    outlinedBorder: '#C4B5FD',
    outlinedHoverBg: '#F5F3FF'
  },
  pink: {
    primary: { main: '#EC4899', dark: '#DB2777', light: '#F472B6', contrastText: '#ffffff' },
    background: { default: '#FDF2F8', paper: '#FFFFFF' },
    divider: '#FCE7F3',
    shadow: 'rgba(236, 72, 153',
    buttonGradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    outlinedBorder: '#FBCFE8',
    outlinedHoverBg: '#FDF2F8'
  },
  yellow: {
    primary: { main: '#EAB308', dark: '#CA8A04', light: '#FDE047', contrastText: '#ffffff' },
    background: { default: '#FEFCE8', paper: '#FFFFFF' },
    divider: '#FEF08A',
    shadow: 'rgba(234, 179, 8',
    buttonGradient: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
    outlinedBorder: '#FEF08A',
    outlinedHoverBg: '#FEFCE8'
  },
  orange: {
    primary: { main: '#F97316', dark: '#EA580C', light: '#FDBA74', contrastText: '#ffffff' },
    background: { default: '#FFF7ED', paper: '#FFFFFF' },
    divider: '#FFEDD5',
    shadow: 'rgba(249, 115, 22',
    buttonGradient: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    outlinedBorder: '#FFEDD5',
    outlinedHoverBg: '#FFF7ED'
  }
}

export const getTheme = (colorName = 'purple') => {
  const colors = themeColors[colorName] || themeColors.purple;

  return createTheme({
    palette: {
      mode: 'light',
      primary: colors.primary,
      background: colors.background,
      text: {
        primary: '#1E1B4B',
        secondary: '#6B7280',
      },
      divider: colors.divider,
      header: {
        main: '#FFFFFF',
        text: '#1E1B4B',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#1E1B4B' },
      h5: { fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1B4B' },
      h6: { fontSize: '1.1rem', fontWeight: 600, color: '#1E1B4B' },
      body2: { color: '#6B7280' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${colors.divider}`,
            boxShadow: `4px 4px 12px ${colors.shadow}, 0.05), -4px -4px 12px rgba(255, 255, 255, 0.8)`,
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: `1px solid ${colors.divider}`,
            boxShadow: `4px 4px 12px ${colors.shadow}, 0.05), -4px -4px 12px rgba(255, 255, 255, 0.8)`,
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
            background: colors.buttonGradient,
            boxShadow: `0 4px 14px ${colors.shadow}, 0.3)`,
            '&:hover': {
              background: colors.buttonHoverGradient,
              boxShadow: `0 6px 20px ${colors.shadow}, 0.4)`,
            },
          },
          outlinedPrimary: {
            borderColor: colors.outlinedBorder,
            color: colors.primary.main,
            '&:hover': {
              backgroundColor: colors.outlinedHoverBg,
              borderColor: colors.primary.main,
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.background.default,
          },
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(colors.primary.main, 0.25),
            borderRadius: '6px',
          },
        },
      },
    },
  });
};
