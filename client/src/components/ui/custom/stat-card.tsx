import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  count: number;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'same';
  progressValue?: number;
  progressColor?: string;
}

export function StatCard({
  title,
  count,
  unit,
  change,
  trend = 'same',
  progressValue = 0,
  progressColor = 'bg-success'
}: StatCardProps) {
  const trendIcon = trend === 'up' ? 'ri-arrow-up-s-line' : 
                    trend === 'down' ? 'ri-arrow-down-s-line' : 
                    'ri-arrow-right-s-line';
  
  const trendColorClass = trend === 'up' ? 'text-success bg-success/10' : 
                          trend === 'down' ? 'text-danger bg-danger/10' : 
                          'text-warning bg-warning/10';
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 font-medium">{title}</p>
        {change !== undefined && (
          <span className={cn("text-xs rounded-full px-2 py-0.5 flex items-center", trendColorClass)}>
            <i className={cn(trendIcon, "mr-0.5")}></i>
            <span>{Math.abs(change)}%</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-bold text-slate-900">{count}</p>
        {unit && <p className="ml-2 text-sm text-slate-500">{unit}</p>}
      </div>
      <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full", progressColor)} 
          style={{ width: `${progressValue}%` }}
        ></div>
      </div>
    </div>
  );
}
