import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export function AppLayout({ children, isOpen, toggleSidebar, closeSidebar }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isOpen} onClose={isOpen ? closeSidebar : undefined} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
