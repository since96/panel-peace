import { cn, getDueDateInfo } from '@/lib/utils';
import { Deadline } from '@shared/schema';

interface DeadlineItemProps {
  deadline: Deadline;
}

export function DeadlineItem({ deadline }: DeadlineItemProps) {
  const { title, description, dueDate } = deadline;
  const dueDateInfo = getDueDateInfo(dueDate);
  
  // Determine border color based on due date
  const borderColor = dueDateInfo.color === 'text-danger' 
    ? 'border-danger' 
    : dueDateInfo.color === 'text-warning' 
      ? 'border-warning' 
      : 'border-slate-300';
  
  return (
    <div className={cn("border-l-4 pl-3 py-2", borderColor)}>
      <p className="font-medium text-slate-900 text-sm">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
      <div className="flex items-center mt-1">
        <i className={cn(dueDateInfo.icon, "text-xs mr-1", dueDateInfo.color)}></i>
        <span className={cn("text-xs font-medium", dueDateInfo.color)}>
          {dueDateInfo.text}
        </span>
      </div>
    </div>
  );
}
