import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatStatusLabel, getStatusColor } from '@/lib/utils';
import { Link } from 'wouter';
import { Project } from '@shared/schema';
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  collaborators?: Array<{ id: number; name: string; avatarUrl?: string }>;
}



export function ProjectCard({ project, collaborators = [] }: ProjectCardProps) {
  const { title, issue, description, status, progress, dueDate } = project;
  const statusColors = getStatusColor(status);
  
  // Calculate days remaining
  const getDueString = () => {
    if (!dueDate) return '';
    
    const today = new Date();
    const due = new Date(dueDate);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };
  
  const dueString = getDueString();
  const isDueSoon = dueString.includes('Overdue') || dueString.includes('today') || dueString.includes('tomorrow');
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            statusColors.text,
            statusColors.bgLight
          )}>
            {formatStatusLabel(status)}
          </span>
          <span className="text-xs text-slate-500">{issue}</span>
        </div>
        <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        
        <div className="mt-auto">
          <div className="flex items-center mb-2">
            {/* Schedule status badge */}
            {(() => {
              // Already completed
              if (status === 'completed') {
                return (
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Completed</span>
                  </Badge>
                );
              }
              
              // Check if overdue
              if (dueDate) {
                const today = new Date();
                const due = new Date(dueDate);
                const diffTime = due.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                  return (
                    <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Behind Schedule</span>
                    </Badge>
                  );
                } else if (diffDays <= 3) {
                  return (
                    <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>At Risk</span>
                    </Badge>
                  );
                }
              }
              
              // Default: on track
              return (
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>On Schedule</span>
                </Badge>
              );
            })()}
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((collaborator, index) => (
              <Avatar key={index} className="w-6 h-6 border border-white">
                <AvatarFallback className="text-xs">
                  {collaborator.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            
            {collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-xs font-medium text-slate-500">
                +{collaborators.length - 3}
              </div>
            )}
            
            {collaborators.length === 0 && (
              <span className="text-xs text-slate-400">No collaborators</span>
            )}
          </div>
          <div className={cn("text-xs", isDueSoon ? "text-danger" : "text-slate-500")}>
            {dueString}
          </div>
        </div>
      </div>
    </div>
  );
}
