import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { getTheme } from './theme';

export const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('purple');

  useEffect(() => {
    const savedTheme = localStorage.getItem('docugen_theme_color');
    if (savedTheme) {
      setThemeColor(savedTheme);
    }
  }, []);

  const handleSetTheme = (color) => {
    setThemeColor(color);
    localStorage.setItem('docugen_theme_color', color);
  };

  const theme = getTheme(themeColor);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor: handleSetTheme }}>
      <MUIThemeProvider theme={theme}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
