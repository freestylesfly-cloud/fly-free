'use client';

import { use } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { ProductForm } from '../../ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Edit Product" subtitle="Catalog">
        <ProductForm productId={id} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
