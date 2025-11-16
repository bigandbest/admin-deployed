// Backend API utility functions
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Admin Authentication
export async function adminLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function adminLogout() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin-auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAdminMe() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin-auth/me`, {
      credentials: "include",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    return {
      success: false,
      error: data.error || data.message || "Request failed",
    };
  }
  return { success: true, ...data };
};

// Helper function to create FormData for file uploads
const createFormData = (data, fileField = null, file = null) => {
  const formData = new FormData();

  // Add all data fields
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  // Add file if provided
  if (file && fileField) {
    formData.append(fileField, file);
  }

  return formData;
};

// VIDEO BANNERS
export async function getAllVideoBanners() {
  try {
    const response = await fetch(`${API_BASE_URL}/video-cards/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addVideoBanner(videoBanner, videoFile) {
  try {
    const formData = createFormData(videoBanner, "video", videoFile);
    const response = await fetch(`${API_BASE_URL}/video-cards/add`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateVideoBanner(id, videoBanner, videoFile) {
  try {
    const formData = createFormData(videoBanner, "video", videoFile);
    const response = await fetch(`${API_BASE_URL}/video-cards/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteVideoBanner(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/video-cards/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleVideoBannerStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/video-cards/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BANNERS
export async function getAllBanners() {
  try {
    const response = await fetch(`${API_BASE_URL}/banner/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getBanner(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner/${id}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addBanner(banner, imageFile) {
  try {
    const formData = createFormData(banner, "image", imageFile);
    const response = await fetch(`${API_BASE_URL}/banner/add`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateBanner(id, banner, imageFile) {
  try {
    const formData = createFormData(banner, "image", imageFile);
    const response = await fetch(`${API_BASE_URL}/banner/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteBanner(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleBannerStatus(id, active) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleMobileBannerStatus(id, is_mobile) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_mobile }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// USERS
export async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/business/business-users`);
    const result = await handleResponse(response);
    if (result.success) {
      return { success: true, users: result.users || result.data };
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addUser(user, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, password }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ORDERS
export async function getAllOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(id, status, adminNotes = "") {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/status/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BRANDS
export async function getAllBrands() {
  try {
    const response = await fetch(`${API_BASE_URL}/brand/list`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getBrand(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand/${id}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addBrand(brand, imageFile) {
  try {
    const formData = createFormData(brand, "image_url", imageFile);
    const response = await fetch(`${API_BASE_URL}/brand/add`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateBrand(id, brand, imageFile) {
  try {
    const formData = createFormData(brand, "image_url", imageFile);
    const response = await fetch(`${API_BASE_URL}/brand/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteBrand(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSingleBrand(id) {
  return getBrand(id);
}

// BANNER GROUPS
export async function getAllBannerGroups() {
  try {
    const response = await fetch(`${API_BASE_URL}/banner-group/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addBannerGroup(bannerGroup, imageFile) {
  try {
    const formData = createFormData(bannerGroup, "image_url", imageFile);
    const response = await fetch(`${API_BASE_URL}/banner-group/add`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateBannerGroup(id, bannerGroup, imageFile) {
  try {
    const formData = createFormData(bannerGroup, "image_url", imageFile);
    const response = await fetch(`${API_BASE_URL}/banner-group/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteBannerGroup(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner-group/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getBannerGroupById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner-group/${id}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BANNER GROUP PRODUCTS
export async function mapProductToBannerGroup(productId, bannerGroupId) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner-group-product/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        add_banner_group_id: bannerGroupId,
      }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function removeProductFromBannerGroup(productId, bannerGroupId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/banner-group-product/remove`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          add_banner_group_id: bannerGroupId,
        }),
      }
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getBannerGroupsForProduct(productId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/banner-group-product/by-product/${productId}`
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getProductsForBannerGroup(bannerGroupId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/banner-group-product/by-group/${bannerGroupId}`
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BRAND PRODUCTS
export async function mapProductToBrand(productId, brandId) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand-product/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, brand_id: brandId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function removeProductFromBrand(productId, brandId) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand-product/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, brand_id: brandId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getBrandsForProduct(productId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/brand-product/product/${productId}`
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getProductsForBrand(brandId) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand-product/${brandId}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// PRODUCTS
export async function getAllProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/allproducts`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// CATEGORIES
export async function getAllCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/hierarchy`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// WAREHOUSES
export async function getAllWarehouses(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.type) params.append("type", options.type);
    if (options.is_active !== undefined)
      params.append("is_active", options.is_active);

    const response = await fetch(`${API_BASE_URL}/warehouses?${params}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createWarehouse(warehouseData) {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(warehouseData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSingleWarehouse(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${id}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateWarehouse(id, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteWarehouse(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ZONES
export async function getAllZones(options = {}) {
  try {
    const params = new URLSearchParams();
    Object.keys(options).forEach((key) => {
      if (options[key] !== undefined) {
        params.append(key, options[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/zones?${params}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getZoneStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/zones/statistics`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BULK ORDERS
export async function getAllBulkOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/bulk-order/enquiries`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateBulkOrderStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/bulk-order/enquiry/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// COD ORDERS
export async function getAllCodOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/cod-orders/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateCodOrderStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/cod-orders/status/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// RETURN ORDERS
export async function getAllReturnRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/return-orders/admin/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateReturnRequestStatus(id, status) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/return-orders/admin/status/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// NOTIFICATIONS
export async function getAllNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/collect`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createNotification(notification) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// STOCK MANAGEMENT
export async function updateProductStock(productId, stockData) {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stockData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getProductStock(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/${productId}`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// PRODUCT SECTIONS
export async function getAllProductSections() {
  try {
    const response = await fetch(`${API_BASE_URL}/product-sections`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getActiveProductSections() {
  try {
    const response = await fetch(`${API_BASE_URL}/product-sections/active`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProductSection(id, sectionData) {
  try {
    const response = await fetch(`${API_BASE_URL}/product-sections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleProductSectionStatus(id) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product-sections/${id}/toggle`,
      {
        method: "PATCH",
      }
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProductSectionOrder(sectionsOrder) {
  try {
    const response = await fetch(`${API_BASE_URL}/product-sections/order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: sectionsOrder }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// PROMO BANNERS
export async function getAllPromoBanners() {
  try {
    const response = await fetch(`${API_BASE_URL}/promo-banner/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addPromoBanner(banner) {
  try {
    const response = await fetch(`${API_BASE_URL}/promo-banner/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banner),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updatePromoBanner(id, banner) {
  try {
    const response = await fetch(`${API_BASE_URL}/promo-banner/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banner),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deletePromoBanner(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/promo-banner/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function togglePromoBannerStatus(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/promo-banner/toggle/${id}`, {
      method: "PUT",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Placeholder functions for compatibility (implement as needed)
export const getshippingBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const addShippingBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const updateShippingBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteShippingBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const toggleShippingBannerStatus = () => ({
  success: false,
  error: "Not implemented",
});
export const getAllAdsBanners = () => ({
  success: false,
  error: "Not implemented",
});
export const addAdsBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const updateAdsBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteAdsBanner = () => ({
  success: false,
  error: "Not implemented",
});
export const toggleAdsBannerStatus = () => ({
  success: false,
  error: "Not implemented",
});
export const addCategory = () => ({ success: false, error: "Not implemented" });
export const updateCategory = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteCategory = () => ({
  success: false,
  error: "Not implemented",
});
export const toggleCategoryStatus = () => ({
  success: false,
  error: "Not implemented",
});
export async function getAllSubcategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/subcategories`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export const getSubcategoriesByCategory = () => ({
  success: false,
  error: "Not implemented",
});
export const addSubcategory = () => ({
  success: false,
  error: "Not implemented",
});
export const updateSubcategory = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteSubcategory = () => ({
  success: false,
  error: "Not implemented",
});
export async function getAllGroups() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/groups`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export const getGroupsBySubcategory = () => ({
  success: false,
  error: "Not implemented",
});
export const addGroup = () => ({ success: false, error: "Not implemented" });
export const updateGroup = () => ({ success: false, error: "Not implemented" });
export const deleteGroup = () => ({ success: false, error: "Not implemented" });
export const addProduct = () => ({ success: false, error: "Not implemented" });
export async function updateProduct(
  id,
  productData,
  displayImageFile,
  imageFiles,
  videoFile
) {
  try {
    const formData = new FormData();

    // Add product data
    Object.keys(productData).forEach((key) => {
      if (productData[key] !== null && productData[key] !== undefined) {
        if (Array.isArray(productData[key])) {
          formData.append(key, JSON.stringify(productData[key]));
        } else {
          formData.append(key, productData[key]);
        }
      }
    });

    // Add files
    if (displayImageFile) {
      formData.append("displayImage", displayImageFile);
    }
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file, index) => {
        formData.append(`images`, file);
      });
    }
    if (videoFile) {
      formData.append("video", videoFile);
    }

    const response = await fetch(`${API_BASE_URL}/productsroute/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export async function deleteProduct(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/productsroute/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export const updateUser = () => ({ success: false, error: "Not implemented" });
export const deleteUser = () => ({ success: false, error: "Not implemented" });
export const toggleUserStatus = () => ({
  success: false,
  error: "Not implemented",
});
export const getDashboardData = () => ({
  success: false,
  error: "Not implemented",
});
export const getAllEnquiries = () => ({
  success: false,
  error: "Not implemented",
});
export const getEnquiryWithReplies = () => ({
  success: false,
  error: "Not implemented",
});
export const addEnquiryReply = () => ({
  success: false,
  error: "Not implemented",
});
export const updateEnquiryStatus = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteEnquiry = () => ({
  success: false,
  error: "Not implemented",
});
export const getWebsiteSettings = () => ({
  success: false,
  error: "Not implemented",
});
export const updateWebsiteSetting = () => ({
  success: false,
  error: "Not implemented",
});
export const updateMultipleWebsiteSettings = () => ({
  success: false,
  error: "Not implemented",
});
export const getSettingsByCategory = () => ({
  success: false,
  error: "Not implemented",
});
export const upsertWebsiteSetting = () => ({
  success: false,
  error: "Not implemented",
});
export const uploadWebsiteImage = () => ({
  success: false,
  error: "Not implemented",
});
export const getPromotionalSettings = () => ({
  success: false,
  error: "Not implemented",
});
export const updatePromotionalSetting = () => ({
  success: false,
  error: "Not implemented",
});
export const updateMultiplePromotionalSettings = () => ({
  success: false,
  error: "Not implemented",
});
// PRINT REQUESTS
export async function getAllPrintRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/print-requests/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPrintRequestWithReplies(id) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/print-requests/${id}/replies`
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addPrintRequestReply(id, message, isAdmin = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/print-requests/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, is_admin: isAdmin }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updatePrintRequestStatus(
  id,
  status,
  adminNote,
  estimatedPrice,
  finalPrice,
  priceNotes
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/print-requests/${id}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_note: adminNote,
          estimated_price: estimatedPrice,
          final_price: finalPrice,
          price_notes: priceNotes,
        }),
      }
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updatePrintRequestPricing(
  id,
  estimatedPrice,
  finalPrice,
  priceNotes
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/print-requests/${id}/pricing`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimated_price: estimatedPrice,
          final_price: finalPrice,
          price_notes: priceNotes,
        }),
      }
    );
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deletePrintRequest(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/print-requests/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export const addUserWithDetailedAddress = () => ({
  success: false,
  error: "Not implemented",
});
export const updateUserWithDetailedAddress = () => ({
  success: false,
  error: "Not implemented",
});
export const getAllUsersWithDetailedAddress = () => ({
  success: false,
  error: "Not implemented",
});
export const getUserAddresses = () => ({
  success: false,
  error: "Not implemented",
});
export const migrateUserAddresses = () => ({
  success: false,
  error: "Not implemented",
});
export const addUserAddress = () => ({
  success: false,
  error: "Not implemented",
});
export const updateUserAddress = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteUserAddress = () => ({
  success: false,
  error: "Not implemented",
});
export const setAddressAsDefault = () => ({
  success: false,
  error: "Not implemented",
});
export const getStorageUsage = () => ({
  success: false,
  error: "Not implemented",
});
export const listBucketFiles = () => ({
  success: false,
  error: "Not implemented",
});
export const deleteStorageFile = () => ({
  success: false,
  error: "Not implemented",
});
export const getFileInfo = () => ({ success: false, error: "Not implemented" });
export const getStorageAnalytics = () => ({
  success: false,
  error: "Not implemented",
});
export const getZonalWarehouseAvailablePincodes = () => ({
  success: false,
  error: "Not implemented",
});
export const getZonalWarehouseAvailablePincodesDirect = () => ({
  success: false,
  error: "Not implemented",
});
export const getWarehouseProducts = () => ({
  success: false,
  error: "Not implemented",
});
export const addProductToWarehouse = () => ({
  success: false,
  error: "Not implemented",
});
export const updateWarehouseProduct = () => ({
  success: false,
  error: "Not implemented",
});
export const removeProductFromWarehouse = () => ({
  success: false,
  error: "Not implemented",
});
export const getWarehouseHierarchy = () => ({
  success: false,
  error: "Not implemented",
});
export const getChildWarehouses = () => ({
  success: false,
  error: "Not implemented",
});
// VIDEO CARDS
export async function getAllVideoCards() {
  try {
    const response = await fetch(`${API_BASE_URL}/video-cards/all`);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addVideoCard(videoCard, thumbnailFile) {
  try {
    const formData = createFormData(videoCard, "thumbnail", thumbnailFile);
    const response = await fetch(`${API_BASE_URL}/video-cards/add`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateVideoCard(id, videoCard, thumbnailFile) {
  try {
    const formData = createFormData(videoCard, "thumbnail", thumbnailFile);
    const response = await fetch(`${API_BASE_URL}/video-cards/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteVideoCard(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/video-cards/delete/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
export const getProductsByCategory = () => ({
  success: false,
  error: "Not implemented",
});
export const getProductCountByCategory = () => ({
  success: false,
  error: "Not implemented",
});
export const checkCategoryHasProducts = () => ({
  success: false,
  error: "Not implemented",
});
export const addProductWithWarehouse = () => ({
  success: false,
  error: "Not implemented",
});
export const getZoneDetails = () => ({
  success: false,
  error: "Not implemented",
});
