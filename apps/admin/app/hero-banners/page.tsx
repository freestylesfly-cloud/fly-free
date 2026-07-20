'use client';

import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { HeroBannerManager } from '../components/HeroBannerManager';

export default function HeroBannersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Hero Banners" subtitle="Manage website hero banners with images and offers">
        <div className="space-y-8">
          <HeroBannerManager />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
