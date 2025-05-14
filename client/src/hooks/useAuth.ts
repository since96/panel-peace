import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: 2,  // Retry up to 2 times in case of temporary errors
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchOnWindowFocus: true, // Refresh when window gains focus
    refetchOnReconnect: true, // Refresh when connection is re-established
  });

  const login = () => {
    // Redirect to login page
    window.location.href = "/api/login";
  };

  const logout = () => {
    // Redirect to logout endpoint
    window.location.href = "/api/logout";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
    login,
    logout
  };
}