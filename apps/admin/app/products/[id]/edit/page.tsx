'use client';

import { DashboardLayout } from '../../../components/DashboardLayout';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { ProductForm } from '../../ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Edit Product" subtitle="Catalog">
        <ProductForm productId={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
