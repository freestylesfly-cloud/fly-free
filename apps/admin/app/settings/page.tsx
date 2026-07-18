'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Save, Upload, AlertCircle } from 'lucide-react';

interface AppSettings {
  appName: string;
  appDescription: string;
  appLogo: string;
  appFavicon: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  footerText: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Fly Free',
    appDescription: 'Premium T-shirt e-commerce platform',
    appLogo: 'FF',
    appFavicon: '🎨',
    contactEmail: 'contact@flyfree.com',
    contactPhone: '+91-9876543210',
    supportEmail: 'support@flyfree.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@flyfree.com',
    footerText: '© 2026 Fly Free. All rights reserved.',
    socialLinks: {
      facebook: 'https://facebook.com/flyfree',
      instagram: 'https://www.instagram.com/flyfree.ne/',
      twitter: 'https://twitter.com/flyfree',
      youtube: 'https://youtube.com/flyfree',
    },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Settings" subtitle="Configuration">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-black/10">
            {[
              { id: 'general', label: 'General' },
              { id: 'email', label: 'Email' },
              { id: 'social', label: 'Social Links' },
              { id: 'security', label: 'Security' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-bold transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-coral text-coral'
                    : 'text-black/60 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-black/10 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-ink mb-2">App Name</label>
                  <input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-2">App Description</label>
                  <textarea
                    value={settings.appDescription}
                    onChange={(e) => handleInputChange('appDescription', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Logo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.appLogo}
                        onChange={(e) => handleInputChange('appLogo', e.target.value)}
                        placeholder="FF"
                        className="flex-1 px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                      />
                      <button className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 transition flex items-center gap-2">
                        <Upload size={16} />
                        Upload
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Favicon</label>
                    <input
                      type="text"
                      value={settings.appFavicon}
                      onChange={(e) => handleInputChange('appFavicon', e.target.value)}
                      placeholder="🎨"
                      className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Footer Text</label>
                  <textarea
                    value={settings.footerText}
                    onChange={(e) => handleInputChange('footerText', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Contact Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-yellow-700">Email Configuration</p>
                    <p className="text-sm text-yellow-600">These settings are used for sending transactional emails to customers</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={settings.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-bold text-ink mb-4">SMTP Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-ink mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={settings.smtpHost}
                        onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-ink mb-2">SMTP Port</label>
                      <input
                        type="text"
                        value={settings.smtpPort}
                        onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-ink mb-2">SMTP User</label>
                      <input
                        type="email"
                        value={settings.smtpUser}
                        onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Social Links */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Facebook</label>
                  <input
                    type="url"
                    value={settings.socialLinks.facebook || ''}
                    onChange={(e) => handleSocialChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/flyfree"
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Instagram</label>
                  <input
                    type="url"
                    value={settings.socialLinks.instagram || ''}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/flyfree"
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Twitter</label>
                  <input
                    type="url"
                    value={settings.socialLinks.twitter || ''}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/flyfree"
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-2">YouTube</label>
                  <input
                    type="url"
                    value={settings.socialLinks.youtube || ''}
                    onChange={(e) => handleSocialChange('youtube', e.target.value)}
                    placeholder="https://youtube.com/flyfree"
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  />
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-bold text-blue-700">Security Features</p>
                  <p className="text-sm text-blue-600 mt-1">Manage admin access and security settings</p>
                </div>

                <div>
                  <h4 className="font-bold text-ink mb-4">Admin Users</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-black/2">
                      <div>
                        <p className="font-bold text-ink">Super Admin</p>
                        <p className="text-sm text-black/60">admin@flyfree.com</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-coral text-white text-xs font-bold">Super Admin</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-black/2">
                      <div>
                        <p className="font-bold text-ink">Manager</p>
                        <p className="text-sm text-black/60">manager@flyfree.com</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Manager</span>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-3 border-2 border-coral text-coral font-bold rounded-lg hover:bg-coral/5 transition">
                  Add New Admin User
                </button>

                <div className="border-t pt-6">
                  <h4 className="font-bold text-ink mb-4">Session Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-black/2">
                      <div>
                        <p className="font-bold text-ink">Session Timeout</p>
                        <p className="text-sm text-black/60">Automatic logout after inactivity</p>
                      </div>
                      <select className="px-3 py-2 rounded-lg border border-black/10 bg-white">
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div>
              {saved && (
                <p className="text-green-600 font-bold flex items-center gap-2">
                  ✓ Settings saved successfully
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 disabled:opacity-50 transition"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
