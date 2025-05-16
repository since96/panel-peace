import { useDirectAuth } from './useDirectAuth';

export function useHasEditAccess() {
  const { user, isAuthenticated } = useDirectAuth();
  
  if (!isAuthenticated || !user) {
    return false;
  }
  
  // Site admins always have edit access
  if (user.isSiteAdmin) {
    return true;
  }
  
  // Check if user has explicit view-only access (hasEditAccess === false)
  if (user.hasEditAccess === false) {
    return false;
  }
  
  // Default to true for backward compatibility with users who don't have the hasEditAccess property
  return true;
}