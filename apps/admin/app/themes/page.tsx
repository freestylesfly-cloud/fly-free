'use client';

export const dynamic = 'force-dynamic';

import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Check, Eye } from 'lucide-react';
import { useState } from 'react';

const THEMES = [
  { id: 'anime', name: 'Anime', colors: ['#FF6B9D', '#C44569'], description: 'Bold anime aesthetics' },
  { id: 'marvel', name: 'Marvel', colors: ['#DC143C', '#000000'], description: 'Hero inspired' },
  { id: 'spider-man', name: 'Spider-Man', colors: ['#FF0000', '#1E90FF'], description: 'Web-slinger vibes' },
  { id: 'assam', name: 'Assam', colors: ['#8B4513', '#DAA520'], description: 'Regional pride' },
  { id: 'minimal', name: 'Minimal', colors: ['#FFFFFF', '#000000'], description: 'Clean & simple' },
  { id: 'graphic', name: 'Graphic', colors: ['#FF69B4', '#00CED1'], description: 'Artistic flair' },
  { id: 'typography', name: 'Typography', colors: ['#2C3E50', '#34495E'], description: 'Text focused' },
  { id: 'gaming', name: 'Gaming', colors: ['#00FF41', '#0A0E27'], description: 'Gamer culture' },
  { id: 'dark', name: 'Dark', colors: ['#1A1A1A', '#FFFFFF'], description: 'Night mode' },
  { id: 'light', name: 'Light', colors: ['#FFFFFF', '#333333'], description: 'Day mode' },
];

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState('anime');
  const [saving, setSaving] = useState(false);

  const handleSetActive = async (themeId: string) => {
    setSaving(true);
    try {
      // TODO: Call API to update admin's active theme
      setActiveTheme(themeId);
      console.log('Theme updated to:', themeId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Theme Manager" subtitle="Customize">
      <div className="space-y-6">
        {/* Header info */}
        <div className="rounded-lg bg-gradient-to-r from-coral/10 to-mint/10 border border-coral/20 p-6">
          <h3 className="font-bold text-ink mb-2">Active Theme</h3>
          <p className="text-sm text-black/60">
            The theme selected below will be applied to all users visiting the website. Users can still toggle dark/light mode independently.
          </p>
          <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-coral text-white font-bold text-sm capitalize">
            {THEMES.find(t => t.id === activeTheme)?.name}
          </div>
        </div>

        {/* Theme grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className={`rounded-lg border-2 transition-all duration-300 cursor-pointer group overflow-hidden ${
                activeTheme === theme.id
                  ? 'border-coral shadow-lg shadow-coral/20 scale-105'
                  : 'border-black/10 hover:border-coral hover:shadow-lg'
              }`}
              onClick={() => handleSetActive(theme.id)}
            >
              {/* Color preview */}
              <div className="flex h-24">
                {theme.colors.map((color, idx) => (
                  <div
                    key={idx}
                    style={{ backgroundColor: color }}
                    className="flex-1 transition-transform group-hover:scale-110"
                  />
                ))}
              </div>

              {/* Content */}
              <div className="p-4 bg-white space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-ink">{theme.name}</h4>
                    <p className="text-xs text-black/60">{theme.description}</p>
                  </div>
                  {activeTheme === theme.id && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-coral flex items-center justify-center text-white animate-pulse">
                      <Check size={16} />
                    </div>
                  )}
                </div>

                {/* Preview button */}
                <button className="w-full mt-3 py-2 px-3 rounded-lg bg-black/5 text-ink font-bold text-sm hover:bg-black/10 transition-all flex items-center justify-center gap-2 group/btn">
                  <Eye size={14} className="group-hover/btn:scale-110 transition-transform" />
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save notice */}
        <div className="rounded-lg bg-mint/10 border border-mint/20 p-4 text-sm text-black/70">
          Theme changes take effect immediately across all user sessions.
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
