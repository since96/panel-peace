import { FeedbackItemCard } from '@/components/ui/custom/feedback-item';
import { DeadlineItem } from '@/components/ui/custom/deadline-item';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { FeedbackItem, Deadline } from '@shared/schema';
import { Link } from 'wouter';
import { Plus } from 'lucide-react';

export function ActionItems() {
  const { data: feedbackItems, isLoading: isFeedbackLoading } = useQuery<FeedbackItem[]>({
    queryKey: ['/api/feedback'],
  });
  
  const { data: deadlines, isLoading: isDeadlinesLoading } = useQuery<Deadline[]>({
    queryKey: ['/api/deadlines'],
  });
  
  // Sample requester data
  // In a real app, we would fetch this from the API
  const requesters = {
    1: { name: 'Sarah Lee', avatarUrl: '' },
    2: { name: 'James King', avatarUrl: '' },
    3: { name: 'Mina Tan', avatarUrl: '' },
  };
  
  const getRequesterForFeedback = (requestedBy: number) => {
    return requesters[requestedBy as keyof typeof requesters] || { name: 'Unknown', avatarUrl: '' };
  };
  
  // Sort deadlines by due date (closest first)
  const sortedDeadlines = deadlines
    ? [...deadlines].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    : [];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Pending Feedback</h2>
          <Link href="/feedback" className="text-primary text-sm font-medium">
            View all
          </Link>
        </div>
        
        {isFeedbackLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-slate-200 rounded-md mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackItems?.slice(0, 3).map((feedback) => (
              <FeedbackItemCard
                key={feedback.id}
                feedback={feedback}
                requester={getRequesterForFeedback(feedback.requestedBy)}
              />
            ))}
            
            {feedbackItems?.length === 0 && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="text-3xl text-slate-300 mb-2">
                  <i className="ri-chat-check-line"></i>
                </div>
                <h3 className="text-base font-medium text-slate-600 mb-1">No pending feedback</h3>
                <p className="text-sm text-slate-500">All feedback items have been addressed</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Deadlines</h2>
          <Link href="/deadlines" className="text-primary text-sm font-medium">
            View calendar
          </Link>
        </div>
        
        {isDeadlinesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-l-4 border-slate-200 pl-3 py-2 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDeadlines.slice(0, 4).map((deadline) => (
              <DeadlineItem key={deadline.id} deadline={deadline} />
            ))}
            
            {sortedDeadlines.length === 0 && (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="text-3xl text-slate-300 mb-2">
                  <i className="ri-calendar-check-line"></i>
                </div>
                <h3 className="text-base font-medium text-slate-600 mb-1">No upcoming deadlines</h3>
                <p className="text-sm text-slate-500 mb-4">Add a deadline to track your project milestones</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/deadlines/new" className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add deadline</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
