/**
 * Helper functions for browser compatibility
 */

/**
 * Create a plain object from form data with primitives only
 * This helps avoid issues with Date objects and complex types
 */
export function sanitizeFormData(data: any) {
  const result: Record<string, any> = {};
  
  // Process each field to ensure we get primitives
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Skip null/undefined values
    if (value === null || value === undefined) {
      return;
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      try {
        result[key] = value.toISOString(); // Convert to ISO string
      } catch (e) {
        console.error(`Failed to convert date field ${key}:`, e);
      }
      return;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      result[key] = [...value]; // Simple copy
      return;
    }
    
    // Handle objects (but not functions)
    if (typeof value === 'object') {
      try {
        // Test if it can be safely serialized/deserialized
        const test = JSON.stringify(value);
        result[key] = JSON.parse(test);
      } catch (e) {
        console.error(`Failed to sanitize object field ${key}:`, e);
      }
      return;
    }
    
    // Primitives and anything else
    result[key] = value;
  });
  
  return result;
}

/**
 * Safely submit data to an API endpoint with consistent error handling
 */
export async function safeApiSubmit(endpoint: string, data: any) {
  try {
    // Sanitize the data first
    const sanitizedData = sanitizeFormData(data);
    
    console.log(`Submitting to ${endpoint}:`, sanitizedData);
    
    // Make the request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
      credentials: 'include'
    });
    
    // Get text response for safer parsing
    const responseText = await response.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("Invalid response from server");
    }
    
    // Check if response is ok
    if (!response.ok) {
      const errorMessage = responseData?.message || `Error: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return responseData;
  } catch (error) {
    console.error("API submission error:", error);
    throw error;
  }
}