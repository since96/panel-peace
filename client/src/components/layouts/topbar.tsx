import { Bell, Search, Menu, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TopbarProps {
  toggleSidebar: () => void;
}

export function Topbar({ toggleSidebar }: TopbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-slate-600 hover:text-slate-900 focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="hidden md:flex items-center space-x-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search projects, assets, collaborators..."
            className="pl-8 bg-slate-100 w-64"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full"></span>
        </Button>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden text-slate-600 hover:text-slate-900">
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
