// Utility function for making authenticated API calls
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  return response;
};

// Helper function to get the base URL
export const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5050';
}; 