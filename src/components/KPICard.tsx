import clsx from 'clsx';

interface KPICardProps {
  label: string;
  value: string;
  trend?: number | null;
  className?: string;
  loading?: boolean;
}

export function KPICard({ label, value, trend, className, loading }: KPICardProps) {
  return (
    <div className={clsx("bg-card border border-border rounded-lg p-2 shadow-lg relative overflow-hidden flex flex-col justify-between", className)}>
      <h3 className="text-secondary text-[11px] font-medium uppercase mb-1">{label}</h3>
      
      {loading ? (
        <div className="h-6 w-24 bg-gray-700 animate-pulse rounded"></div>
      ) : (
        <div className="flex items-end justify-between relative z-10">
            <div className="text-[1.5rem] font-bold text-white leading-none">{value}</div>
            
            {trend !== undefined && trend !== null && !isNaN(trend) && (
                <div className={clsx(
                    "flex items-center text-[10px] font-bold px-1 py-0.5 rounded ml-2",
                    trend >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                )}>
                    <span className="mr-0.5">{trend >= 0 ? '▲' : '▼'}</span>
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
      )}
      
      {/* Visual Indicator Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary to-transparent mt-1.5 rounded-full opacity-50"></div>
    </div>
  );
}
