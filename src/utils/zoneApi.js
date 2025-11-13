// Zone Management API Functions
import axios from "axios";
// Removed direct Supabase import - using backend API endpoints instead

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL ||
    (window.location.origin.includes("localhost")
      ? "http://localhost:8080"
      : "/api");

// Configure axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
});

/**
 * Fetch all zones with pagination and filters
 */
export const fetchZones = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.is_active !== undefined) {
      queryParams.append('is_active', params.is_active);
    }
    if (params.is_nationwide !== undefined) {
      queryParams.append('is_nationwide', params.is_nationwide);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }
    if (params.offset) {
      queryParams.append('offset', params.offset);
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/zones?${queryParams.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch zones');
    }
    
    return result;
  } catch (error) {
    console.error("Fetch zones error:", error);
    throw new Error(error.message || "Failed to fetch zones");
  }
};

/**
 * Fetch zone by ID with pincodes
 */
export const fetchZoneById = async (zoneId) => {
  try {
    const response = await api.get(`/zones/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error("Fetch zone by ID error:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch zone details");
  }
};

/**
 * Create new zone
 */
export const createZone = async (zoneData) => {
  try {
    const response = await api.post("/zones", zoneData);
    return response.data;
  } catch (error) {
    console.error("Create zone error:", error);
    throw new Error(error.response?.data?.error || "Failed to create zone");
  }
};

/**
 * Update zone
 */
export const updateZone = async (zoneId, zoneData) => {
  try {
    const response = await api.put(`/zones/${zoneId}`, zoneData);
    return response.data;
  } catch (error) {
    console.error("Update zone error:", error);
    throw new Error(error.response?.data?.error || "Failed to update zone");
  }
};

/**
 * Delete zone
 */
export const deleteZone = async (zoneId) => {
  try {
    const response = await api.delete(`/zones/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error("Delete zone error:", error);
    throw new Error(error.response?.data?.error || "Failed to delete zone");
  }
};

/**
 * Upload Excel file with zones and pincodes
 */
export const uploadZoneExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append("csv_file", file);

    const response = await api.post("/zones/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload Excel error:", error);
    throw new Error(
      error.response?.data?.error || "Failed to upload Excel file"
    );
  }
};

/**
 * Validate pincode for delivery
 */
export const validatePincode = async (pincode) => {
  try {
    const response = await api.post("/zones/validate-pincode", { pincode });
    return response.data;
  } catch (error) {
    console.error("Validate pincode error:", error);
    throw new Error(error.response?.data?.error || "Failed to validate pincode");
  }
};

/**
 * Get zone statistics
 */
export const getZoneStatistics = async () => {
  try {
    const response = await api.get("/zones/statistics");
    return response.data;
  } catch (error) {
    console.error("Get zone statistics error:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch statistics");
  }
};

/**
 * Check delivery availability for multiple products
 */
export const checkProductsDelivery = async (productIds, pincode) => {
  try {
    const response = await api.post("/productsroute/check-delivery", {
      product_ids: productIds,
      pincode,
    });
    return response.data;
  } catch (error) {
    console.error("Check products delivery error:", error);
    throw new Error(
      error.response?.data?.error || "Failed to check delivery availability"
    );
  }
};

/**
 * Update product delivery settings
 */
export const updateProductDelivery = async (productId, deliveryData) => {
  try {
    const response = await api.put(
      `/api/productsroute/${productId}/delivery`,
      deliveryData
    );
    return response.data;
  } catch (error) {
    console.error("Update product delivery error:", error);
    throw new Error(
      error.response?.data?.error ||
        "Failed to update product delivery settings"
    );
  }
};

/**
 * Get products by delivery zone/pincode
 */
export const getProductsByDeliveryZone = async (params = {}) => {
  try {
    const response = await api.get("/productsroute/delivery-zone", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Get products by delivery zone error:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch products");
  }
};

/**
 * Get product with delivery information
 */
export const getProductWithDelivery = async (productId, pincode) => {
  try {
    const params = pincode ? { pincode } : {};
    const response = await api.get(`/productsroute/${productId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Get product with delivery error:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch product");
  }
};

export default {
  fetchZones,
  fetchZoneById,
  createZone,
  updateZone,
  deleteZone,
  uploadZoneExcel,
  validatePincode,
  getZoneStatistics,
  checkProductsDelivery,
  updateProductDelivery,
  getProductsByDeliveryZone,
  getProductWithDelivery,
};
