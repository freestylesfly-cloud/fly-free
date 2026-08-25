'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function PasswordPage() {
  const changePassword = useAuthStore((state) => state.changePassword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleChange = async () => {
    setError('');
    setSuccess('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('All password fields are required.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError('Choose a new password that is different from the current one.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess('Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Password</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Update your sign-in password and keep the account secure.</p>
      </div>

      {error && <div className="mb-6 rounded-md border p-4 text-sm font-bold" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--text-primary)' }}>{error}</div>}
      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_1fr]">
        <div className="space-y-4">
          <PasswordInput
            label="Current Password"
            value={form.currentPassword}
            visible={showPasswords.current}
            placeholder="Enter current password"
            onChange={(value) => setForm({ ...form, currentPassword: value })}
            onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
          />
          <PasswordInput
            label="New Password"
            value={form.newPassword}
            visible={showPasswords.next}
            placeholder="Minimum 8 characters"
            onChange={(value) => setForm({ ...form, newPassword: value })}
            onToggle={() => setShowPasswords({ ...showPasswords, next: !showPasswords.next })}
          />
          <PasswordInput
            label="Confirm New Password"
            value={form.confirmPassword}
            visible={showPasswords.confirm}
            placeholder="Re-enter new password"
            onChange={(value) => setForm({ ...form, confirmPassword: value })}
            onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
          />

          <button onClick={handleChange} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto" style={{ backgroundColor: 'var(--color-primary)' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        <aside className="h-fit rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Security Tips</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>Use a unique password with uppercase letters, lowercase letters, numbers, and symbols. Avoid reusing passwords from other stores.</p>
        </aside>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, visible, placeholder, onChange, onToggle }: { label: string; value: string; visible: boolean; placeholder: string; onChange: (value: string) => void; onToggle: () => void }) {
  return (
    <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <label className="mb-2 block text-xs font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border bg-white px-4 py-3 pr-12 text-sm font-bold outline-none transition placeholder:text-[#999] focus:border-[var(--color-primary)]"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          placeholder={placeholder}
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition hover:bg-black/5" style={{ color: 'var(--text-secondary)' }} aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
