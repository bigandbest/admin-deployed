import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTicketAlt, FaUsers, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { adminAuthHeaders } from "../../utils/backendApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 20;

const notify = (color, message) =>
    notifications.show({ color, title: color === "red" ? "Error" : "Success", message });

// Shared admin request helper: auth header, JSON body, and a uniform { ok, result } outcome.
const adminRequest = async (path, { method = "GET", body } = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: adminAuthHeaders(body ? { "Content-Type": "application/json" } : {}),
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok && result.success !== false, result };
};

const EMPTY_FORM = {
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    max_discount: "",
    min_order_value: "",
    allowed_brands: [],
    new_user_only: false,
    usage_limit_total: "",
    usage_limit_per_user: "1",
    valid_from: "",
    valid_to: "",
    timezone: "Asia/Kolkata",
    description: "",
    terms_conditions: "",
};

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // specific coupon id being processed
    const [isSubmitting, setIsSubmitting] = useState(false); // form submission
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [filter, setFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page, limit: PAGE_SIZE });
            if (filter !== "ALL") query.set("status", filter);
            const { ok, result } = await adminRequest(`/coupons/admin?${query}`);
            if (!ok) throw new Error(result.error || result.message || "Failed to load coupons");

            setCoupons(result.data || []);
            if (result.stats) setStats(result.stats);
            if (result.pagination) {
                setPagination({ page: result.pagination.page, pages: Math.max(1, result.pagination.pages), total: result.pagination.total });
            }
        } catch (error) {
            notify("red", error.message || "Failed to load coupons");
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const changeFilter = (next) => {
        setFilter(next);
        setPage(1);
    };

    const validateForm = () => {
        const value = parseFloat(formData.discount_value);
        if (!Number.isFinite(value) || value <= 0) return "Discount value must be greater than 0";
        if (formData.discount_type === "PERCENTAGE" && value > 100) return "Percentage discount cannot exceed 100";
        if (formData.max_discount && parseFloat(formData.max_discount) <= 0) return "Max discount must be greater than 0";
        if (formData.min_order_value && parseFloat(formData.min_order_value) < 0) return "Min order value cannot be negative";
        const perUser = parseInt(formData.usage_limit_per_user, 10);
        if (!Number.isInteger(perUser) || perUser < 1) return "Per-user limit must be at least 1";
        if (formData.usage_limit_total && parseInt(formData.usage_limit_total, 10) < 1) return "Total usage limit must be at least 1";
        if (formData.valid_from && formData.valid_to && formData.valid_to < formData.valid_from) {
            return "Valid To must be on or after Valid From";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const problem = validateForm();
        if (problem) {
            notify("red", problem);
            return;
        }
        setIsSubmitting(true);

        try {
            const { ok, result } = await adminRequest(
                editingCoupon ? `/coupons/admin/${editingCoupon.id}` : "/coupons/admin",
                {
                    method: editingCoupon ? "PUT" : "POST",
                    body: {
                        ...formData,
                        code: formData.code.trim(),
                        discount_value: parseFloat(formData.discount_value),
                        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
                        usage_limit_total: formData.usage_limit_total ? parseInt(formData.usage_limit_total, 10) : null,
                        usage_limit_per_user: parseInt(formData.usage_limit_per_user, 10),
                    },
                }
            );

            if (!ok) throw new Error(result.error || result.message || "Failed to save coupon");
            notify("green", editingCoupon ? "Coupon updated successfully" : "Coupon created successfully");
            setShowModal(false);
            resetForm();
            fetchCoupons();
        } catch (error) {
            notify("red", error.message || "Failed to save coupon");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (coupon) => {
        setActionLoading(coupon.id);
        try {
            const newStatus = coupon.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
            const { ok, result } = await adminRequest(`/coupons/admin/${coupon.id}/status`, {
                method: "PATCH",
                body: { status: newStatus },
            });
            if (!ok) throw new Error(result.error || result.message || "Failed to update status");
            fetchCoupons(); // re-fetch so the summary cards and status filter stay consistent
        } catch (error) {
            notify("red", error.message || "Failed to update status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = (coupon) =>
        modals.openConfirmModal({
            title: "Delete coupon",
            children: `Delete coupon ${coupon.code}? This cannot be undone.`,
            labels: { confirm: "Delete", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: async () => {
                setActionLoading(coupon.id);
                try {
                    const { ok, result } = await adminRequest(`/coupons/admin/${coupon.id}`, { method: "DELETE" });
                    if (!ok) throw new Error(result.error || result.message || "Failed to delete coupon");
                    notify("green", "Coupon deleted");
                    // Deleting the last row on a page would leave it empty: step back a page
                    if (coupons.length === 1 && page > 1) setPage(page - 1);
                    else fetchCoupons();
                } catch (error) {
                    notify("red", error.message || "Failed to delete coupon");
                } finally {
                    setActionLoading(null);
                }
            },
        });

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            max_discount: coupon.max_discount?.toString() || "",
            min_order_value: coupon.min_order_value?.toString() || "",
            allowed_brands: coupon.allowed_brands || [],
            new_user_only: coupon.new_user_only || false,
            usage_limit_total: coupon.usage_limit_total?.toString() || "",
            usage_limit_per_user: coupon.usage_limit_per_user?.toString() || "1",
            valid_from: coupon.valid_from?.split("T")[0] || "",
            valid_to: coupon.valid_to?.split("T")[0] || "",
            timezone: coupon.timezone || "Asia/Kolkata",
            description: coupon.description || "",
            terms_conditions: coupon.terms_conditions || "",
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingCoupon(null);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FaTicketAlt className="text-purple-600" />
                    Coupon Management
                </h1>
                <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Coupons</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <FaTicketAlt className="text-4xl text-purple-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active Coupons</p>
                            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                        </div>
                        <FaChartLine className="text-4xl text-green-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Expired Coupons</p>
                            <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
                        </div>
                        <FaUsers className="text-4xl text-red-500" />
                    </div>
                </motion.div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => changeFilter("ALL")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "ALL"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => changeFilter("ACTIVE")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "ACTIVE"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => changeFilter("DISABLED")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "DISABLED"
                            ? "bg-gray-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Disabled
                    </button>
                    <button
                        onClick={() => changeFilter("EXPIRED")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "EXPIRED"
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Expired
                    </button>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <FaPlus /> Create Coupon
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading coupons...</div>
                ) : coupons.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No coupons found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Min Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valid Until
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm font-bold text-purple-600">{coupon.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {coupon.discount_type === "FLAT" ? "₹" : ""}{coupon.discount_value}
                                                {coupon.discount_type === "PERCENTAGE" ? "%" : ""}
                                                {coupon.max_discount && (
                                                    <span className="text-xs text-gray-500"> (max ₹{coupon.max_discount})</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₹{coupon.min_order_value || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {coupon.usage_limit_per_user || "∞"} per user
                                            {coupon.usage_limit_total && ` / ${coupon.usage_limit_total} total`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(coupon.valid_to).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-800"
                                                    : coupon.status === "EXPIRED"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {coupon.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(coupon)}
                                                    className={`${actionLoading === coupon.id ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-900"}`}
                                                    disabled={actionLoading === coupon.id}
                                                    title={coupon.status === "ACTIVE" ? "Disable" : "Enable"}
                                                >
                                                    {actionLoading === coupon.id ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" /> : (coupon.status === "ACTIVE" ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />)}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Edit"
                                                    disabled={actionLoading === coupon.id}
                                                >
                                                    <FaEdit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className={`${actionLoading === coupon.id ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-900"}`}
                                                    title="Delete"
                                                    disabled={actionLoading === coupon.id}
                                                >
                                                    {actionLoading === coupon.id ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <FaTrash size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
                        <span>Page {pagination.page} of {pagination.pages} · {pagination.total} coupons</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1 || loading}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page >= pagination.pages || loading}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Coupon Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., WELCOME10"
                                    />
                                </div>

                                {/* Discount Type and Value */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Value *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder={formData.discount_type === "PERCENTAGE" ? "10" : "100"}
                                        />
                                    </div>
                                </div>

                                {/* Max Discount and Min Order */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Discount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.max_discount}
                                            onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Order Value (₹)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.min_order_value}
                                            onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Usage Limits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Usage Limit
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.usage_limit_total}
                                            onChange={(e) => setFormData({ ...formData, usage_limit_total: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Per User Limit *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.usage_limit_per_user}
                                            onChange={(e) => setFormData({ ...formData, usage_limit_per_user: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="1"
                                        />
                                    </div>
                                </div>

                                {/* Validity Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Valid From *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.valid_from}
                                            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Valid To *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.valid_to}
                                            onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* New User Only */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="new_user_only"
                                        checked={formData.new_user_only}
                                        onChange={(e) => setFormData({ ...formData, new_user_only: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="new_user_only" className="ml-2 text-sm text-gray-700">
                                        New Users Only
                                    </label>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., Welcome offer - 10% off up to ₹100"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
                                    >
                                        {editingCoupon ? (isSubmitting ? "Updating..." : "Update Coupon") : (isSubmitting ? "Creating..." : "Create Coupon")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Coupons;
