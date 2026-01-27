const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem('seller_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || data.message || "Request failed" };
  }
  return { success: true, ...data };
};

// Product Management
export const getSellerProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/seller/products?${params}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const searchMasterProducts = async (searchTerm) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/products/search?q=${encodeURIComponent(searchTerm)}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const requestNewProduct = async (productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/products/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addProductStock = async (productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/products/stock`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateOfferPrice = async (productId, offerPrice) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/products/${productId}/offer-price`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ offerPrice })
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Negotiation Management
export const getNegotiations = async (status = null) => {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/seller/negotiations${params}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const acceptCounterOffer = async (negotiationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/negotiations/${negotiationId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const declineCounterOffer = async (negotiationId, newOfferPrice) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/negotiations/${negotiationId}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newOfferPrice })
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Order Management
export const getSellerOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/seller/orders?${params}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getOrderDetails = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/orders/${orderId}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Analytics & Dashboard
export const getSellerDashboard = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/dashboard`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSellerEarnings = async (period = 'month') => {
  try {
    const response = await fetch(`${API_BASE_URL}/seller/earnings?period=${period}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
};
