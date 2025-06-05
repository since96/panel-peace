import { useDirectAuth } from '@/hooks/useDirectAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { UserCircle, LogOut, Menu } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export function SimpleNav({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const { user, isAuthenticated, logout } = useDirectAuth();

  const handleLogout = async () => {
    await logout();
    // Force a direct navigation to the landing page by setting the full URL
    const baseUrl = window.location.origin;
    window.location.href = baseUrl;
  };

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {toggleSidebar && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <a href="/" className="text-xl font-bold text-primary hover:text-primary/80">
            Panel Peace
          </a>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme switcher removed */}
          
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{user?.fullName || user?.username}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-destructive hover:text-destructive/80"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <a href="/simple-login">
              <Button size="sm">Login</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}