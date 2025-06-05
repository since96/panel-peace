import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success';
}

export function ToolCard({
  title,
  description,
  icon,
  href,
  color = 'primary'
}: ToolCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success'
  };
  
  return (
    <Link href={href} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-3", colorClasses[color])}>
        <i className={cn(icon, "text-xl")}></i>
      </div>
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
