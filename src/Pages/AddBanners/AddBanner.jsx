/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import {
  getAllBanners,
  addBanner,
  updateBanner,
  deleteBanner,
} from "../../utils/supabaseApi";
import api from "../../utils/api";

// Define banner types for the dropdown
const BANNER_TYPES = [
  "hero",
  "mega_sale",
  "featured",
  "sidebar",
  "promo",
  "category",
  "Discount",
  "Offer",
  "Deals",
  "Summer Big Sale",
  "Opening Soon",
  "Section 1",
  "daily_deals",
  "shop_by_store",
];

// lightweight placeholder SVG for missing images (module scope)
const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'>No image</text></svg>`;

// Component to handle adding/editing a Banner
const BannerForm = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [bannerType, setBannerType] = useState(
    initialData?.banner_type || BANNER_TYPES[0]
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [link, setLink] = useState(initialData?.link || "");
  const [active, setActive] = useState(
    initialData?.active !== undefined ? initialData.active : true
  );
  const [position, setPosition] = useState(initialData?.position || bannerType);
  const [isMobile, setIsMobile] = useState(initialData?.is_mobile || false);
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    // autofocus on open
    nameInputRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKey);
    // lock body scroll while modal is open
    document.body.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("overflow-hidden");
    };
    // run only on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bannerData = {
      name,
      banner_type: bannerType,
      description,
      link,
      active: active.toString(),
      position,
      is_mobile: isMobile.toString(),
    };

    try {
      if (initialData) {
        await onSave(initialData.id, bannerData, image);
      } else {
        await onSave(bannerData, image);
      }
    } catch (error) {
      console.error("Error saving banner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-form-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2
              id="banner-form-title"
              className="text-2xl font-bold text-white"
            >
              {initialData ? "✏️ Edit Banner" : "➕ Add New Banner"}
            </h2>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter banner name"
                required
                aria-label="Banner name"
              />
            </div>

            {/* Banner Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Type *
              </label>
              <select
                value={bannerType}
                onChange={(e) => setBannerType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                required
              >
                {BANNER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., hero, featured"
              />
            </div>

            {/* Link */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Redirect Link
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://example.com or /products"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Banner description (optional)"
                rows="3"
              />
            </div>

            {/* Settings */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active Banner
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMobile}
                    onChange={(e) => setIsMobile(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mobile Only
                  </span>
                </label>
              </div>
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="hidden"
                  id="image-upload"
                  accept="image/*"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    📁
                  </div>
                  <span className="text-sm text-gray-600">
                    Click to upload image
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 10MB
                  </span>
                </label>
                {image && (
                  <div className="mt-4">
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {image.name}
                    </p>
                  </div>
                )}
                {initialData && initialData.image_url && !image && (
                  <div className="mt-4">
                    <p className="text-sm text-blue-600">
                      Current image will be kept
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>
                    {initialData ? "💾 Save Changes" : "🚀 Create Banner"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Banner page component
const AddBanner = () => {
  const [banners, setBanners] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isDealModalVisible, setIsDealModalVisible] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [allDeals, setAllDeals] = useState([]);
  const [dealsWithBanner, setDealsWithBanner] = useState([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [allStores, setAllStores] = useState([]);
  const [storesWithBanner, setStoresWithBanner] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const navigate = useNavigate();

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const result = await getAllBanners();
      if (result.success) {
        setBanners(result.banners);
      } else {
        console.error("Error fetching banners:", result.error);
        notifications.show({
          color: "red",
          message: "Failed to load banners.",
        });
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      notifications.show({ color: "red", message: "Failed to load banners." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAdd = async (bannerData, imageFile) => {
    try {
      const result = await addBanner(bannerData, imageFile);
      if (result.success) {
        setIsFormVisible(false);
        fetchBanners(); // Refresh the list
        notifications.show({
          color: "green",
          message: "Banner added successfully!",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error adding banner:", error);
      notifications.show({ color: "red", message: `Error: ${error.message}` });
    }
  };

  const handleUpdate = async (id, bannerData, imageFile) => {
    try {
      const result = await updateBanner(id, bannerData, imageFile);
      if (result.success) {
        setIsFormVisible(false);
        setEditingBanner(null);
        fetchBanners(); // Refresh the list
        notifications.show({
          color: "green",
          message: "Banner updated successfully!",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating banner:", error);
      notifications.show({ color: "red", message: `Error: ${error.message}` });
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this banner?"
    );
    if (isConfirmed) {
      try {
        const result = await deleteBanner(id);
        if (result.success) {
          fetchBanners(); // Refresh the list
          notifications.show({
            color: "green",
            message: "Banner deleted successfully!",
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error deleting banner:", error);
        notifications.show({
          color: "red",
          message: "Failed to delete banner.",
        });
      }
    }
  };

  const handleEditClick = (banner) => {
    setEditingBanner(banner);
    setIsFormVisible(true);
  };

  const handleManageDeals = async (banner) => {
    setSelectedBanner(banner);
    setIsLoadingDeals(true);
    setIsDealModalVisible(true);

    try {
      // Fetch all deals
      const dealsResponse = await api.get("/daily-deals/list");
      const deals = dealsResponse.data.deals || [];
      setAllDeals(deals);

      // Filter deals that have this banner assigned
      const dealsWithThisBanner = deals.filter(deal => deal.banner_id === banner.id);
      setDealsWithBanner(dealsWithThisBanner.map(d => d.id));
    } catch (error) {
      console.error("Error fetching deals:", error);
      notifications.show({ color: "red", message: "Failed to load deals" });
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleToggleDeal = async (dealId) => {
    try {
      const isCurrentlyAssigned = dealsWithBanner.includes(dealId);

      if (isCurrentlyAssigned) {
        // Remove banner from deal
        await api.put(`/daily-deals/update/${dealId}`, { banner_id: null });
        setDealsWithBanner(prev => prev.filter(id => id !== dealId));
        notifications.show({ color: "green", message: "Banner removed from deal" });
      } else {
        // Assign banner to deal
        await api.put(`/daily-deals/update/${dealId}`, { banner_id: selectedBanner.id });
        setDealsWithBanner(prev => [...prev, dealId]);
        notifications.show({ color: "green", message: "Banner assigned to deal" });
      }
    } catch (error) {
      console.error("Error toggling deal:", error);
      notifications.show({ color: "red", message: "Failed to update deal" });
    }
  };

  const handleManageStores = async (banner) => {
    setSelectedBanner(banner);
    setIsLoadingStores(true);
    setIsStoreModalVisible(true);

    try {
      // Fetch all stores
      const storesResponse = await api.get("/recommended-stores/list");
      const stores = storesResponse.data.recommendedStores || [];
      setAllStores(stores);

      // Filter stores that have this banner assigned
      const storesWithThisBanner = stores.filter(store => store.banner_id === banner.id);
      setStoresWithBanner(storesWithThisBanner.map(s => s.id));
    } catch (error) {
      console.error("Error fetching stores:", error);
      notifications.show({ color: "red", message: "Failed to load stores" });
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleToggleStore = async (storeId) => {
    try {
      const isCurrentlyAssigned = storesWithBanner.includes(storeId);

      if (isCurrentlyAssigned) {
        // Remove banner from store
        await api.put(`/recommended-stores/update/${storeId}`, { banner_id: null });
        setStoresWithBanner(prev => prev.filter(id => id !== storeId));
        notifications.show({ color: "green", message: "Banner removed from store" });
      } else {
        // Assign banner to store
        await api.put(`/recommended-stores/update/${storeId}`, { banner_id: selectedBanner.id });
        setStoresWithBanner(prev => [...prev, storeId]);
        notifications.show({ color: "green", message: "Banner assigned to store" });
      }
    } catch (error) {
      console.error("Error toggling store:", error);
      notifications.show({ color: "red", message: "Failed to update store" });
    }
  };

  const handleAddClick = () => {
    setEditingBanner(null);
    setIsFormVisible(true);
  };

  // Filter banners based on search and type
  const filteredBanners = banners.filter((banner) => {
    const matchesSearch = banner.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" || banner.banner_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎨 Banner Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Create and manage banners for your website sections
              </p>
            </div>
            <button
              className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
              onClick={handleAddClick}
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Banners
              </label>
              <input
                type="text"
                placeholder="Search by banner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Types</option>
                {BANNER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Banners
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {banners.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {banners.filter((b) => b.active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📱</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mobile Only</p>
                <p className="text-2xl font-bold text-gray-900">
                  {banners.filter((b) => b.is_mobile).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">🏠</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Hero Banners
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {banners.filter((b) => b.banner_type === "hero").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Banners Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading banners...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Banner
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBanners.length > 0 ? (
                    filteredBanners.map((banner) => (
                      <tr
                        key={banner.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-12 w-12">
                              <img
                                className="h-12 w-12 rounded-lg object-cover border"
                                src={banner.image_url || PLACEHOLDER_IMAGE}
                                alt={banner.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {banner.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {banner.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {banner.banner_type?.charAt(0).toUpperCase() +
                              banner.banner_type?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {banner.position || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${banner.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {banner.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${banner.is_mobile
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {banner.is_mobile ? "Mobile" : "All"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50 transition-colors"
                              onClick={() => handleEditClick(banner)}
                              title="Edit Banner"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              onClick={() => handleDelete(banner.id)}
                              title="Delete Banner"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              onClick={() =>
                                navigate(
                                  `/add-banner-group?bannerId=${banner.id}`
                                )
                              }
                              title="Manage Groups"
                            >
                              <span className="text-sm">👥</span>
                            </button>
                            {banner.banner_type === "daily_deals" && (
                              <button
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                onClick={() => handleManageDeals(banner)}
                                title="Manage Deals"
                              >
                                <span className="text-sm">🏷️</span>
                              </button>
                            )}
                            {banner.banner_type === "shop_by_store" && (
                              <button
                                className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                onClick={() => handleManageStores(banner)}
                                title="Manage Stores"
                              >
                                <span className="text-sm">🏪</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">📭</span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No banners found
                          </h3>
                          <p className="text-gray-500">
                            {searchTerm || filterType !== "all"
                              ? "Try adjusting your search or filter criteria."
                              : "Get started by creating your first banner."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Deal Management Modal */}
      {isDealModalVisible && selectedBanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Manage Deals</h2>
                  <p className="text-blue-100 mt-1">
                    Banner: {selectedBanner.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsDealModalVisible(false)}
                  className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {isLoadingDeals ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="ml-4 text-gray-600">Loading deals...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Select which Daily Deals should use this banner. Click on a deal to assign/remove the banner.
                    </p>
                  </div>

                  {allDeals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No daily deals available.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allDeals.map((deal) => {
                        const isAssigned = dealsWithBanner.includes(deal.id);
                        return (
                          <div
                            key={deal.id}
                            onClick={() => handleToggleDeal(deal.id)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isAssigned
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                              }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => { }}
                                  className="w-5 h-5 text-blue-600 rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 mb-1">
                                      {deal.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-1">
                                      {deal.discount}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                        {deal.badge}
                                      </span>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${deal.active
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                        }`}>
                                        {deal.active ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                  </div>
                                  {deal.image_url && (
                                    <img
                                      src={deal.image_url}
                                      alt={deal.title}
                                      className="w-16 h-16 object-cover rounded ml-3"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {dealsWithBanner.length} of {allDeals.length} deals using this banner
                </p>
                <button
                  onClick={() => setIsDealModalVisible(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Management Modal */}
      {isStoreModalVisible && selectedBanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Manage Stores</h2>
                  <p className="text-purple-100 mt-1">
                    Banner: {selectedBanner.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsStoreModalVisible(false)}
                  className="text-white hover:bg-purple-800 rounded-full p-2 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {isLoadingStores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="ml-4 text-gray-600">Loading stores...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Select which stores should use this banner. Click on a store to assign/remove the banner.
                    </p>
                  </div>

                  {allStores.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No stores available.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allStores.map((store) => {
                        const isAssigned = storesWithBanner.includes(store.id);
                        return (
                          <div
                            key={store.id}
                            onClick={() => handleToggleStore(store.id)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isAssigned
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-purple-300"
                              }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => { }}
                                  className="w-5 h-5 text-purple-600 rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 mb-1">
                                      {store.name}
                                    </h4>
                                    {store.description && (
                                      <p className="text-sm text-gray-600 mb-1">
                                        {store.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${store.is_active
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                        }`}>
                                        {store.is_active ? "Active" : "Inactive"}
                                      </span>
                                      {store.product_count !== undefined && (
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                          {store.product_count} products
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {store.image_url && (
                                    <img
                                      src={store.image_url}
                                      alt={store.name}
                                      className="w-16 h-16 rounded-lg object-cover ml-3"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <p className="text-sm text-gray-600">
                {storesWithBanner.length} of {allStores.length} stores using this banner
              </p>
              <button
                onClick={() => setIsStoreModalVisible(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormVisible && (
        <BannerForm
          initialData={editingBanner}
          onSave={editingBanner ? handleUpdate : handleAdd}
          onCancel={() => setIsFormVisible(false)}
        />
      )}
    </div>
  );
};

export default AddBanner;
