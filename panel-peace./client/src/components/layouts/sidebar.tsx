import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Plus, Settings } from 'lucide-react';
import { Project } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useDirectAuth } from '@/hooks/useDirectAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useDirectAuth();
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Filter to only get 3 most recent projects
  const recentProjects = projects?.slice(0, 3) || [];
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'ri-dashboard-line' },
    { name: 'Comic Books', href: '/projects', icon: 'ri-file-list-line' },
    { name: 'Creators & Editors', href: '/collaborators', icon: 'ri-team-line' },
    { name: 'Bullpens', href: '/studios', icon: 'ri-building-line' },
    { name: 'Deadline Helper', href: '/deadline-helper', icon: 'ri-calendar-check-line' },
  ];
  
  // Get status color for each project
  const getStatusIndicator = (status: string) => {
    if (status === 'in_progress') return 'bg-success';
    if (status === 'needs_review') return 'bg-warning';
    if (status === 'delayed') return 'bg-danger';
    return 'bg-slate-300';
  };
  
  const sidebarClasses = cn(
    'flex-col bg-white shadow-sm z-10 h-full',
    isOpen ? 'flex' : 'hidden md:flex',
    isOpen && !onClose ? 'md:w-64' : 'w-full md:w-64',
    onClose && 'fixed inset-y-0 left-0 z-50'
  );
  
  return (
    <div className={sidebarClasses}>
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <h1 className="text-xl font-bold text-slate-900">Panel Peace</h1>
        </div>
      </div>
      
      
      
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <div
              key={item.name}
              className={cn(
                'flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors cursor-pointer',
                location === item.href 
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-slate-100'
              )}
              onClick={() => {
                if (onClose) onClose();
                window.location.href = item.href;
              }}
            >
              <i className={item.icon}></i>
              <span>{item.name}</span>
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-200">
            <p className="px-3 text-xs text-slate-500 uppercase font-medium">Recent Comics</p>
            <div className="mt-2 space-y-1">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onClose) onClose();
                    window.location.href = `/projects/${project.id}`;
                  }}
                >
                  <span className={`w-2 h-2 rounded-full ${getStatusIndicator(project.status)}`}></span>
                  <span className="truncate">{project.title} {project.issue}</span>
                </div>
              ))}
              
              {recentProjects.length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-2">No recent comics</p>
              )}
            </div>
          </div>
          
          {/* Signup Promotion Banner */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xl font-bold text-amber-900 mb-2">Wishing you had this already?</h3>
              <p className="text-sm text-amber-800 mb-3">Sign up to be notified upon launch</p>
              
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 mb-3"
                onClick={() => {
                  window.location.href = "mailto:panelpeacesignup@gmail.com?subject=I%20NEED%20THIS%20IN%20MY%20LIFE!";
                }}
              >
                Sign Up
              </Button>
              
              <p className="text-xs text-amber-700">
                Shoot us your email and let us know your specific role in the comic book world.
              </p>
            </div>
          </div>
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || ""} alt={user?.fullName || localStorage.getItem('fullName') || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.fullName || localStorage.getItem('fullName') 
                ? (user?.fullName || localStorage.getItem('fullName') || "").split(' ').map(n => n?.[0] || "").join('') 
                : (user?.username || localStorage.getItem('username') || "").substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.fullName || localStorage.getItem('fullName') || user?.username || localStorage.getItem('username') || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.role || localStorage.getItem('role') || "Editor"}</p>
          </div>
          <Link href="/profile" className="text-slate-400 hover:text-slate-600">
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
