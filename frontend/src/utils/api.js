/**
 * API utility functions for making authenticated requests
 */

/**
 * Get headers with Authorization Bearer token
 * @param {string} token - The user's authentication token
 * @returns {Object} Headers object with Authorization and Content-Type
 */
export const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Make an authenticated API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {string} token - The user's authentication token
 * @returns {Promise<Response>} The fetch response
 */
export const apiRequest = async (url, options = {}, token) => {
  const headers = {
    ...getAuthHeaders(token),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
