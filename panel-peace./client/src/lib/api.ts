/**
 * API utility functions for making authenticated requests
 */

// Function to get the current JWT token from cookies
function getJwtFromCookies() {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('jwt='));
  
  if (tokenCookie) {
    return tokenCookie.split('=')[1].trim();
  }
  
  // Try to get session token if JWT is not in cookies
  const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('connect.sid='));
  if (sessionCookie) {
    return sessionCookie.split('=')[1].trim();
  }
  
  return null;
}

/**
 * Make an authenticated API request with proper error handling
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    // Add default headers and ensure credentials are included
    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'include',  // This is critical for sending cookies with the request
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      }
    };
    
    // Get JWT token from cookies
    const jwtToken = getJwtFromCookies();
    
    // Explicitly check for authentication token in localStorage
    const token = localStorage.getItem('auth_token') || jwtToken;
    
    // Add Authorization header if token exists
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    console.log(`Making ${options.method || 'GET'} request to ${url}`);
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle error responses
    if (!response.ok) {
      console.error(`API error (${response.status}):`, data);
      throw {
        status: response.status,
        message: data.message || 'An error occurred',
        data
      };
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * GET request wrapper
 */
export async function apiGet(url: string) {
  return apiRequest(url);
}

/**
 * POST request wrapper
 */
export async function apiPost(url: string, data: any) {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * PUT request wrapper
 */
export async function apiPut(url: string, data: any) {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * PATCH request wrapper
 */
export async function apiPatch(url: string, data: any) {
  return apiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/**
 * DELETE request wrapper
 */
export async function apiDelete(url: string) {
  return apiRequest(url, {
    method: 'DELETE'
  });
}