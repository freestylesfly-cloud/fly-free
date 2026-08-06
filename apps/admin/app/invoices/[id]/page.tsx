'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Printer, Download, X } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { saveBlob } from '../../lib/download';
import { apiService } from '../../services/api';

interface OrderData {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  shippingFee: number;
  createdAt: string;
  payment?: {
    status: string;
    provider: string;
    providerPaymentId?: string;
    paidAt?: string;
  };
  invoice?: {
    invoiceNumber?: string;
    status?: string;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  } | null;
}

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Fetched with the admin token rather than linked: the PDF endpoint is behind
  // AdminGuard, and a plain link sends no Authorization header.
  async function downloadInvoice() {
    try {
      setDownloading(true);
      setDownloadError('');
      const { blob, filename } = await apiService.downloadInvoice(id);
      saveBlob(blob, filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Could not download the invoice');
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const response = await apiService.getOrder(id);
        setOrder(response as OrderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Invoice Preview">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-black/40" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Invoice Preview">
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
            {error || 'Order not found'}
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const invoiceNumber = order.invoice?.invoiceNumber || `INV-${new Date(order.createdAt).getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;

  return (
    <ProtectedRoute>
      <DashboardLayout title="Invoice Preview" subtitle={invoiceNumber}>
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/orders/${id}`}
              className="inline-flex items-center gap-2 rounded border border-black/10 px-4 py-2 text-sm font-bold hover:bg-black/5"
            >
              <ArrowLeft size={16} /> Back to Order
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={downloadInvoice}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 text-sm font-bold text-white hover:bg-coral/90 disabled:opacity-60"
            >
              <Download size={16} /> {downloading ? 'Preparing...' : 'Download PDF'}
            </button>
          </div>

          {downloadError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{downloadError}</div>
          )}

          {/* Invoice Preview */}
          <div className="rounded border border-black/10 bg-white p-8 print:border-0 print:p-0">
            {/* Invoice Header */}
            <div className="mb-8 border-b border-black/10 pb-8">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-black text-ink">Fly Free</h1>
                  <p className="text-sm text-black/60">Premium T-Shirts & Streetwear</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-black/45">INVOICE</p>
                  <p className="text-2xl font-black text-ink">{invoiceNumber}</p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="mb-8 grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-bold uppercase text-black/45 mb-1">Order Date</p>
                <p className="font-bold">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-black/45 mb-1">Order Status</p>
                <p className="inline-block rounded-full bg-ink/10 px-3 py-1 text-sm font-bold text-ink">
                  {order.status}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-black/45 mb-1">Payment Status</p>
                <p className="font-bold">{order.payment?.status || 'PENDING'}</p>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="mb-8 grid grid-cols-2 gap-8 border-b border-black/10 pb-8">
              <div>
                <p className="text-xs font-bold uppercase text-black/45 mb-3">Bill To</p>
                <div className="text-sm">
                  <p className="font-bold">{order.user?.name || 'Customer'}</p>
                  <p className="text-black/60">{order.user?.email}</p>
                  <p className="text-black/60">{order.user?.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-black/45 mb-3">Ship To</p>
                <div className="text-sm">
                  {order.shippingAddress ? (
                    <>
                      <p className="font-bold">{order.shippingAddress.fullName}</p>
                      {[
                        order.shippingAddress.line1,
                        order.shippingAddress.line2,
                        [
                          [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', '),
                          order.shippingAddress.postalCode
                        ]
                          .filter(Boolean)
                          .join(' '),
                        order.shippingAddress.country
                      ]
                        .map((line: any) => String(line || '').trim())
                        .filter(Boolean)
                        .map((line: string) => (
                          <p key={line} className="text-black/60">{line}</p>
                        ))}
                      {order.shippingAddress.phone && (
                        <p className="font-bold text-black/60">{order.shippingAddress.phone}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-black/45">No shipping address</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase text-black/45 mb-4">Items</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="pb-3 text-left text-xs font-bold uppercase text-black/45">Item</th>
                    <th className="pb-3 text-left text-xs font-bold uppercase text-black/45">SKU</th>
                    <th className="pb-3 text-center text-xs font-bold uppercase text-black/45">Qty</th>
                    <th className="pb-3 text-right text-xs font-bold uppercase text-black/45">Price</th>
                    <th className="pb-3 text-right text-xs font-bold uppercase text-black/45">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="py-3 text-sm font-bold">{item.name}</td>
                      <td className="py-3 text-sm text-black/60">{item.sku}</td>
                      <td className="py-3 text-center text-sm">{item.quantity}</td>
                      <td className="py-3 text-right text-sm">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-sm font-bold">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mb-8 flex justify-end">
              <div className="w-full max-w-xs space-y-2 border-t border-black/10 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-black/60">Subtotal</span>
                  <span className="font-bold">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {(order.discount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-black/60">Discount</span>
                    <span className="font-bold text-red-600">-₹{(order.discount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {(order.shippingFee || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-black/60">Shipping</span>
                    <span className="font-bold">₹{(order.shippingFee || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {(order.tax || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-black/60">Tax</span>
                    <span className="font-bold">₹{(order.tax || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-black/10 pt-3 text-lg font-black">
                  <span>Total</span>
                  <span className="text-coral">₹{(order.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-black/10 pt-6 text-center text-xs text-black/45">
              <p>Thank you for your business!</p>
              <p className="mt-2">Fly Free • Guwahati, Assam, India</p>
              <p>support@flyfree.com • 9876543210</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
