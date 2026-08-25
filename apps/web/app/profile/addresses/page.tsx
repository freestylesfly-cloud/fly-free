'use client';

import { useEffect, useState } from 'react';
import { Check, Edit2, Loader2, MapPin, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}

const emptyForm = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' };

export default function AddressesPage() {
  const token = useAuthStore((state) => state.token);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadAddresses();
  }, [token]);

  async function loadAddresses() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/ecommerce/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAddress() {
    setError('');
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.state || !form.postalCode) {
      setError('Please fill all required address fields.');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/ecommerce/addresses/${editingId}` : '/api/ecommerce/addresses';
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Address save failed');

      const data = await res.json();
      const newAddress = data.data || data;
      setAddresses(editingId ? addresses.map((address) => (address.id === editingId ? newAddress : address)) : [...addresses, newAddress]);
      closeForm();
    } catch {
      setError('Could not save this address. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm('Delete this address?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/ecommerce/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setAddresses(addresses.filter((address) => address.id !== id));
      }
    } catch {
      setError('Could not delete this address. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  function editAddress(address: Address) {
    setEditingId(address.id);
    setShowForm(true);
    setError('');
    setForm({ ...address, line2: address.line2 || '' });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
    setForm(emptyForm);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Delivery Addresses</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Save addresses to make checkout faster.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-black text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={16} /> Add Address
          </button>
        )}
      </div>

      {error && <div className="mb-5 rounded-md border p-4 text-sm font-bold" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--text-primary)' }}>{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : (
        <>
          {showForm && (
            <div className="mb-6 rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <h2 className="mb-4 text-lg font-black" style={{ color: 'var(--text-primary)' }}>{editingId ? 'Edit Address' : 'Add Address'}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Full Name *" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
                <Input placeholder="Phone *" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
                <div className="sm:col-span-2">
                  <Input placeholder="Street Address *" value={form.line1} onChange={(value) => setForm({ ...form, line1: value })} />
                </div>
                <div className="sm:col-span-2">
                  <Input placeholder="Apartment, landmark (optional)" value={form.line2} onChange={(value) => setForm({ ...form, line2: value })} />
                </div>
                <Input placeholder="City *" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                <Input placeholder="State *" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
                <Input placeholder="Postal Code *" value={form.postalCode} onChange={(value) => setForm({ ...form, postalCode: value })} />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button onClick={handleSaveAddress} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Address
                </button>
                <button onClick={closeForm} className="inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-black transition hover:bg-white" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}

          {addresses.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-14 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <MapPin className="mx-auto mb-4 h-10 w-10" style={{ color: 'var(--text-tertiary)' }} />
              <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>No addresses saved</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: 'var(--text-secondary)' }}>Add a delivery address before checkout.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {addresses.map((address) => (
                <article key={address.id} className="relative rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {address.isDefault && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                      <Check size={12} /> Default
                    </span>
                  )}
                  <h3 className="pr-24 text-base font-black" style={{ color: 'var(--text-primary)' }}>{address.fullName}</h3>
                  <div className="mt-3 space-y-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>{address.city}, {address.state} {address.postalCode}</p>
                    <p>{address.phone}</p>
                  </div>

                  <div className="mt-5 flex gap-2 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                    <button onClick={() => editAddress(address)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-black transition hover:bg-[#f7f4ef]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteAddress(address.id)} disabled={deleting === address.id} className="inline-flex w-11 items-center justify-center rounded-md border bg-white transition hover:bg-black/5 disabled:opacity-50" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} aria-label="Delete address">
                      {deleting === address.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:text-[#999] focus:border-[var(--color-primary)]"
      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
    />
  );
}
