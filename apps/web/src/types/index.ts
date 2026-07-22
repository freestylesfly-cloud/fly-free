export type ThemeName =
  | 'anime'
  | 'marvel'
  | 'spider-man'
  | 'assam'
  | 'minimal'
  | 'graphic'
  | 'typography'
  | 'gaming'
  | 'dark'
  | 'light';

export interface ThemeConfig {
  name: ThemeName;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  animations: {
    duration: number;
    easing: string;
  };
}
