'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const success = await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      if (success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);

      if (success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!token) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-coral hover:underline font-bold mb-8">
          <ArrowLeft size={18} />
          Back Home
        </Link>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-black dark:text-white mb-2">My Profile</h1>
            <p className="text-ink/60 dark:text-white/60">Manage your account and preferences</p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-paper dark:bg-ink/50 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-black dark:text-white">Account Information</h2>

            {!isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-ink/60 dark:text-white/60 block mb-2">Name</label>
                  <p className="text-lg font-bold dark:text-white">{user?.name}</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-ink/60 dark:text-white/60 block mb-2">Email</label>
                  <p className="text-lg font-bold dark:text-white">{user?.email}</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-ink/60 dark:text-white/60 block mb-2">Phone</label>
                  <p className="text-lg font-bold dark:text-white">{user?.phone || 'Not provided'}</p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral/90 transition"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="text-sm font-bold dark:text-white block mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold dark:text-white block mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      });
                    }}
                    className="flex-1 bg-white/10 dark:bg-white/5 text-ink dark:text-white py-3 rounded-lg font-bold hover:bg-white/20 dark:hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password Card */}
          <div className="bg-paper dark:bg-ink/50 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-black dark:text-white">Security</h2>

            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="w-full border-2 border-coral text-coral py-3 rounded-lg font-bold hover:bg-coral/10 transition"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-bold dark:text-white block mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-3 text-ink/60 dark:text-white/60"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold dark:text-white block mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-3 text-ink/60 dark:text-white/60"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold dark:text-white block mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-3 text-ink/60 dark:text-white/60"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral/90 transition disabled:opacity-50"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 bg-white/10 dark:bg-white/5 text-ink dark:text-white py-3 rounded-lg font-bold hover:bg-white/20 dark:hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
