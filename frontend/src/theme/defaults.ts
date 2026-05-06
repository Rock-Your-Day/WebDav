/**
 * Default theme configuration for OpenWebDav.
 * These values are used when no custom theme is loaded from the server.
 */
export const defaultThemeConfig = {
  appName: 'OpenWebDav',
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  darkModeDefault: false,
  logoPath: null as string | null,
  faviconPath: null as string | null,
};

export type ThemeConfig = typeof defaultThemeConfig;
