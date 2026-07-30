'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '../lib/api';

type WebsiteTheme = {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
};

function adjustColor(hexColor: string, percent: number): string {
  let hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${[newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function applyTheme(theme: WebsiteTheme) {
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--color-accent', theme.accentColor);
  root.style.setProperty('--bg-primary', theme.backgroundColor);
  root.style.setProperty('--text-primary', theme.textColor);
  root.style.setProperty('--bg-secondary', adjustColor(theme.backgroundColor, -5));
  root.style.setProperty('--bg-tertiary', adjustColor(theme.backgroundColor, -10));
  root.style.setProperty('--text-secondary', adjustColor(theme.textColor, -30));
  root.style.setProperty('--text-tertiary', adjustColor(theme.textColor, -60));
  root.style.setProperty('--border-color', adjustColor(theme.backgroundColor, -20));
  root.style.setProperty('--font-body', theme.fontFamily);
  root.style.setProperty('--font-heading', theme.fontFamily);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function loadTheme() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/cms/website-theme`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            applyTheme(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading website theme:', error);
      }
    }
    loadTheme();
  }, []);

  return <>{children}</>;
}
