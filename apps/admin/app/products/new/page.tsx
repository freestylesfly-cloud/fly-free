'use client';

import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ProductForm } from '../ProductForm';

export default function NewProductPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Create Product" subtitle="Catalog">
        <ProductForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
