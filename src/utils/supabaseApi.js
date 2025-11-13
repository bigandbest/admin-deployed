// Backend API integration - replaces direct Supabase calls
import * as backendApi from './backendApi.js';
import { formatDateOnlyIST } from "./dateUtils";

// Re-export all backend API functions for compatibility
export * from './backendApi.js';

// Keep utility functions that don't require Supabase
export { formatDateOnlyIST };

// Legacy compatibility - these functions now use backend API
export const {
  // Video Banners
  getAllVideoBanners,
  addVideoBanner,
  updateVideoBanner,
  deleteVideoBanner,
  toggleVideoBannerStatus,
  
  // Banners
  getAllBanners,
  getBanner,
  addBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  toggleMobileBannerStatus,
  
  // Users
  getAllUsers,
  addUser,
  
  // Orders
  getAllOrders,
  updateOrderStatus,
  
  // Brands
  getAllBrands,
  getBrand,
  addBrand,
  updateBrand,
  deleteBrand,
  getSingleBrand,
  
  // Banner Groups
  getAllBannerGroups,
  addBannerGroup,
  updateBannerGroup,
  deleteBannerGroup,
  getBannerGroupById,
  
  // Banner Group Products
  mapProductToBannerGroup,
  removeProductFromBannerGroup,
  getBannerGroupsForProduct,
  getProductsForBannerGroup,
  
  // Brand Products
  mapProductToBrand,
  removeProductFromBrand,
  getBrandsForProduct,
  getProductsForBrand,
  
  // Products
  getAllProducts,
  
  // Categories
  getAllCategories,
  
  // Warehouses
  getAllWarehouses,
  createWarehouse,
  getSingleWarehouse,
  updateWarehouse,
  deleteWarehouse,
  
  // Zones
  getAllZones,
  getZoneStatistics,
  
  // Bulk Orders
  getAllBulkOrders,
  updateBulkOrderStatus,
  
  // COD Orders
  getAllCodOrders,
  updateCodOrderStatus,
  
  // Return Orders
  getAllReturnRequests,
  updateReturnRequestStatus,
  
  // Notifications
  getAllNotifications,
  createNotification,
  
  // Wallet
  getWalletStatistics,
  getUsersWithWallets,
  
  // Stock
  updateProductStock,
  getProductStock,
  
  // Product Sections
  getAllProductSections,
  getActiveProductSections,
  updateProductSection,
  toggleProductSectionStatus,
  updateProductSectionOrder,
  
  // Promo Banners
  getAllPromoBanners,
  addPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  togglePromoBannerStatus,
  
  // Placeholder functions (not yet implemented in backend)
  getshippingBanner,
  addShippingBanner,
  updateShippingBanner,
  deleteShippingBanner,
  toggleShippingBannerStatus,
  getAllAdsBanners,
  addAdsBanner,
  updateAdsBanner,
  deleteAdsBanner,
  toggleAdsBannerStatus,
  addCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getAllSubcategories,
  getSubcategoriesByCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getAllGroups,
  getGroupsBySubcategory,
  addGroup,
  updateGroup,
  deleteGroup,
  addProduct,
  updateProduct,
  deleteProduct,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getDashboardData,
  getAllEnquiries,
  getEnquiryWithReplies,
  addEnquiryReply,
  updateEnquiryStatus,
  deleteEnquiry,
  getWebsiteSettings,
  updateWebsiteSetting,
  updateMultipleWebsiteSettings,
  getSettingsByCategory,
  upsertWebsiteSetting,
  uploadWebsiteImage,
  getPromotionalSettings,
  updatePromotionalSetting,
  updateMultiplePromotionalSettings,
  getAllPrintRequests,
  getPrintRequestWithReplies,
  addPrintRequestReply,
  updatePrintRequestStatus,
  updatePrintRequestPricing,
  deletePrintRequest,
  addUserWithDetailedAddress,
  updateUserWithDetailedAddress,
  getAllUsersWithDetailedAddress,
  getUserAddresses,
  migrateUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setAddressAsDefault,
  getStorageUsage,
  listBucketFiles,
  deleteStorageFile,
  getFileInfo,
  getStorageAnalytics,
  getZonalWarehouseAvailablePincodes,
  getZonalWarehouseAvailablePincodesDirect,
  getWarehouseProducts,
  addProductToWarehouse,
  updateWarehouseProduct,
  removeProductFromWarehouse,
  getWarehouseHierarchy,
  getChildWarehouses,
  getAllVideoCards,
  addVideoCard,
  updateVideoCard,
  deleteVideoCard,
  getProductsByCategory,
  getProductCountByCategory,
  checkCategoryHasProducts,
  addProductWithWarehouse,
  getZoneDetails
} = backendApi;

// Note: All functions now use your backend API endpoints instead of direct Supabase calls
// This provides better security, validation, and centralized business logic
console.log('✅ API functions now use backend endpoints instead of direct Supabase calls');