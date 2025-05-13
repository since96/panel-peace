import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Plus, Settings } from 'lucide-react';
import { Project } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Filter to only get 3 most recent projects
  const recentProjects = projects?.slice(0, 3) || [];
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'ri-dashboard-line' },
    { name: 'My Projects', href: '/projects', icon: 'ri-file-list-line' },
    { name: 'Scripts', href: '/script-editor', icon: 'ri-file-text-line' },
    { name: 'Panel Editor', href: '/panel-editor', icon: 'ri-layout-3-line' },
    { name: 'Collaborators', href: '/collaborators', icon: 'ri-team-line' },
    { name: 'Asset Library', href: '/asset-library', icon: 'ri-folder-line' },
    { name: 'Publication', href: '/publication', icon: 'ri-book-2-line' },
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
          <h1 className="text-xl font-bold text-slate-900">Comic Editor Pro</h1>
        </div>
      </div>
      
      <div className="p-4 border-b border-slate-200">
        <Link href="/projects/new">
          <Button className="w-full flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
            >
              <a
                className={cn(
                  'flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors',
                  location === item.href 
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-slate-100'
                )}
              >
                <i className={item.icon}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-200">
            <p className="px-3 text-xs text-slate-500 uppercase font-medium">Recent Projects</p>
            <div className="mt-2 space-y-1">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  onClick={onClose}
                >
                  <a className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                    <span className={`w-2 h-2 rounded-full ${getStatusIndicator(project.status)}`}></span>
                    <span className="truncate">{project.title} {project.issue}</span>
                  </a>
                </Link>
              ))}
              
              {recentProjects.length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-2">No recent projects</p>
              )}
            </div>
          </div>
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="user" />
            <AvatarFallback className="bg-primary/10 text-primary">AR</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Alex Rodriguez</p>
            <p className="text-xs text-slate-500 truncate">Senior Editor</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
