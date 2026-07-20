'use client';

import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { SizeGuideManager } from '../components/SizeGuideManager';

export default function SizeGuidesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Size Guides" subtitle="Manage product size measurements and fit guides">
        <div className="space-y-8">
          <SizeGuideManager />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
