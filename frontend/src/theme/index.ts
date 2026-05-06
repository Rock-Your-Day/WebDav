import { createTheme } from '@mui/material/styles';
import { ThemeConfig } from './defaults';

/**
 * Create a MUI v7 theme from the dynamic theme configuration.
 */
export function buildTheme(config: ThemeConfig, mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: config.primaryColor,
      },
      secondary: {
        main: config.secondaryColor,
      },
      background: {
        default: mode === 'light' ? '#f5f7fa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #333',
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'medium',
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #333',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #333',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            '&.Mui-selected': {
              fontWeight: 600,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },
    },
  });
}
