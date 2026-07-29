'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, Loader2, Lock, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileInfoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

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

  if (!user) return <div className="py-12 text-center text-sm text-[#666]">Loading profile...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1f1f1f] md:text-3xl">Profile Information</h1>
        <p className="mt-2 text-sm text-[#666]">Keep your contact details ready for checkout and order updates.</p>
      </div>

      {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      <div className="max-w-3xl space-y-4">
        <Field label="Full Name">
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            disabled={!isEditing}
            className="w-full rounded-md border border-black/15 bg-white px-4 py-3 text-sm font-bold text-[#1f1f1f] outline-none transition focus:border-[#f04423] disabled:text-[#666]"
          />
        </Field>

        <Field label="Email Address">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-black/15 bg-white px-4 py-3 text-sm font-bold text-[#666]"
            />
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
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
            className="w-full rounded-md border border-black/15 bg-white px-4 py-3 text-sm font-bold text-[#1f1f1f] outline-none transition focus:border-[#f04423] disabled:text-[#666]"
          />
        </Field>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#f04423] px-6 py-3 text-sm font-black text-white transition hover:bg-[#d93618]">
                <Edit2 size={18} /> Edit Profile
              </button>
              <button onClick={() => router.push('/profile/password')} className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 px-6 py-3 text-sm font-black text-[#1f1f1f] transition hover:bg-[#f7f4ef]">
                <Lock size={18} /> Change Password
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setForm({ name: user.name || '', phone: user.phone || '', email: user.email || '' });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 px-6 py-3 text-sm font-black text-[#1f1f1f] transition hover:bg-[#f7f4ef]"
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
    <div className="rounded-lg border border-black/10 bg-[#fafafa] p-5">
      <label className="mb-2 block text-xs font-black uppercase text-[#777]">{label}</label>
      {children}
    </div>
  );
}
