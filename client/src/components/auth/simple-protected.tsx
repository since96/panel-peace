import { ReactNode, useEffect } from 'react';
import { useDirectAuth } from '@/hooks/useDirectAuth';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleProtectedProps {
  children: ReactNode;
}

export function SimpleProtected({ children }: SimpleProtectedProps) {
  const { isAuthenticated, isLoading, user } = useDirectAuth();

  // First check localStorage directly to avoid flashing login screen
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const isAuthFromStorage = localStorage.getItem('isAuthenticated') === 'true';
    
    // If already logged in according to localStorage, we don't need to redirect
    if (isAuthFromStorage && savedUser) {
      console.log('User authenticated from localStorage in SimpleProtected');
      return;
    }

    // Only redirect to login if not authenticated after loading completes
    // We're adding a path check to make sure we only redirect for protected routes
    if (!isLoading && !isAuthenticated && !window.location.pathname.match(/^\/$|^\/landing\/?$/)) {
      console.log('Not authenticated in SimpleProtected, redirecting to login page');
      window.location.replace('/simple-login');
    } else if (!isLoading && isAuthenticated) {
      console.log('Authenticated in SimpleProtected, user:', user);
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <span className="mt-4 text-lg font-medium">Loading...</span>
      </div>
    );
  }

  // Don't bypass authentication - this ensures view-only permissions work
  const bypassAuth = false;
  
  if (!isAuthenticated && !bypassAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-muted p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to access this page.
          </p>
          <Button 
            onClick={() => (window.location.href = '/')}
            variant="default"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}