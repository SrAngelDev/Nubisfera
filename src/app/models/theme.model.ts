/**
 * Modelos para el Sistema de Temas
 */

/**
 * Tipos de tema disponibles
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Configuración de un tema
 */
export interface ThemeConfig {
  mode: ThemeMode;
  autoDetect: boolean;
  transitionDuration: number; // ms
  persistPreference: boolean;
}

/**
 * Definición de paleta de colores
 */
export interface ColorPalette {
  // Colores primarios
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Fondos
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // Textos
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Bordes
  borderLight: string;
  borderMedium: string;
  borderStrong: string;
  
  // Estados
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Overlays
  overlayLight: string;
  overlayMedium: string;
  overlayHeavy: string;
}

/**
 * Tema completo con metadatos
 */
export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  palette: ColorPalette;
  description?: string;
  icon?: string;
}

/**
 * Preferencias de usuario para temas
 */
export interface ThemePreferences {
  selectedTheme: ThemeMode;
  lastChanged: Date;
  transitionsEnabled: boolean;
  autoSwitchTime?: {
    lightModeStart: string; // HH:mm
    darkModeStart: string;  // HH:mm
  };
}
