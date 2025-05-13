import { FeedbackItem } from '@shared/schema';
import { cn, formatDateRelative, getPriorityColor } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface FeedbackItemCardProps {
  feedback: FeedbackItem;
  requester?: { name: string; avatarUrl?: string };
}

export function FeedbackItemCard({ feedback, requester }: FeedbackItemCardProps) {
  const { id, title, description, priority, createdAt, thumbnailUrl } = feedback;
  const priorityColors = getPriorityColor(priority);
  
  // Format created time
  const timeAgo = formatDateRelative(createdAt);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };
  
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="w-16 h-16 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={title} 
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="text-slate-400 text-xl">
                <i className={
                  feedback.assetType === 'artwork' ? 'ri-image-line' :
                  feedback.assetType === 'script' ? 'ri-file-text-line' : 
                  feedback.assetType === 'character' ? 'ri-user-line' : 'ri-file-line'
                }></i>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900 text-sm">{title}</h4>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              priorityColors.text,
              priorityColors.bgLight
            )}>
              {priority === 'high' ? 'High' : 
               priority === 'medium' ? 'Medium' : 'Low'} Priority
            </span>
          </div>
          
          <p className="text-sm text-slate-500 mt-1">{description}</p>
          
          <div className="flex items-center mt-2">
            <Avatar className="w-5 h-5 mr-1">
              <AvatarFallback className="text-[0.5rem]">
                {getInitials(requester?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-400">
              Requested by {requester?.name || 'Unknown'} • {timeAgo}
            </span>
          </div>
        </div>
        
        <Link href={`/feedback/${id}`}>
          <Button variant="ghost" size="icon" className="ml-2 text-primary rounded-full hover:bg-primary/5">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
