import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, login, error } = useAuth();
  const [location] = useLocation();

  // If the authentication state changes and user is not authenticated, redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Add a small delay to allow for any pending auth operations
      const timeoutId = setTimeout(() => {
        login();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading, login]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mt-4 text-lg font-medium">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-destructive/10 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">
            There was a problem authenticating your account. Please try logging in again.
          </p>
          <Button onClick={login} variant="default">
            Login
          </Button>
        </div>
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
            onClick={() => login()}
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