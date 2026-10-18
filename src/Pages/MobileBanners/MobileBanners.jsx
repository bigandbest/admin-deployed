/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaPlus, FaMobileAlt } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import {
  getAllMobileBanners,
  addMobileBanner,
  updateMobileBanner,
  deleteMobileBanner,
  toggleMobileBannerActiveStatus,
} from "../../utils/supabaseApi";

const MOBILE_BANNER_TYPES = [
  "hero",
  "promo",
  "featured",
  "category",
  "Discount",
  "Offer",
  "Deals",
  "flash_sale",
  "home_top",
  "home_middle",
  "home_bottom",
];

const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'>No image</text></svg>`;

// ─── Banner Form Modal ────────────────────────────────────────────────────────
const BannerForm = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [bannerType, setBannerType] = useState(
    initialData?.banner_type || MOBILE_BANNER_TYPES[0]
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [link, setLink] = useState(initialData?.link || "");
  const [active, setActive] = useState(
    initialData?.active !== undefined ? initialData.active : true
  );
  const [position, setPosition] = useState(initialData?.position || "");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleKey);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("overflow-hidden");
    };
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
      position: position || bannerType,
    };
    try {
      if (initialData) {
        await onSave(initialData.id, bannerData, image);
      } else {
        await onSave(bannerData, image);
      }
    } catch (error) {
      console.error("Error saving mobile banner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-banner-form-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaMobileAlt className="text-white text-xl" />
              <h2 id="mobile-banner-form-title" className="text-2xl font-bold text-white">
                {initialData ? "✏️ Edit Mobile Banner" : "➕ Add Mobile Banner"}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-200 text-sm mt-1">
            📱 This banner will only be shown in the mobile app
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Banner Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="Enter banner name"
                required
              />
            </div>

            {/* Banner Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Type <span className="text-red-500">*</span>
              </label>
              <select
                value={bannerType}
                onChange={(e) => setBannerType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bg-white"
                required
              >
                {MOBILE_BANNER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="e.g., home_top, hero"
              />
            </div>

            {/* Link */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Redirect Link
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="https://example.com or deep link (e.g. app://product/123)"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                placeholder="Banner description (optional)"
                rows="2"
              />
            </div>

            {/* Active toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Banner</span>
              </label>
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="hidden"
                  id="mobile-image-upload"
                  accept="image/*"
                />
                <label htmlFor="mobile-image-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl">📁</span>
                  </div>
                  <span className="text-sm text-gray-600">Click to upload image</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 50MB</span>
                </label>
                {image && (
                  <p className="mt-3 text-sm text-green-600 font-medium">✓ {image.name}</p>
                )}
                {initialData?.image_url && !image && (
                  <div className="mt-3">
                    <img
                      src={initialData.image_url}
                      alt="Current"
                      className="h-20 mx-auto rounded-lg object-cover border"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                    />
                    <p className="text-xs text-blue-600 mt-1">Current image (will be kept if no new image selected)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
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
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? "💾 Save Changes" : "🚀 Create Banner"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MobileBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const result = await getAllMobileBanners();
      if (result.success) {
        setBanners(result.banners || []);
      } else {
        notifications.show({ color: "red", message: "Failed to load mobile banners." });
      }
    } catch (error) {
      console.error("Error fetching mobile banners:", error);
      notifications.show({ color: "red", message: "Failed to load mobile banners." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleAdd = async (bannerData, imageFile) => {
    const result = await addMobileBanner(bannerData, imageFile);
    if (result.success) {
      setIsFormVisible(false);
      fetchBanners();
      notifications.show({ color: "green", message: "Mobile banner added successfully!" });
    } else {
      notifications.show({ color: "red", message: `Error: ${result.error}` });
    }
  };

  const handleUpdate = async (id, bannerData, imageFile) => {
    const result = await updateMobileBanner(id, bannerData, imageFile);
    if (result.success) {
      setIsFormVisible(false);
      setEditingBanner(null);
      fetchBanners();
      notifications.show({ color: "green", message: "Mobile banner updated successfully!" });
    } else {
      notifications.show({ color: "red", message: `Error: ${result.error}` });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mobile banner?")) return;
    const result = await deleteMobileBanner(id);
    if (result.success) {
      fetchBanners();
      notifications.show({ color: "green", message: "Banner deleted successfully!" });
    } else {
      notifications.show({ color: "red", message: "Failed to delete banner." });
    }
  };

  const handleToggleActive = async (banner) => {
    const result = await toggleMobileBannerActiveStatus(banner.id, !banner.active);
    if (result.success) {
      fetchBanners();
      notifications.show({
        color: "green",
        message: `Banner ${!banner.active ? "activated" : "deactivated"} successfully!`,
      });
    } else {
      notifications.show({ color: "red", message: "Failed to update banner status." });
    }
  };

  const filtered = banners.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaMobileAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📱 Mobile App Banners</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Manage banners exclusively displayed in the mobile application
                </p>
              </div>
            </div>
            <button
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
              onClick={() => { setEditingBanner(null); setIsFormVisible(true); }}
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {[
            { label: "Total Banners", value: banners.length, icon: "🖼️", color: "blue" },
            { label: "Active", value: banners.filter((b) => b.active).length, icon: "✅", color: "green" },
            { label: "Inactive", value: banners.filter((b) => !b.active).length, icon: "⏸️", color: "red" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
              <div className={`p-3 bg-${stat.color}-100 rounded-lg text-2xl`}>{stat.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder="🔍  Search banners by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500">Loading mobile banners...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["Banner", "Type", "Position", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.length > 0 ? (
                    filtered.map((banner) => (
                      <tr key={banner.id} className="hover:bg-violet-50/40 transition-colors">
                        {/* Banner info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              className="h-14 w-20 rounded-lg object-cover border shadow-sm"
                              src={banner.image_url || PLACEHOLDER_IMAGE}
                              alt={banner.name}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{banner.name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-xs">
                                {banner.description || "No description"}
                              </p>
                              {banner.link && (
                                <p className="text-xs text-violet-500 truncate max-w-xs mt-0.5">
                                  🔗 {banner.link}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-800">
                            {banner.banner_type?.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Position */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {banner.position || "—"}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(banner)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all hover:opacity-80 ${
                              banner.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            title="Click to toggle active/inactive"
                          >
                            <span>{banner.active ? "●" : "○"}</span>
                            {banner.active ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              onClick={() => { setEditingBanner(banner); setIsFormVisible(true); }}
                              title="Edit Banner"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => handleDelete(banner.id)}
                              title="Delete Banner"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                            <FaMobileAlt className="text-violet-400 text-2xl" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            {searchTerm ? "No banners match your search." : "No mobile banners yet."}
                          </p>
                          {!searchTerm && (
                            <button
                              className="mt-1 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-purple-700"
                              onClick={() => { setEditingBanner(null); setIsFormVisible(true); }}
                            >
                              Create your first mobile banner
                            </button>
                          )}
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

      {/* Form Modal */}
      {isFormVisible && (
        <BannerForm
          initialData={editingBanner}
          onSave={editingBanner ? handleUpdate : handleAdd}
          onCancel={() => { setIsFormVisible(false); setEditingBanner(null); }}
        />
      )}
    </div>
  );
};

export default MobileBanners;
