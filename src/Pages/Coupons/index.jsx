import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTicketAlt, FaUsers, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // specific coupon id being processed
    const [isSubmitting, setIsSubmitting] = useState(false); // form submission
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [filter, setFilter] = useState("ALL");

    // Form state
    const [formData, setFormData] = useState({
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
        terms_conditions: ""
    });

    useEffect(() => {
        fetchCoupons();
    }, [filter]);

    const getAuthToken = () => {
        const token = localStorage.getItem("admin_token");
        return token;
    };

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            const url = filter === "ALL"
                ? `${API_BASE_URL}/coupons/admin`
                : `${API_BASE_URL}/coupons/admin?status=${filter}`;

            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setCoupons(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = getAuthToken();
            const url = editingCoupon
                ? `${API_BASE_URL}/coupons/admin/${editingCoupon.id}`
                : `${API_BASE_URL}/coupons/admin`;

            const method = editingCoupon ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    discount_value: parseFloat(formData.discount_value),
                    max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                    min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
                    usage_limit_total: formData.usage_limit_total ? parseInt(formData.usage_limit_total) : null,
                    usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user) : 1,
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(editingCoupon ? "Coupon updated successfully!" : "Coupon created successfully!");
                setShowModal(false);
                resetForm();
                fetchCoupons();
            } else {
                alert(result.error || "Failed to save coupon");
            }
        } catch (error) {
            console.error("Error saving coupon:", error);
            alert("Failed to save coupon");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (coupon) => {
        try {
            setActionLoading(coupon.id);
            const token = getAuthToken();
            const newStatus = coupon.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

            const response = await fetch(`${API_BASE_URL}/coupons/admin/${coupon.id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();

            if (result.success) {
                setCoupons(prev => prev.map(c =>
                    c.id === coupon.id ? { ...c, status: newStatus } : c
                ));
            }

        } catch (error) {
            console.error("Error toggling status:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            setActionLoading(id);
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/coupons/admin/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setCoupons(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error("Error deleting coupon:", error);
        } finally {
            setActionLoading(null);
        }
    };

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
            valid_from: coupon.valid_from?.split('T')[0] || "",
            valid_to: coupon.valid_to?.split('T')[0] || "",
            timezone: coupon.timezone || "Asia/Kolkata",
            description: coupon.description || "",
            terms_conditions: coupon.terms_conditions || ""
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
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
            terms_conditions: ""
        });
        setEditingCoupon(null);
    };

    const stats = {
        total: coupons.length,
        active: coupons.filter(c => c.status === "ACTIVE").length,
        expired: coupons.filter(c => c.status === "EXPIRED").length,
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
                        onClick={() => setFilter("ALL")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "ALL"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("ACTIVE")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "ACTIVE"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter("DISABLED")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "DISABLED"
                            ? "bg-gray-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Disabled
                    </button>
                    <button
                        onClick={() => setFilter("EXPIRED")}
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
                                                    onClick={() => handleDelete(coupon.id)}
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
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
