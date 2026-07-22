import { ThemeConfig, ThemeName } from '../types';

export const THEMES: Record<ThemeName, ThemeConfig> = {
  anime: {
    name: 'anime',
    colors: {
      primary: '#FF6B35',
      secondary: '#004E89',
      background: '#F8F5F1',
      text: '#1A1A1A',
      accent: '#FF9500',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#E5E7EB',
    },
    fonts: {
      primary: '"Poppins", sans-serif',
      secondary: '"Inter", sans-serif',
    },
    animations: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  marvel: {
    name: 'marvel',
    colors: {
      primary: '#DC143C',
      secondary: '#FFD700',
      background: '#0F0F0F',
      text: '#FFFFFF',
      accent: '#FFD700',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#333333',
    },
    fonts: {
      primary: '"Arial Black", sans-serif',
      secondary: '"Arial", sans-serif',
    },
    animations: {
      duration: 400,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
  'spider-man': {
    name: 'spider-man',
    colors: {
      primary: '#DA291C',
      secondary: '#0066CC',
      background: '#FAFAFA',
      text: '#1A1A1A',
      accent: '#FFD700',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#E5E7EB',
    },
    fonts: {
      primary: '"Comic Sans MS", cursive',
      secondary: '"Arial", sans-serif',
    },
    animations: {
      duration: 350,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  assam: {
    name: 'assam',
    colors: {
      primary: '#8B4513',
      secondary: '#DAA520',
      background: '#FFFAF0',
      text: '#2C1810',
      accent: '#D4A574',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#D4AF37',
    },
    fonts: {
      primary: '"Georgia", serif',
      secondary: '"Garamond", serif',
    },
    animations: {
      duration: 500,
      easing: 'ease-in-out',
    },
  },
  minimal: {
    name: 'minimal',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      background: '#F5F5F5',
      text: '#333333',
      accent: '#808080',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#CCCCCC',
    },
    fonts: {
      primary: '"Helvetica Neue", Arial, sans-serif',
      secondary: '"Helvetica", Arial, sans-serif',
    },
    animations: {
      duration: 200,
      easing: 'linear',
    },
  },
  graphic: {
    name: 'graphic',
    colors: {
      primary: '#FF006E',
      secondary: '#00F5FF',
      background: '#0A0E27',
      text: '#FFFFFF',
      accent: '#00D9FF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#2D3561',
    },
    fonts: {
      primary: '"Bebas Neue", sans-serif',
      secondary: '"Inter", sans-serif',
    },
    animations: {
      duration: 400,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
  typography: {
    name: 'typography',
    colors: {
      primary: '#2C3E50',
      secondary: '#E74C3C',
      background: '#ECEFF1',
      text: '#2C3E50',
      accent: '#E74C3C',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#BDC3C7',
    },
    fonts: {
      primary: '"Merriweather", serif',
      secondary: '"Open Sans", sans-serif',
    },
    animations: {
      duration: 250,
      easing: 'ease-out',
    },
  },
  gaming: {
    name: 'gaming',
    colors: {
      primary: '#00FF00',
      secondary: '#FF00FF',
      background: '#0D0221',
      text: '#FFFFFF',
      accent: '#00FF00',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#00FF00',
    },
    fonts: {
      primary: '"Courier New", monospace',
      secondary: '"Courier", monospace',
    },
    animations: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      background: '#1F2937',
      text: '#F3F4F6',
      accent: '#F59E0B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#4B5563',
    },
    fonts: {
      primary: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      secondary: '"Roboto", sans-serif',
    },
    animations: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  light: {
    name: 'light',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      background: '#FFFFFF',
      text: '#1F2937',
      accent: '#F59E0B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#E5E7EB',
    },
    fonts: {
      primary: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      secondary: '"Roboto", sans-serif',
    },
    animations: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export const DEFAULT_THEME: ThemeName = 'light';

export const THEME_LABELS: Record<ThemeName, string> = {
  anime: '🎌 Anime Vibes',
  marvel: '🦸 Marvel Universe',
  'spider-man': '🕷️ Spider-Man',
  assam: '🌾 Assamese Culture',
  minimal: '⚪ Minimal',
  graphic: '🎨 Graphic Bold',
  typography: '✍️ Typography',
  gaming: '🎮 Gaming',
  dark: '🌙 Dark Mode',
  light: '☀️ Light Mode',
};
