import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

// Define user type
interface User {
  id: number | string;
  username: string;
  fullName?: string;
  email?: string;
  isEditor?: boolean;
  [key: string]: any; // Allow for additional properties
}

// Define auth context state
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const DirectAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/direct-user');
        if (response.data.success) {
          setUser(response.data.user);
          console.log('Authentication successful, user:', response.data.user);
        } else {
          // Try the auth endpoint
          try {
            const authResponse = await axios.get('/api/auth/user');
            setUser(authResponse.data);
            console.log('Authentication successful via /api/auth/user, user:', authResponse.data);
          } catch (authErr) {
            console.log('Not authenticated via /api/auth/user either');
            setUser(null);
          }
        }
      } catch (err) {
        console.log('Not authenticated via /api/direct-user');
        // Try the auth endpoint
        try {
          const authResponse = await axios.get('/api/auth/user');
          setUser(authResponse.data);
          console.log('Authentication successful via /api/auth/user, user:', authResponse.data);
        } catch (authErr) {
          console.log('Not authenticated via /api/auth/user either');
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/direct-login', { username, password });
      setUser(response.data.user);
      return response.data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await axios.post('/api/direct-logout');
      setUser(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useDirectAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDirectAuth must be used within a DirectAuthProvider');
  }
  return context;
};