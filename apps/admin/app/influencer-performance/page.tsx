'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type InfluencerWithStats = {
  id: string;
  name: string;
  code: string;
  email: string;
  buyerDiscountPercent: number;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: number;
  referrals: Array<{
    id: string;
    code: string;
    conversions: number;
    clicks: number;
    order?: {
      id: string;
      total: number;
      status: string;
      createdAt: string;
      user?: { name: string; email: string };
    } | null;
  }>;
};

export default function InfluencerPerformancePage() {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);

  const { data, loading, error } = useFetch<any>(
    () => apiService.getInfluencers(),
    { skip: false }
  );

  const influencers = (data?.data || []) as InfluencerWithStats[];

  const stats = useMemo(() => {
    const totalEarnings = influencers.reduce((sum, inf) => sum + inf.totalEarnings, 0);
    const totalReferrals = influencers.reduce((sum, inf) => sum + inf.totalReferrals, 0);
    const totalInfluencers = influencers.length;
    const topInfluencer = influencers.sort((a, b) => b.totalEarnings - a.totalEarnings)[0];

    return { totalEarnings, totalReferrals, totalInfluencers, topInfluencer };
  }, [influencers]);

  const selectedInfluencer = influencers.find((i) => i.id === selectedInfluencerId);

  const sortedReferrals = selectedInfluencer?.referrals
    ? [...selectedInfluencer.referrals].sort(
        (a, b) =>
          new Date(b.order?.createdAt || 0).getTime() -
          new Date(a.order?.createdAt || 0).getTime()
      )
    : [];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Influencer Performance" subtitle="Track sales, earnings, and referrals">
        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700 mb-6">{error}</div>}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="rounded border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-black/60 font-bold">Total Earnings</p>
              <DollarSign className="text-coral" size={20} />
            </div>
            <p className="text-3xl font-black">Rs {stats.totalEarnings.toLocaleString('en-IN')}</p>
          </div>

          <div className="rounded border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-black/60 font-bold">Total Referrals</p>
              <ShoppingBag className="text-ink" size={20} />
            </div>
            <p className="text-3xl font-black">{stats.totalReferrals}</p>
          </div>

          <div className="rounded border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-black/60 font-bold">Influencers</p>
              <Users className="text-coral" size={20} />
            </div>
            <p className="text-3xl font-black">{stats.totalInfluencers}</p>
          </div>

          <div className="rounded border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-black/60 font-bold">Top Performer</p>
              <TrendingUp className="text-ink" size={20} />
            </div>
            <p className="text-lg font-black text-coral">{stats.topInfluencer?.name || '—'}</p>
            <p className="text-xs text-black/60">Rs {stats.topInfluencer?.totalEarnings.toLocaleString('en-IN') || 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
          {/* Influencers List */}
          <section>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <BarChart3 size={20} /> Influencer Rankings
            </h2>

            {loading ? (
              <div className="text-center py-8 text-black/60">Loading influencers...</div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-8 text-black/60">No influencers yet</div>
            ) : (
              <div className="space-y-3">
                {influencers
                  .sort((a, b) => b.totalEarnings - a.totalEarnings)
                  .map((inf) => (
                    <button
                      key={inf.id}
                      onClick={() => setSelectedInfluencerId(inf.id)}
                      className={`w-full rounded border-2 p-4 text-left transition ${
                        selectedInfluencerId === inf.id
                          ? 'border-ink bg-ink/5'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-black text-ink">{inf.name}</p>
                          <p className="text-xs text-black/60">{inf.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black">Rs {inf.totalEarnings.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-black/60">{inf.totalReferrals} sales</p>
                        </div>
                      </div>
                      <div className="h-2 bg-black/10 rounded overflow-hidden">
                        <div
                          className="h-full bg-coral"
                          style={{
                            width: `${
                              (inf.totalEarnings / Math.max(...influencers.map((i) => i.totalEarnings))) *
                              100
                            }%`
                          }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </section>

          {/* Details Panel */}
          {selectedInfluencer ? (
            <div className="rounded border border-black/10 bg-white p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-black mb-4">{selectedInfluencer.name}</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Code</p>
                  <p className="text-lg font-black text-coral">{selectedInfluencer.code}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-black/60 uppercase font-bold">Buyer Discount</p>
                    <p className="text-lg font-black">{selectedInfluencer.buyerDiscountPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-black/60 uppercase font-bold">Commission</p>
                    <p className="text-lg font-black">{selectedInfluencer.commissionRate}%</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/10">
                  <p className="text-xs text-black/60 uppercase font-bold mb-2">Sales</p>
                  <p className="text-2xl font-black text-ink mb-2">
                    Rs {selectedInfluencer.totalEarnings.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-black/60">
                    {selectedInfluencer.totalReferrals} order{selectedInfluencer.totalReferrals !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="border-t border-black/10 pt-4">
                <h4 className="font-bold text-sm mb-3">Recent Orders</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sortedReferrals.length === 0 ? (
                    <p className="text-xs text-black/60">No sales yet</p>
                  ) : (
                    sortedReferrals.map((ref) => (
                      <div key={ref.id} className="text-xs border border-black/10 rounded p-2">
                        <div className="flex justify-between mb-1">
                          <p className="font-bold">{ref.order?.user?.name || 'Unknown'}</p>
                          <p className="font-bold text-coral">Rs {ref.order?.total.toLocaleString('en-IN')}</p>
                        </div>
                        <p className="text-black/60">{ref.order?.user?.email}</p>
                        <p className="text-black/50 mt-1">
                          Status: <span className="capitalize">{ref.order?.status}</span>
                        </p>
                        <p className="text-black/50">
                          {new Date(ref.order?.createdAt || 0).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded border border-black/10 bg-black/5 p-6 flex items-center justify-center">
              <p className="text-black/60 text-center">Select an influencer to view details</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
