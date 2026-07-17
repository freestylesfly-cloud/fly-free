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

export interface Theme {
  id: string;
  name: ThemeName;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  bannerUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
}

export interface ThemeConfig {
  name: ThemeName;
  colors: ColorScheme;
  fonts: {
    primary: string;
    secondary: string;
  };
  animations: {
    duration: number;
    easing: string;
  };
}

export type SeasonTheme = 'winter' | 'summer' | 'monsoon' | 'autumn';
export type PopCultureTheme = 'marvel' | 'anime' | 'dc' | 'gaming';
export type RegionalTheme = 'assam' | 'northeast' | 'bihu';
export type StyleTheme = 'minimal' | 'graphic' | 'typography' | 'sports';

export type AllThemes = SeasonTheme | PopCultureTheme | RegionalTheme | StyleTheme;
