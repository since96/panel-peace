import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  count: number;
}

export function StatCard({
  title,
  count
}: StatCardProps) {
  // Using a simple version with no extra content
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 font-medium">{title}</p>
      </div>
      <div className="mt-4">
        {/* Display only the number, nothing else */}
        <span className="text-4xl font-bold text-slate-900">{count}</span>
      </div>
    </div>
  );
}
