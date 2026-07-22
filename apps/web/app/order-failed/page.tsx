'use client';

import { Suspense } from 'react';
import OrderFailedContent from './content';
import { Loader2 } from 'lucide-react';

function OrderFailedLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
        <p className="text-black/60">Loading order details...</p>
      </div>
    </main>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={<OrderFailedLoading />}>
      <OrderFailedContent />
    </Suspense>
  );
}
