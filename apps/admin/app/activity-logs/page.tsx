'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Search, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type LogRow = {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userEmail?: string | null;
  userId?: string | null;
  ip?: string | null;
  message?: string | null;
  detail?: string | null;
  createdAt: string;
};

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'errors', label: 'Errors' },
  { value: 'success', label: 'Success' },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  const load = useCallback(async () => {
    try {
      setError('');
      const [rows, summary] = await Promise.all([
        apiService.getActivityLogs({ status, search: searchRef.current, page, limit: 50 }),
        apiService.getActivityLogStats(),
      ]);
      setLogs(rows.data || []);
      setPages(rows.pages || 1);
      setTotal(rows.total || 0);
      setStats(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load logs');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live tail: only poll while viewing the newest page, so paging back through
  // history is not yanked out from under you.
  useEffect(() => {
    if (!live || page !== 1) return;
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [live, page, load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      void load();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Activity Logs" subtitle="Every API request, stored and searchable">
        <div className="space-y-5">
          {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}

          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label={`Requests (${stats.windowHours}h)`} value={stats.total} />
              <StatCard label="Errors" value={stats.errors} tone={stats.errors > 0 ? 'bad' : 'good'} />
              <StatCard label="Warnings" value={stats.warnings} tone={stats.warnings > 0 ? 'warn' : 'good'} />
              <StatCard label="Slowest" value={stats.slowest?.[0] ? `${stats.slowest[0].durationMs}ms` : '—'} hint={stats.slowest?.[0]?.path} />
            </div>
          )}

          <div className="flex flex-col gap-3 rounded border border-black/10 bg-white p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-black/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search path, message, or user email..."
                className="w-full rounded border border-black/10 py-2 pl-10 pr-3"
              />
            </div>

            <div className="flex gap-1 rounded border border-black/10 p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setStatus(tab.value); setPage(1); }}
                  className={`rounded px-3 py-1.5 text-sm font-bold ${status === tab.value ? 'bg-ink text-white' : 'text-black/60'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setLive((value) => !value)}
              className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-bold ${live ? 'border-green-300 bg-green-50 text-green-700' : 'border-black/10 text-black/60'}`}
              title={page !== 1 ? 'Live tail resumes on page 1' : undefined}
            >
              <span className={`h-2 w-2 rounded-full ${live && page === 1 ? 'animate-pulse bg-green-600' : 'bg-black/30'}`} />
              {live ? 'Live' : 'Paused'}
            </button>

            <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          <div className="overflow-hidden rounded border border-black/10 bg-white">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <p className="font-black">{total.toLocaleString()} entries</p>
              <p className="text-sm text-black/50">Page {page} of {pages}</p>
            </div>

            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-12 animate-pulse rounded bg-black/5" />)}
              </div>
            ) : logs.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-black/50">No log entries match this filter.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {logs.map((log) => (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-black/[0.02]"
                    >
                      <StatusIcon code={log.statusCode} />
                      <span className="w-14 shrink-0 text-xs font-black text-black/60">{log.method}</span>
                      <span className={`w-12 shrink-0 text-xs font-black ${log.statusCode >= 400 ? 'text-red-600' : 'text-green-700'}`}>
                        {log.statusCode}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink">{log.path}</span>
                      <span className="hidden w-40 shrink-0 truncate text-xs text-black/50 md:block">{log.userEmail || 'anonymous'}</span>
                      <span className="w-16 shrink-0 text-right text-xs text-black/50">{log.durationMs}ms</span>
                      <span className="hidden w-36 shrink-0 text-right text-xs text-black/40 lg:block">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </button>

                    {expanded === log.id && (
                      <div className="border-t border-black/5 bg-black/[0.02] p-4 text-sm">
                        <dl className="grid gap-2 sm:grid-cols-2">
                          <Detail label="Level" value={log.level} />
                          <Detail label="Time" value={new Date(log.createdAt).toLocaleString()} />
                          <Detail label="User" value={log.userEmail || 'anonymous'} />
                          <Detail label="User ID" value={log.userId || '—'} />
                          <Detail label="IP" value={log.ip || '—'} />
                          <Detail label="Duration" value={`${log.durationMs}ms`} />
                        </dl>
                        {log.message && (
                          <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 font-bold text-red-700">{log.message}</p>
                        )}
                        {log.detail && (
                          <pre className="mt-3 max-h-64 overflow-auto rounded border border-black/10 bg-white p-3 text-xs text-black/70">
                            {log.detail}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-black/10 p-3">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="rounded border border-black/10 px-4 py-2 text-sm font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, pages))}
                  disabled={page >= pages}
                  className="rounded border border-black/10 px-4 py-2 text-sm font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatusIcon({ code }: { code: number }) {
  if (code >= 500) return <XCircle size={16} className="shrink-0 text-red-600" />;
  if (code >= 400) return <AlertTriangle size={16} className="shrink-0 text-amber-500" />;
  return <CheckCircle2 size={16} className="shrink-0 text-green-600" />;
}

function StatCard({ label, value, tone, hint }: { label: string; value: number | string; tone?: 'good' | 'bad' | 'warn'; hint?: string }) {
  const colour = tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-ink';
  return (
    <div className="rounded border border-black/10 bg-white p-4">
      <p className="text-sm text-black/60">{label}</p>
      <p className={`text-3xl font-black ${colour}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {hint && <p className="mt-1 truncate font-mono text-xs text-black/40">{hint}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-black/45">{label}</dt>
      <dd className="font-mono text-sm text-ink">{value}</dd>
    </div>
  );
}
