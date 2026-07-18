'use client';

import { Sidebar } from './Sidebar';
import { AdminHeader } from './AdminHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:ml-64">
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
