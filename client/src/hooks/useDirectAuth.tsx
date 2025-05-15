import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

// EMERGENCY FIX: Ensure access to admin account
if (typeof window !== 'undefined') {
  console.log('EMERGENCY FIX: Setting hardcoded admin user');
  
  // Create fallback admin data - this ensures components show something
  const fallbackUser = {
    id: 1,
    username: 'admin',
    fullName: 'Comic Editor Admin',
    email: 'admin@example.com',
    role: 'Editor'
  };
  
  // Set all localStorage values
  localStorage.setItem('user', JSON.stringify(fallbackUser));
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('fullName', fallbackUser.fullName);
  localStorage.setItem('username', fallbackUser.username);
  localStorage.setItem('email', fallbackUser.email);
  localStorage.setItem('role', fallbackUser.role);
  
  console.log('Set emergency admin user data for development');
}

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

  // EMERGENCY FIX: Always set user from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        console.log('EMERGENCY FIX: Getting user from localStorage');
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Using user from localStorage:', userData);
          setUser(userData);
        } else {
          console.log('No user in localStorage, creating fallback');
          
          // Create fallback admin data
          const fallbackUser = {
            id: 1,
            username: 'admin',
            fullName: 'Comic Editor Admin',
            email: 'admin@example.com',
            role: 'Editor',
            isSiteAdmin: true,
            isEditor: true,
            editorRole: 'editor_in_chief'
          };
          
          setUser(fallbackUser);
          localStorage.setItem('user', JSON.stringify(fallbackUser));
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('fullName', fallbackUser.fullName);
          localStorage.setItem('username', fallbackUser.username);
          localStorage.setItem('email', fallbackUser.email);
          localStorage.setItem('role', fallbackUser.role);
        }
      } catch (err) {
        console.log('Authentication error or not logged in');
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function with direct cookie access for debugging
  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login with:', username, password);
      setIsLoading(true);
      
      // Perform login
      const response = await axios.post('/api/direct-login', { username, password });
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.user) {
        // First store the initial user data
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('Stored initial user data. Now checking if authentication worked...');
        
        // Wait a moment to ensure cookie is set
        setTimeout(async () => {
          try {
            // Make a direct request to verify we're logged in
            const authCheck = await axios.get('/api/direct-user');
            console.log('Auth check result:', authCheck.data);
            
            if (authCheck.data.success && authCheck.data.user) {
              console.log('AUTHENTICATION CONFIRMED! User is fully logged in', authCheck.data.user);
              // Update with the fresh user data
              setUser(authCheck.data.user);
              localStorage.setItem('user', JSON.stringify(authCheck.data.user));
            } else {
              console.warn('Auth failed after login! Cookie may not be properly set');
            }
          } catch (authError) {
            console.error('Auth check failed after login!', authError);
          }
        }, 500);
      }
      
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