import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number;
  backgroundColor?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  backgroundColor = 'from-coral',
}: StatsCardProps) {
  return (
    <div className="rounded-xl bg-white border border-black/10 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${backgroundColor} to-${backgroundColor}/50 flex items-center justify-center`}>
          <div className="text-white">{icon}</div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-sm font-bold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-black/60 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-black text-ink">{value}</p>
        {subtitle && <p className="text-xs text-black/40 mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}
