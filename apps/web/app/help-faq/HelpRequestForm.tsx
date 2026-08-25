'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '../lib/api';

export function HelpRequestForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', comment: '', consent: false });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/cms/help-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || 'Could not send your request right now.');
      }
      setMessage(data?.message || 'Thanks. We received your request.');
      setForm({ name: '', phone: '', email: '', comment: '', consent: false });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send your request right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <FieldLabel label="Name*">
        <input required className="w-full border px-3 py-2.5 outline-none" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }} placeholder="Your Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </FieldLabel>
      <FieldLabel label="Phone No*">
        <input required className="w-full border px-3 py-2.5 outline-none" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }} placeholder="Your Phone No" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      </FieldLabel>
      <FieldLabel label="Email*">
        <input required type="email" className="w-full border px-3 py-2.5 outline-none" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }} placeholder="Your Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </FieldLabel>
      <FieldLabel label="Comment*">
        <textarea required className="w-full border px-3 py-2.5 outline-none" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }} rows={4} placeholder="Your Comment" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
      </FieldLabel>
      <label className="flex gap-2 text-xs font-semibold leading-5" style={{ color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} />
        I agree to receive support and informational messages from Fly Free.
      </label>
      <button disabled={loading} className="w-full px-4 py-3 font-black text-white disabled:opacity-60" style={{ backgroundColor: 'var(--color-primary)' }}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {message && <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{message}</p>}
    </form>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
