'use client';

export const dynamic = 'force-dynamic';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Pencil, Plus, Save, Trash2, Wallet, X } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ImageUploadField } from '../../components/ImageUploadField';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useFetch } from '../../hooks/useFetch';
import { apiService } from '../../services/api';

interface Redemption {
  id: string;
  amount: number;
  balanceAfter: number;
  kind: string;
  note?: string | null;
  createdAt: string;
  order?: { id: string; orderNumber?: string | null; total: number; status: string; createdAt: string } | null;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}

interface Voucher {
  id: string;
  code: string;
  winnerName: string;
  winnerPhone?: string | null;
  position?: number | null;
  value: number;
  balance: number;
  maxRedemptions: number;
  redemptionsUsed: number;
  expiresAt?: string | null;
  isActive: boolean;
  claimedByUserId?: string | null;
  lockToFirstUser?: boolean;
  winnerImageUrl?: string | null;
  redemptions?: Redemption[];
}

const emptyForm = {
  winnerName: '',
  winnerPhone: '',
  position: '',
  value: '999',
  maxRedemptions: '2',
  expiresAt: '',
  lockToFirstUser: true,
  winnerImageUrl: ''
};

const rupees = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

export default function SponsorshipVouchersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getSponsorship(id), { skip: false });
  const sponsorship = data?.data;
  const vouchers = (sponsorship?.vouchers || []) as Voucher[];

  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Inline panels rather than window.prompt: an adjustment has to show the
  // resulting balance before it is committed, and a browser prompt cannot.
  const [adjustFor, setAdjustFor] = useState<Voucher | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [editFor, setEditFor] = useState<Voucher | null>(null);
  const [editForm, setEditForm] = useState({ winnerName: '', winnerPhone: '', position: '', maxRedemptions: '', expiresAt: '', lockToFirstUser: true, winnerImageUrl: '' });

  async function createVoucher(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setFormError('');

    try {
      const response: any = await apiService.createPrizeVoucher(id, {
        winnerName: form.winnerName,
        winnerPhone: form.winnerPhone,
        position: form.position ? Number(form.position) : null,
        value: Number(form.value),
        maxRedemptions: Number(form.maxRedemptions),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        lockToFirstUser: form.lockToFirstUser,
        winnerImageUrl: form.winnerImageUrl
      });
      setNotice(`Voucher ${response?.data?.code || ''} created. Copy the code and send it to the winner privately.`);
      setForm(emptyForm);
      refetch();
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : 'Could not create voucher.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(voucher: Voucher) {
    try {
      await apiService.updatePrizeVoucher(voucher.id, { isActive: !voucher.isActive });
      setNotice(voucher.isActive ? 'Voucher deactivated.' : 'Voucher reactivated.');
      refetch();
    } catch (updateError) {
      setFormError(updateError instanceof Error ? updateError.message : 'Could not update voucher.');
    }
  }

  async function removeVoucher(voucher: Voucher) {
    if (!window.confirm(`Delete the voucher for ${voucher.winnerName}?`)) return;
    try {
      await apiService.deletePrizeVoucher(voucher.id);
      setNotice('Voucher deleted.');
      refetch();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Could not delete voucher.');
    }
  }

  function openAdjust(voucher: Voucher) {
    setEditFor(null);
    setAdjustFor(voucher);
    setAdjustAmount('');
    setAdjustNote('');
    setFormError('');
  }

  async function submitAdjust(event: React.FormEvent) {
    event.preventDefault();
    if (!adjustFor) return;
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      setFormError('Enter an amount to add, or a negative amount to take away.');
      return;
    }

    try {
      await apiService.adjustPrizeVoucher(adjustFor.id, { amount, note: adjustNote });
      setNotice(`${amount > 0 ? 'Added' : 'Removed'} ${rupees(Math.abs(amount))} ${amount > 0 ? 'to' : 'from'} ${adjustFor.winnerName}'s voucher.`);
      setAdjustFor(null);
      refetch();
    } catch (adjustError) {
      setFormError(adjustError instanceof Error ? adjustError.message : 'Could not adjust balance.');
    }
  }

  function openEdit(voucher: Voucher) {
    setAdjustFor(null);
    setEditFor(voucher);
    setEditForm({
      winnerName: voucher.winnerName || '',
      winnerPhone: voucher.winnerPhone || '',
      position: voucher.position ? String(voucher.position) : '',
      maxRedemptions: String(voucher.maxRedemptions),
      expiresAt: toInputDate(voucher.expiresAt),
      lockToFirstUser: voucher.lockToFirstUser !== false,
      winnerImageUrl: voucher.winnerImageUrl || ''
    });
    setFormError('');
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editFor) return;

    try {
      await apiService.updatePrizeVoucher(editFor.id, {
        winnerName: editForm.winnerName,
        winnerPhone: editForm.winnerPhone,
        position: editForm.position ? Number(editForm.position) : null,
        maxRedemptions: Number(editForm.maxRedemptions),
        expiresAt: editForm.expiresAt ? new Date(editForm.expiresAt).toISOString() : null,
        lockToFirstUser: editForm.lockToFirstUser,
        winnerImageUrl: editForm.winnerImageUrl
      });
      setNotice(`Updated ${editForm.winnerName}'s voucher.`);
      setEditFor(null);
      refetch();
    } catch (editError) {
      setFormError(editError instanceof Error ? editError.message : 'Could not update voucher.');
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalIssued = vouchers.reduce((sum, v) => sum + v.value, 0);
  const totalLeft = vouchers.reduce((sum, v) => sum + v.balance, 0);

  return (
    <ProtectedRoute>
      <DashboardLayout
        title={sponsorship ? `${sponsorship.partnerName} — winners` : 'Winners & vouchers'}
        subtitle="Issue a prize voucher per winner and track what each one has been spent on"
      >
        <div className="space-y-6">
          <Link href="/sponsorships" className="inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-ink">
            <ArrowLeft size={16} /> All sponsorships
          </Link>

          {(error || formError) && (
            <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error || formError}</div>
          )}
          {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

          <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
            {/* VOUCHERS */}
            <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Vouchers ({vouchers.length})</h2>
                  <p className="mt-1 text-xs font-bold text-black/50">
                    {rupees(totalIssued)} issued · {rupees(totalLeft)} unspent
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {loading ? (
                  <p className="text-black/60">Loading vouchers...</p>
                ) : vouchers.length === 0 ? (
                  <p className="text-black/60">No vouchers yet. Add the winners once the event has a result.</p>
                ) : (
                  vouchers.map((voucher) => {
                    const spent = voucher.value - voucher.balance;
                    const usesLeft = voucher.maxRedemptions - voucher.redemptionsUsed;
                    const expired = voucher.expiresAt ? new Date(voucher.expiresAt).getTime() < Date.now() : false;
                    // Redemptions come back newest first, so the first REDEEM is the latest one.
                    const lastSpend = voucher.redemptions?.find((entry) => entry.kind === 'REDEEM');

                    return (
                      <div key={voucher.id} className="rounded border border-black/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {voucher.position ? (
                                <span className="inline-flex rounded-full bg-mint px-2 py-1 text-[10px] font-black uppercase text-black">
                                  {ordinal(voucher.position)} place
                                </span>
                              ) : null}
                              <span className="text-base font-black">{voucher.winnerName}</span>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                                  !voucher.isActive || expired ? 'bg-black/5 text-black/50' : 'bg-green-50 text-green-700'
                                }`}
                              >
                                {!voucher.isActive ? 'Inactive' : expired ? 'Expired' : 'Active'}
                              </span>
                            </div>

                            {voucher.winnerPhone && (
                              <p className="mt-1 text-xs font-bold text-black/55">{voucher.winnerPhone}</p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <code className="rounded bg-black/5 px-3 py-1.5 font-mono text-sm font-black tracking-wide">
                                {voucher.code}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyCode(voucher.code)}
                                className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-1.5 text-xs font-bold"
                              >
                                {copied === voucher.code ? <Check size={14} /> : <Copy size={14} />}
                                {copied === voucher.code ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            <p className="mt-3 text-sm font-bold">
                              {rupees(voucher.balance)} left of {rupees(voucher.value)}
                              {spent > 0 ? ` · ${rupees(spent)} spent` : ''}
                            </p>
                            <p className="mt-1 text-xs font-bold text-black/55">
                              Used {voucher.redemptionsUsed} of {voucher.maxRedemptions} · {usesLeft} use
                              {usesLeft === 1 ? '' : 's'} left
                              {voucher.expiresAt ? ` · expires ${new Date(voucher.expiresAt).toLocaleDateString('en-IN')}` : ''}
                              {voucher.lockToFirstUser === false
                                ? ' · anyone with the code can use it'
                                : voucher.claimedByUserId
                                  ? ' · locked to one account'
                                  : ' · locks to the first account that uses it'}
                            </p>
                            {lastSpend && (
                              <p className="mt-1 text-xs font-bold text-black/55">
                                Last used {new Date(lastSpend.createdAt).toLocaleString('en-IN')}
                                {lastSpend.user ? ` by ${lastSpend.user.name || lastSpend.user.email}` : ''}
                                {lastSpend.order?.orderNumber ? ` on ${lastSpend.order.orderNumber}` : ''}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(voucher)}
                              className="inline-flex items-center gap-1 rounded border border-black/10 px-3 py-2 text-xs font-bold"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openAdjust(voucher)}
                              className="inline-flex items-center gap-1 rounded border border-black/10 px-3 py-2 text-xs font-bold"
                            >
                              <Wallet size={14} /> Balance
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(voucher)}
                              className="rounded border border-black/10 px-3 py-2 text-xs font-bold"
                            >
                              {voucher.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeVoucher(voucher)}
                              className="rounded border border-red-200 px-2 py-1.5 text-xs font-bold text-red-700"
                              aria-label="Delete voucher"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {adjustFor?.id === voucher.id && (
                          <form onSubmit={submitAdjust} className="mt-4 rounded border border-black/10 bg-black/[0.02] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-black">Change the balance by hand</h4>
                              <button type="button" onClick={() => setAdjustFor(null)} className="rounded border border-black/10 p-1" aria-label="Close">
                                <X size={14} />
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-black/55">
                              For fixing a mistake or topping a winner up. Enter a positive number to add credit, a negative one to take it away.
                              It does not change how many uses are left.
                            </p>

                            <div className="mt-3 grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase text-black/45">Amount (Rs)</span>
                                <input
                                  type="number"
                                  autoFocus
                                  value={adjustAmount}
                                  onChange={(event) => setAdjustAmount(event.target.value)}
                                  placeholder="e.g. 200 or -200"
                                  className="w-full rounded border border-black/10 px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase text-black/45">Reason (shown in the ledger)</span>
                                <input
                                  value={adjustNote}
                                  onChange={(event) => setAdjustNote(event.target.value)}
                                  placeholder="Why is this being changed?"
                                  className="w-full rounded border border-black/10 px-3 py-2 text-sm"
                                />
                              </label>
                            </div>

                            {Number.isFinite(Number(adjustAmount)) && Number(adjustAmount) !== 0 && (
                              <p className="mt-3 text-sm font-black">
                                {rupees(voucher.balance)} {Number(adjustAmount) > 0 ? '+' : '−'} {rupees(Math.abs(Number(adjustAmount)))}
                                {' = '}
                                <span className={voucher.balance + Number(adjustAmount) < 0 ? 'text-red-600' : 'text-green-700'}>
                                  {rupees(voucher.balance + Number(adjustAmount))}
                                </span>
                                {voucher.balance + Number(adjustAmount) < 0 && ' — that is below zero and will be rejected'}
                              </p>
                            )}

                            <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-black text-white">
                              <Save size={14} /> Apply change
                            </button>
                          </form>
                        )}

                        {editFor?.id === voucher.id && (
                          <form onSubmit={submitEdit} className="mt-4 rounded border border-black/10 bg-black/[0.02] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-black">Edit voucher details</h4>
                              <button type="button" onClick={() => setEditFor(null)} className="rounded border border-black/10 p-1" aria-label="Close">
                                <X size={14} />
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-black/55">
                              The code and the balance are not editable here — the code has already been sent to the winner, and the balance moves
                              only through a purchase or a recorded adjustment.
                            </p>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <Input label="Winner name" value={editForm.winnerName} onChange={(v) => setEditForm({ ...editForm, winnerName: v })} required />
                              <Input label="Phone" value={editForm.winnerPhone} onChange={(v) => setEditForm({ ...editForm, winnerPhone: v })} />
                              <Input label="Position" value={editForm.position} onChange={(v) => setEditForm({ ...editForm, position: v })} type="number" />
                              <Input label="Maximum uses" value={editForm.maxRedemptions} onChange={(v) => setEditForm({ ...editForm, maxRedemptions: v })} type="number" required />
                            </div>
                            <div className="mt-3">
                              <Input label="Expires" value={editForm.expiresAt} onChange={(v) => setEditForm({ ...editForm, expiresAt: v })} type="datetime-local" />
                              <p className="mt-1 text-xs text-black/50">
                                Clear this to remove the deadline entirely. Already used {voucher.redemptionsUsed} time(s), so the limit cannot go below that.
                              </p>
                            </div>

                            <div className="mt-3">
                              <SharingMode
                                name={`edit-sharing-${voucher.id}`}
                                locked={editForm.lockToFirstUser}
                                onChange={(locked) => setEditForm({ ...editForm, lockToFirstUser: locked })}
                                maxRedemptions={editForm.maxRedemptions}
                              />
                            </div>

                            <div className="mt-3">
                              <ImageUploadField
                                label="Winner photo (optional)"
                                value={editForm.winnerImageUrl}
                                onChange={(value) => setEditForm((current) => ({ ...current, winnerImageUrl: value }))}
                                bucket="product-images"
                                folder="sponsorships/winners"
                                aspect={1}
                                targetWidth={600}
                                alt={editForm.winnerName}
                                hint="Shown on the public winners card."
                              />
                            </div>

                            <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-black text-white">
                              <Save size={14} /> Save changes
                            </button>
                          </form>
                        )}

                        {voucher.redemptions && voucher.redemptions.length > 0 && (
                          <div className="mt-4 overflow-x-auto rounded border border-black/10">
                            <table className="w-full min-w-[520px] text-sm">
                              <thead className="bg-black/5 text-left">
                                <tr>
                                  <th className="p-2 font-black">When</th>
                                  <th className="p-2 font-black">What</th>
                                  <th className="p-2 font-black">Who</th>
                                  <th className="p-2 font-black">Order</th>
                                  <th className="p-2 text-right font-black">Amount</th>
                                  <th className="p-2 text-right font-black">Balance after</th>
                                </tr>
                              </thead>
                              <tbody>
                                {voucher.redemptions.map((entry) => (
                                  <tr key={entry.id} className="border-t border-black/10">
                                    <td className="p-2 text-xs font-bold text-black/60">
                                      {new Date(entry.createdAt).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2 text-xs font-bold">{describeKind(entry)}</td>
                                    <td className="p-2 text-xs font-bold">
                                      {entry.user ? (
                                        <span title={entry.user.email || ''}>{entry.user.name || entry.user.email}</span>
                                      ) : (
                                        <span className="text-black/40">Admin</span>
                                      )}
                                    </td>
                                    <td className="p-2 text-xs font-bold">
                                      {entry.order ? (
                                        <Link href={`/orders/${entry.order.id}`} className="underline">
                                          {entry.order.orderNumber || entry.order.id.slice(-8)}
                                        </Link>
                                      ) : (
                                        <span className="text-black/40">—</span>
                                      )}
                                    </td>
                                    <td className={`p-2 text-right text-xs font-black ${entry.amount > 0 ? 'text-green-700' : ''}`}>
                                      {entry.amount > 0 ? '+' : '−'}
                                      {rupees(Math.abs(entry.amount))}
                                    </td>
                                    <td className="p-2 text-right text-xs font-bold">{rupees(entry.balanceAfter)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* ADD WINNER */}
            <section className="h-fit rounded border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Add a winner</h2>
              <p className="mt-1 text-xs font-bold text-black/50">
                The code is generated here. Send it to the winner privately — it is never shown on the website.
              </p>

              <form onSubmit={createVoucher} className="mt-4 space-y-4">
                <Input label="Winner name" value={form.winnerName} onChange={(v) => setForm({ ...form, winnerName: v })} required />
                <Input label="Phone" value={form.winnerPhone} onChange={(v) => setForm({ ...form, winnerPhone: v })} placeholder="For sending the code" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Position" value={form.position} onChange={(v) => setForm({ ...form, position: v })} type="number" placeholder="1" />
                  <Input label="Value (Rs)" value={form.value} onChange={(v) => setForm({ ...form, value: v })} type="number" required />
                </div>

                <Input label="Maximum uses" value={form.maxRedemptions} onChange={(v) => setForm({ ...form, maxRedemptions: v })} type="number" required />
                <Input label="Expires" value={form.expiresAt} onChange={(v) => setForm({ ...form, expiresAt: v })} type="datetime-local" />
                <p className="-mt-2 text-xs text-black/50">
                  Leave blank for one month from today. A voucher is never deleted when it expires — it simply stops being accepted.
                </p>

                <SharingMode
                  name="create-sharing"
                  locked={form.lockToFirstUser}
                  onChange={(locked) => setForm({ ...form, lockToFirstUser: locked })}
                  maxRedemptions={form.maxRedemptions}
                />

                <ImageUploadField
                  label="Winner photo (optional)"
                  value={form.winnerImageUrl}
                  onChange={(value) => setForm((current) => ({ ...current, winnerImageUrl: value }))}
                  bucket="product-images"
                  folder="sponsorships/winners"
                  aspect={1}
                  targetWidth={600}
                  alt={form.winnerName}
                  hint="Shown on the public winners card. Falls back to their initial."
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-coral px-4 py-3 font-black text-white disabled:opacity-50"
                >
                  <Plus size={16} /> {saving ? 'Creating...' : 'Create voucher'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/**
 * Who may spend the code.
 *
 * Both modes share one pool of uses — the difference is only whether that pool
 * belongs to one account or to whoever types the code first.
 */
function SharingMode({
  locked,
  onChange,
  maxRedemptions,
  name
}: {
  locked: boolean;
  onChange: (locked: boolean) => void;
  maxRedemptions: string;
  /** Groups the pair. The create form and an open edit panel coexist, so each
   *  instance needs its own name or arrow keys would jump between them. */
  name: string;
}) {
  const uses = Number(maxRedemptions) || 0;
  const times = `${uses} time${uses === 1 ? '' : 's'}`;

  return (
    <div className="rounded border border-black/10 bg-black/[0.02] p-3">
      <span className="block text-xs font-bold uppercase text-black/45">Who can use this code</span>

      <label className="mt-2 flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-white">
        <input type="radio" name={name} checked={locked} onChange={() => onChange(true)} className="mt-1" />
        <span>
          <span className="block text-sm font-black">Only the winner</span>
          <span className="block text-xs text-black/55">
            The first account to use it claims the code. After that nobody else can, even if it is shared.
            That account gets all {times}.
          </span>
        </span>
      </label>

      <label className="mt-1 flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-white">
        <input type="radio" name={name} checked={!locked} onChange={() => onChange(false)} className="mt-1" />
        <span>
          <span className="block text-sm font-black">Anyone with the code</span>
          <span className="block text-xs text-black/55">
            The winner can share it. {times} in total across everyone — once used up, it stops working for all.
          </span>
        </span>
      </label>
    </div>
  );
}

/** ISO timestamp to the local value `<input type="datetime-local">` expects. */
function toInputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function describeKind(entry: Redemption) {
  const direction = entry.amount > 0 ? 'added' : 'removed';
  if (entry.kind === 'REVERSAL') return entry.note ? `Returned — ${entry.note}` : 'Returned to the winner';
  if (entry.kind === 'ADJUSTMENT') return `Admin ${direction} credit${entry.note ? ` — ${entry.note}` : ''}`;
  return 'Spent on order';
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th". */
function ordinal(position: number) {
  const remainder = position % 100;
  if (remainder >= 11 && remainder <= 13) return `${position}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][position % 10] || 'th';
  return `${position}${suffix}`;
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-black/10 px-3 py-2 text-sm"
      />
    </label>
  );
}
