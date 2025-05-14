import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mt-4">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    window.location.href = `/api/login?returnTo=${encodeURIComponent(location)}`;
    return null;
  }

  return <>{children}</>;
}