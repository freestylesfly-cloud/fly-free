'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, Loader2, Lock, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileInfoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', email: user.email || '' });
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="py-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Profile Information</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Keep your contact details ready for checkout and order updates.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border-2 p-4 flex gap-3" style={{ borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
          <X size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
          <p className="text-sm font-bold" style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border-2 p-4 flex items-center gap-3" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{success}</p>
        </div>
      )}

      <div className="max-w-3xl space-y-5">
        <Field label="Full Name">
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            disabled={!isEditing}
            className="w-full h-12 px-4 rounded-lg border-2 font-semibold outline-none transition"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: isEditing ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: isEditing ? 'text' : 'not-allowed',
            }}
            onFocus={(e) => isEditing && (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          />
        </Field>

        <Field label="Email Address">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full h-12 px-4 rounded-lg border-2 font-semibold"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                cursor: 'not-allowed',
              }}
            />
            <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide whitespace-nowrap" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
              <CheckCircle2 size={16} /> Verified
            </span>
          </div>
        </Field>

        <Field label="Phone Number">
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            disabled={!isEditing}
            placeholder="10 digit phone number"
            className="w-full h-12 px-4 rounded-lg border-2 font-semibold outline-none transition"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: isEditing ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: isEditing ? 'text' : 'not-allowed',
            }}
            onFocus={(e) => isEditing && (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          />
        </Field>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Edit2 size={18} /> Edit Profile
              </button>
              <button onClick={() => router.push('/profile/password')} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-lg border-2 transition hover:opacity-80" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <Lock size={18} /> Change Password
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} disabled={loading} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-lg text-white transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setForm({ name: user.name || '', phone: user.phone || '', email: user.email || '' });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-lg border-2 transition hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <X size={18} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-2 p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <label className="mb-3 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}
