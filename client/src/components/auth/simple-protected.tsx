import { ReactNode, useEffect } from 'react';
import { useDirectAuth } from '@/hooks/useDirectAuth';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleProtectedProps {
  children: ReactNode;
}

export function SimpleProtected({ children }: SimpleProtectedProps) {
  const { isAuthenticated, isLoading } = useDirectAuth();

  // If not authenticated, redirect to login page
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/simple-login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <span className="mt-4 text-lg font-medium">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-muted p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to access this page.
          </p>
          <Button 
            onClick={() => (window.location.href = '/simple-login')}
            variant="default"
          >
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}