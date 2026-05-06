import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from './index';
import { defaultThemeConfig, ThemeConfig } from './defaults';

interface ThemeContextType {
  config: ThemeConfig;
  mode: 'light' | 'dark';
  toggleMode: () => void;
  updateConfig: (config: Partial<ThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [mode, setMode] = useState<'light' | 'dark'>(
    defaultThemeConfig.darkModeDefault ? 'dark' : 'light'
  );

  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const updateConfig = (partial: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const theme = useMemo(() => buildTheme(config, mode), [config, mode]);

  return (
    <ThemeContext.Provider value={{ config, mode, toggleMode, updateConfig }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider');
  }
  return context;
}
