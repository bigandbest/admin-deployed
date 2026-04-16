import { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaPlus, FaImage } from "react-icons/fa";
import {
  getDealBanners,
  addDealBanner,
  updateDealBanner,
  deleteDealBanner,
  getDailyDealsList,
} from "../../utils/backendApi";

// ─── Banner Form Modal ────────────────────────────────────────────────────────

function BannerFormModal({ initialData, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(initialData?.name || "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initialData?.image_url || null);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!initialData && !imageFile) {
      alert("Please select a banner image.");
      return;
    }
    onSave({ name, active: active.toString() }, imageFile);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-2xl">
          <h2 className="text-white text-xl font-bold">
            {initialData ? "Edit Banner" : "Add Banner"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Banner Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Festival Special Banner"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Banner Image {!initialData && <span className="text-red-500">*</span>}
              <span className="text-gray-400 font-normal ml-1">(1200×400 recommended)</span>
            </label>
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-orange-400 transition-colors"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 py-4">
                  <FaImage size={32} className="mb-2" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs mt-1">PNG, JPG, WebP — auto-optimized via Cloudinary</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {imageFile && (
              <p className="text-xs text-green-600 mt-1">✓ {imageFile.name}</p>
            )}
            {initialData && !imageFile && (
              <p className="text-xs text-gray-400 mt-1">Current image will be kept if no new file selected.</p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Active</label>
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                active ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  active ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 text-sm font-bold disabled:opacity-60"
            >
              {isSaving ? "Saving…" : initialData ? "Update Banner" : "Create Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ banner, assignedDeal, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Banner</h3>
        {assignedDeal && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 mb-3 text-sm text-yellow-800">
            ⚠️ This banner is currently assigned to <strong>{assignedDeal.title}</strong>. Deleting it will remove the banner from that deal.
          </div>
        )}
        <p className="text-gray-600 text-sm mb-5">
          Delete <strong>{banner.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-bold disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyDealBanners() {
  const [banners, setBanners] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bannersRes, dealsRes] = await Promise.all([
        getDealBanners(),
        getDailyDealsList(),
      ]);
      if (bannersRes.success) setBanners(bannersRes.banners || []);
      else setError(bannersRes.error || "Failed to load banners.");
      if (dealsRes.success) setDeals(dealsRes.deals || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Map banner_id → deal for the "assigned to" column
  const dealByBannerId = deals.reduce((acc, deal) => {
    if (deal.banner_id) acc[deal.banner_id] = deal;
    return acc;
  }, {});

  const handleSave = async (data, imageFile) => {
    setIsSaving(true);
    try {
      let res;
      if (editingBanner) {
        res = await updateDealBanner(editingBanner.id, data, imageFile);
      } else {
        res = await addDealBanner(data, imageFile);
      }
      if (res.success) {
        setShowForm(false);
        setEditingBanner(null);
        await fetchAll();
      } else {
        alert(res.error || "Save failed.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteDealBanner(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        await fetchAll();
      } else {
        alert(res.error || "Delete failed.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Deal Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and manage banners for daily deal pages. Assign them from the Daily Deals section.
          </p>
        </div>
        <button
          onClick={() => { setEditingBanner(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow"
        >
          <FaPlus size={12} /> Add Banner
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FaImage size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No banners yet</p>
          <p className="text-sm mt-1">Click "Add Banner" to create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-48">Preview</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned To</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banners.map((banner) => {
                const assignedDeal = dealByBannerId[banner.id];
                return (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.name}
                          className="w-40 h-16 object-cover rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="w-40 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <FaImage />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{banner.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {assignedDeal ? (
                        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {assignedDeal.title}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          banner.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {banner.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingBanner(banner); setShowForm(true); }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(banner)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BannerFormModal
          initialData={editingBanner}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingBanner(null); }}
          isSaving={isSaving}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          banner={deleteTarget}
          assignedDeal={dealByBannerId[deleteTarget.id]}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
