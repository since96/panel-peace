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

  // Check if user is logged in - first try localStorage, then API
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // First check localStorage
      const savedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (savedUser && isAuthenticated === 'true') {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('User found in localStorage:', parsedUser);
          setUser(parsedUser);
          setIsLoading(false);
          return; // Exit early, we're already authenticated
        } catch (err) {
          console.error('Error parsing user from localStorage:', err);
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
        }
      }
      
      // If localStorage failed, try API endpoints
      try {
        const response = await axios.get('/api/direct-user');
        if (response.data.success) {
          setUser(response.data.user);
          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('isAuthenticated', 'true');
          console.log('Authentication successful via API, user:', response.data.user);
        } else {
          // Try the auth endpoint
          try {
            const authResponse = await axios.get('/api/auth/user');
            setUser(authResponse.data);
            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(authResponse.data));
            localStorage.setItem('isAuthenticated', 'true');
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
          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(authResponse.data));
          localStorage.setItem('isAuthenticated', 'true');
          console.log('Authentication successful via /api/auth/user, user:', authResponse.data);
        } catch (authErr) {
          console.log('Not authenticated via /api/auth/user either');
          setUser(null);
          // Clear localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
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
      console.log('Attempting login with username:', username, 'password length:', password.length);
      setIsLoading(true);
      const response = await axios.post('/api/direct-login', { username, password });
      console.log('Login response:', response.data);
      
      setUser(response.data.user);
      
      // Store authentication in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      console.log('User stored in localStorage');
      
      return response.data;
    } catch (err: any) {
      console.error('Login error:', err);
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
      
      // Clear localStorage on logout
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      console.log('User removed from localStorage');
    } catch (err: any) {
      console.error('Logout error:', err);
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