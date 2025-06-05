import { useQuery } from '@tanstack/react-query';
import { Project, FeedbackItem, Deadline } from '@shared/schema';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

export default function NewDashboard() {
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
  
  return (
    <>
      <Helmet>
        <title>Dashboard - Panel Peace</title>
        <meta name="description" content="Manage your comic book projects, creative talent, and editorial workflow with Panel Peace's comprehensive dashboard." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your projects, talent, and editorial workflow</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <select className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option>All Projects</option>
              <option>In Progress</option>
              <option>Needs Review</option>
              <option>Completed</option>
              <option>Delayed</option>
            </select>
            <Button variant="default" size="sm" className="flex items-center space-x-1">
              <span>Filters</span>
            </Button>
          </div>
        </div>
        
        {/* Stats Cards - Pure implementation with no labels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-medium">Active Projects</p>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">{activeProjects.length}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-medium">Pending Feedback</p>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">{pendingFeedbackCount}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-medium">Upcoming Deadlines</p>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">{upcomingDeadlines.length}</span>
            </div>
          </div>
        </div>
        
        {/* Current Projects Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Current Projects</h2>
            <a href="/projects" className="text-primary text-sm hover:underline">View all projects</a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProjects.slice(0, 2).map(project => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="h-48 w-full bg-slate-100 border-b border-slate-200 flex items-center justify-center">
                  {/* Placeholder for project cover image */}
                  <div className="text-slate-400 text-4xl">
                    <i className="ri-book-open-line"></i>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{project.title} {project.issue}</h3>
                  <div className="flex items-center text-sm text-slate-500 mb-3">
                    <span className={`w-2 h-2 rounded-full ${project.status === 'in_progress' ? 'bg-success' : 'bg-warning'} mr-2`}></span>
                    <span>{project.status === 'in_progress' ? 'In Progress' : 'Needs Review'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}