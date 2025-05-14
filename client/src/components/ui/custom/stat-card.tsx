import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  count: number;
}

export function StatCard({
  title,
  count
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 font-medium">{title}</p>
      </div>
      <div className="mt-4">
        <p className="text-4xl font-bold text-slate-900">{count}</p>
        {/* No labels or additional text here - just the count */}
      </div>
    </div>
  );
}
