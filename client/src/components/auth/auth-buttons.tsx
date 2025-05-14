import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogIn, LogOut } from "lucide-react";

export function AuthButtons() {
  const { user, isLoading, isAuthenticated } = useAuth();

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
      <div className="flex items-center gap-4">
        {user?.avatarUrl && (
          <img 
            src={user.avatarUrl} 
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
        )}
        <span className="text-sm font-medium hidden md:inline-block">
          {user?.fullName || user?.username}
        </span>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/logout">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Button variant="default" size="sm" asChild>
      <a href="/api/login">
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </a>
    </Button>
  );
}