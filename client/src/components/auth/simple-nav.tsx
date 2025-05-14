import { useDirectAuth } from '@/hooks/useDirectAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { UserCircle, LogOut } from 'lucide-react';

export function SimpleNav() {
  const { user, isAuthenticated, logout } = useDirectAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/simple-login';
  };

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <a href="/" className="text-xl font-bold text-primary hover:text-primary/80">
            Comic Editor Pro
          </a>
        </div>

        <div className="flex items-center space-x-4">
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