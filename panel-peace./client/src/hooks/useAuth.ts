import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import axios from "axios";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Fetch current user from the simple auth endpoint, but enable the query only after initial mount
  const { 
    data: user, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<User>({
    queryKey: ["/api/simple-user"],
    retry: 0, // Don't retry to avoid loops
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false, // Disable auto refetching to prevent loops
    refetchOnReconnect: false,
    // Gracefully handle unauthorized errors
    gcTime: 0,
    enabled: authChecked, // Only run the query after auth check
  });
  
  // Initial auth check
  useEffect(() => {
    setAuthChecked(true);
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await axios.post("/api/simple-login", credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simple-user"] });
      refetch();
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await axios.post("/api/simple-logout");
    },
    onSuccess: () => {
      // Clear localStorage to prevent access after logout
      localStorage.removeItem("user");
      sessionStorage.clear();
      
      // Clear all queries and redirect to login
      queryClient.invalidateQueries({ queryKey: ["/api/simple-user"] });
      queryClient.clear();
      
      // Force reload the page to prevent browser back button access
      window.location.href = "/login";
    }
  });

  const login = (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  // Simple function to redirect to login page
  const goToLogin = () => {
    setLocation("/login");
  };

  return {
    user,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    isAuthenticated: !!user,
    error,
    refetch,
    login,
    logout,
    goToLogin,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
}