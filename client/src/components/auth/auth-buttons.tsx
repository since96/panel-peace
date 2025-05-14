import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogIn, LogOut, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export function AuthButtons() {
  const { user, isLoading, isAuthenticated, login, logout, refetch } = useAuth();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        {user?.avatarUrl && (
          <img 
            src={user.avatarUrl} 
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover border border-primary/20"
          />
        )}
        <span className="text-sm font-medium hidden md:inline-block">
          {user?.fullName || user?.username || user?.id}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => refetch()}
          title="Refresh user data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={logout}
          className="flex items-center"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="default" 
        size="sm" 
        onClick={login}
        className="flex items-center"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </Button>
      
      <a 
        href="/login-page.html" 
        className="text-sm text-primary hover:underline flex items-center"
        title="Alternative login page"
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">Alt Login</span>
      </a>
    </div>
  );
}