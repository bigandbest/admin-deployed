const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || data.message || "Request failed" };
  }
  return { success: true, ...data };
};

export const sellerLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sellerLogout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller-auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSellerMe = async () => {
  try {
    const token = localStorage.getItem('seller_token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/seller-auth/me`, {
      headers,
      credentials: 'include'
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const verifySellerToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller-auth/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};
