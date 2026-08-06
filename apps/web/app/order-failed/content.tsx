'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

/**
 * Payments are confirmed before an order is created, so a failed payment leaves
 * nothing to look up or pay for later — the cart is untouched and the customer
 * simply checks out again.
 */
export default function OrderFailedContent() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-transparent px-4 py-8 pb-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-600" />
          <h1 className="mb-2 text-4xl font-black">Payment Failed</h1>
          <p className="text-lg text-black/60">We couldn&apos;t process your payment</p>
        </div>

        <div className="mb-6 rounded-lg border border-black/10 bg-white p-8">
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <p className="font-black text-green-900">Nothing was charged and no order was placed.</p>
            <p className="mt-2 text-sm text-green-800">
              Your cart is exactly as you left it. If your bank shows a pending amount it is released automatically,
              usually within a few working days.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="mb-2 font-bold text-red-900">Common reasons a payment fails:</p>
            <ul className="list-inside list-disc space-y-2 text-sm text-red-800">
              <li>The payment gateway rejected the transaction</li>
              <li>Card details were entered incorrectly</li>
              <li>Insufficient funds, or the card limit was exceeded</li>
              <li>A gateway timeout or connection problem</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full rounded-lg bg-primary px-6 py-4 text-center font-black text-white hover:opacity-90"
          >
            Try Payment Again
          </Link>

          <Link
            href="/cart"
            className="block w-full rounded-lg bg-black/10 px-6 py-4 text-center font-black text-black hover:opacity-90"
          >
            Back to Cart
          </Link>

          <Link
            href="/"
            className="block w-full rounded-lg bg-black/5 px-6 py-4 text-center font-black text-black hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
