import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import {
  getAllBrands,
  addBrand,
  updateBrand,
  deleteBrand,
  toggleBrand,
} from "../../utils/backendApi";
import { Trash2, Pencil, AlertTriangle, Power } from "lucide-react";

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({ open, icon, iconBg, iconColor, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-7 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const Brand = () => {
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: "", imageFile: null });
  const [preview, setPreview] = useState(null);

  // Confirmation modals
  const [deleteConfirm, setDeleteConfirm] = useState(null);   // { id, name }
  const [editConfirm, setEditConfirm] = useState(null);       // brand object
  const [toggleConfirm, setToggleConfirm] = useState(null);   // { id, name, is_active }

  // ── API helpers ──────────────────────────────────────────────────────────────
  const fetchBrands = async () => {
    try {
      const result = await getAllBrands();
      if (result.success) {
        setBrands(result.brands || result.data || []);
      } else {
        notifications.show({ color: "red", message: "Failed to load brands." });
      }
    } catch (err) {
      notifications.show({ color: "red", message: "Failed to load brands." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const result = await deleteBrand(id);
      if (result.success) {
        await fetchBrands();
        notifications.show({ color: "green", message: "Brand deleted successfully." });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      notifications.show({ color: "red", message: "Failed to delete brand." });
    }
  };

  // ── Toggle ────────────────────────────────────────────────────────────────────
  const handleToggleConfirmed = async () => {
    const { id } = toggleConfirm;
    setToggleConfirm(null);
    try {
      const result = await toggleBrand(id);
      if (result.success) {
        await fetchBrands();
        notifications.show({ color: "green", message: result.message });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      notifications.show({ color: "red", message: "Failed to update brand status." });
    }
  };

  // ── Edit (open form after confirmation) ───────────────────────────────────────
  const handleEditConfirmed = () => {
    const brand = editConfirm;
    setEditConfirm(null);
    setEditingBrand(brand);
    setForm({ name: brand.name, imageFile: null });
    setPreview(brand.image_url);
    setShowForm(true);
  };

  // ── Submit (add / update) ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let result;
      if (editingBrand) {
        result = await updateBrand(editingBrand.id, { name: form.name }, form.imageFile);
      } else {
        result = await addBrand({ name: form.name }, form.imageFile);
      }

      if (result.success) {
        await fetchBrands();
        setShowForm(false);
        setForm({ name: "", imageFile: null });
        setPreview(null);
        setEditingBrand(null);
        notifications.show({ color: "green", message: "Brand saved successfully." });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      notifications.show({ color: "red", message: "Failed to save brand." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Brands</h1>

      {/* Add Brand button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingBrand(null);
            setForm({ name: "", imageFile: null });
            setPreview(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? "Cancel" : "➕ Add Brand"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-100 rounded shadow">
            <h2 className="text-lg font-bold mb-4">
              {editingBrand ? "Edit Brand" : "Add Brand"}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Brand Name"
                className="w-full border px-3 py-2 rounded text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setForm({ ...form, imageFile: file });
                  setPreview(URL.createObjectURL(file));
                }}
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {preview && (
                <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingBrand ? "Save Changes" : "Add"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading Brands...</p>
      ) : !brands || brands.length === 0 ? (
        <p className="text-gray-500">No Brands found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow text-sm md:text-base">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Image</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-t">
                  <td className="py-2 px-4 font-medium">{brand.name}</td>
                  <td className="py-2 px-4">
                    <img
                      src={brand.image_url}
                      alt={brand.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={brand.is_active !== false}
                        onChange={() => setToggleConfirm({ id: brand.id, name: brand.name, is_active: brand.is_active !== false })}
                      />
                      <span className={`text-xs font-medium ${brand.is_active !== false ? "text-green-600" : "text-gray-400"}`}>
                        {brand.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-yellow-600 transition-colors"
                        onClick={() => setEditConfirm(brand)}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                        onClick={() => setDeleteConfirm({ id: brand.id, name: brand.name })}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                      <button
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        onClick={() => navigate(`/brandproducts/${brand.id}`)}
                      >
                        📦 Products
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteConfirm}
        icon={<Trash2 className="w-7 h-7 text-red-500" />}
        iconBg="bg-red-100"
        title="Delete Brand?"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-700">"{deleteConfirm?.name}"</span>?
            This will remove the brand permanently and cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Edit Confirmation */}
      <ConfirmModal
        open={!!editConfirm}
        icon={<Pencil className="w-7 h-7 text-amber-500" />}
        iconBg="bg-amber-100"
        title="Edit Brand?"
        message={
          <>
            You are about to edit{" "}
            <span className="font-medium text-gray-700">"{editConfirm?.name}"</span>.
            Changes will be reflected across all products linked to this brand.
          </>
        }
        confirmLabel="Yes, Edit"
        confirmClass="bg-blue-600 hover:bg-blue-700"
        onConfirm={handleEditConfirmed}
        onCancel={() => setEditConfirm(null)}
      />

      {/* Toggle Confirmation */}
      <ConfirmModal
        open={!!toggleConfirm}
        icon={<Power className="w-7 h-7 text-indigo-500" />}
        iconBg="bg-indigo-100"
        title={toggleConfirm?.is_active ? "Deactivate Brand?" : "Activate Brand?"}
        message={
          <>
            Are you sure you want to{" "}
            <span className="font-medium">{toggleConfirm?.is_active ? "deactivate" : "activate"}</span>{" "}
            <span className="font-medium text-gray-700">"{toggleConfirm?.name}"</span>?
            {toggleConfirm?.is_active
              ? " The brand will be hidden from the storefront."
              : " The brand will be visible on the storefront again."}
          </>
        }
        confirmLabel={toggleConfirm?.is_active ? "Deactivate" : "Activate"}
        confirmClass={toggleConfirm?.is_active ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}
        onConfirm={handleToggleConfirmed}
        onCancel={() => setToggleConfirm(null)}
      />
    </div>
  );
};

export default Brand;
