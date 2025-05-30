// Using our new component that guarantees no labels
import { DashboardStat } from '@/components/ui/custom/dashboard-stat';
import { useQuery } from '@tanstack/react-query';
import { Project, FeedbackItem, Deadline } from '@shared/schema';

export function StatsOverview() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const { data: pendingFeedback } = useQuery<FeedbackItem[]>({
    queryKey: ['/api/feedback'],
  });
  
  const { data: deadlines } = useQuery<Deadline[]>({
    queryKey: ['/api/deadlines'],
  });
  
  // Calculate stats
  const activeProjects = projects?.filter(p => p.status === 'in_progress' || p.status === 'needs_review') || [];
  const pendingFeedbackCount = pendingFeedback?.length || 0;
  
  // Get deadlines due within a week
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(now.getDate() + 7);
  
  const upcomingDeadlines = deadlines?.filter(d => {
    const dueDate = new Date(d.dueDate);
    return dueDate >= now && dueDate <= weekFromNow;
  }) || [];
  
  // Implement the stats cards with our new component
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <DashboardStat
        title="Active Projects"
        count={activeProjects.length}
      />
      
      <DashboardStat
        title="Pending Feedback"
        count={pendingFeedbackCount}
      />
      
      <DashboardStat
        title="Upcoming Deadlines"
        count={upcomingDeadlines.length}
      />
    </div>
  );
}
