import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBox, FaClock, FaCheckCircle, FaTruck, FaEye, FaTrash, FaMoneyBillWave, FaCreditCard, FaBoxes, FaTag } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UnifiedOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'cod', 'prepaid'
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // 'all', 'bulk', 'regular'

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all orders with payment_method filter
            const res = await axios.get(`${API_BASE_URL}/order/all`, {
                params: {
                    page: currentPage,
                    limit: 10,
                    payment_method: paymentFilter
                }
            });

            let fetchedOrders = res.data.orders || [];

            // Apply status filter on frontend if needed
            if (statusFilter && statusFilter !== 'all') {
                fetchedOrders = fetchedOrders.filter(order =>
                    order.status?.toLowerCase() === statusFilter.toLowerCase()
                );
            }

            // Apply order type filter
            if (orderTypeFilter && orderTypeFilter !== 'all') {
                fetchedOrders = fetchedOrders.filter(order => {
                    if (orderTypeFilter === 'bulk') {
                        return order.is_bulk_order === true;
                    } else if (orderTypeFilter === 'regular') {
                        return !order.is_bulk_order;
                    }
                    return true;
                });
            }

            setOrders(fetchedOrders);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteOrder = async (order_id) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/order/delete/${order_id}`);
            fetchOrders(); // Refresh list
        } catch (err) {
            alert('Failed to delete order: ' + err.message);
        }
    };

    const updateOrder = async (id, status, adminnotes) => {
        try {
            await axios.put(`${API_BASE_URL}/order/status/${id}`, {
                status,
                adminnotes,
            });
            fetchOrders(); // Refresh
        } catch (err) {
            alert('Failed to update order: ' + err.message);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage, paymentFilter, statusFilter, orderTypeFilter]);

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return <FaCheckCircle className="text-green-500" />;
            case 'shipped':
                return <FaTruck className="text-blue-500" />;
            case 'processing':
                return <FaClock className="text-yellow-500" />;
            default:
                return <FaBox className="text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'shipped':
                return 'bg-blue-100 text-blue-800';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodBadge = (paymentMethod) => {
        if (paymentMethod?.toLowerCase() === 'cod') {
            return (
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                    <FaMoneyBillWave /> COD
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                <FaCreditCard /> Prepaid ({paymentMethod || 'Online'})
            </span>
        );
    };

    const getBulkOrderBadge = (order) => {
        if (order.is_bulk_order) {
            return (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    <FaBoxes /> Bulk Order
                </span>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 All Orders Management</h1>
                        <p className="text-gray-600">Manage all orders (COD & Prepaid) in one place</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                            <div className="text-sm text-blue-600 font-medium">Total Orders</div>
                            <div className="text-2xl font-bold text-blue-700">{orders.length}</div>
                        </div>
                        <button
                            onClick={fetchOrders}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold disabled:opacity-50"
                        >
                            {loading ? '🔄 Loading...' : '🔄 Refresh'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                            value={paymentFilter}
                            onChange={(e) => {
                                setPaymentFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Orders</option>
                            <option value="cod">COD Only</option>
                            <option value="prepaid">Prepaid Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                        <select
                            value={orderTypeFilter}
                            onChange={(e) => {
                                setOrderTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Orders</option>
                            <option value="regular">Regular Orders</option>
                            <option value="bulk">Bulk Orders</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-xl">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBox className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
                    <p className="text-gray-600">Orders will appear here once customers place them</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                                    {getStatusIcon(order.status)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-gray-900">Order #{order.id}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    {order.estimated_delivery && (
                                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                                            Est: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Customer</p>
                                                    <p className="font-semibold">{order.user_name || order.users?.name || 'N/A'}</p>
                                                    <p className="text-sm text-gray-600">{order.user_email || order.users?.email || 'N/A'}</p>
                                                    {order.company_name && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            <span className="font-semibold">Co:</span> {order.company_name}
                                                        </p>
                                                    )}
                                                    {order.gst_number && (
                                                        <p className="text-xs text-gray-500">
                                                            <span className="font-semibold">GST:</span> {order.gst_number}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Total Amount</p>
                                                    <p className="font-bold text-xl text-green-700">₹{order.total || order.product_total_price}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Payment & Status</p>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {getPaymentMethodBadge(order.payment_method)}
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                            {order.status || 'Pending'}
                                                        </span>
                                                        {getBulkOrderBadge(order)}
                                                    </div>
                                                    {(order.razorpay_payment_id || order.razorpay_order_id) && (
                                                        <p className="text-xs text-gray-500">
                                                            <span className="font-semibold">Ref:</span> {order.razorpay_payment_id || order.razorpay_order_id}
                                                        </p>
                                                    )}
                                                    {order.tracking_number && (
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            <FaTruck className="inline mr-1" /> {order.tracking_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Delivery Address */}
                                            {order.address && (
                                                <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                                                    <p className="font-semibold mb-1">📦 Delivery Address</p>
                                                    <p>{order.address}</p>
                                                    {order.pincode && (
                                                        <p className="text-xs text-gray-500 mt-1 font-semibold">Pincode: {order.pincode}</p>
                                                    )}
                                                    {order.shipping_gps_address && (
                                                        <p className="text-xs text-gray-500 mt-1">GPS: {order.shipping_gps_address}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Charge Breakdown */}
                                            <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                                <div className="text-center">
                                                    <p className="text-gray-500">Subtotal</p>
                                                    <p className="font-semibold">₹{parseFloat(order.subtotal || 0).toFixed(0)}</p>
                                                </div>
                                                <div className="text-center border-l border-gray-200">
                                                    <p className="text-gray-500">Shipping</p>
                                                    <p className="font-semibold">₹{parseFloat(order.shipping || 0).toFixed(0)}</p>
                                                </div>
                                                <div className="text-center border-l border-gray-200">
                                                    <p className="text-gray-500">Handling</p>
                                                    <p className="font-semibold">₹{parseFloat(order.handling_charge || 0).toFixed(0)}</p>
                                                </div>
                                                <div className="text-center border-l border-gray-200">
                                                    <p className="text-gray-500">Surge</p>
                                                    <p className="font-semibold">₹{parseFloat(order.surge_charge || 0).toFixed(0)}</p>
                                                </div>
                                                <div className="text-center border-l border-gray-200">
                                                    <p className="text-gray-500">Platform</p>
                                                    <p className="font-semibold">₹{parseFloat(order.platform_charge || 0).toFixed(0)}</p>
                                                </div>
                                                <div className="text-center border-l border-gray-200">
                                                    <p className="text-gray-500">Discount</p>
                                                    <p className="font-semibold text-green-600">-₹{parseFloat(order.discount_charge || 0).toFixed(0)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                                            >
                                                <FaEye />
                                                {expanded === order.id ? "Hide" : "View"} Details
                                            </button>
                                            <button
                                                onClick={() => deleteOrder(order.id)}
                                                className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                                            >
                                                <FaTrash />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {expanded === order.id && (
                                        <OrderDetails
                                            orderId={order.id}
                                            onUpdate={updateOrder}
                                            status={order.status}
                                            adminnotes={order.adminnotes}
                                            paymentMethod={order.payment_method}
                                            order={order}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <div className="flex space-x-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-lg font-medium ${currentPage === page
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const OrderDetails = ({ orderId, onUpdate, status, adminnotes, paymentMethod, order }) => {
    // Start with items from prop if available, otherwise empty (will be fetched if we kept that logic, but we are shifting to prop)
    const [items, setItems] = useState(order?.order_items || []);
    const [form, setForm] = useState({ status, adminnotes });
    const [loading, setLoading] = useState(!order?.order_items); // Loading only if no items in prop

    useEffect(() => {
        // Only fetch if items are not provided in prop (backward compatibility or deep link)
        if (!order?.order_items) {
            const fetchItems = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/orderItems/order/${orderId}`);
                    setItems(res.data.items || []);
                } catch (err) {
                    console.error('Error fetching order items:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchItems();
        } else {
            setItems(order.order_items);
            setLoading(false);
        }
    }, [orderId, order]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        await onUpdate(orderId, form.status, form.adminnotes);
        setSaving(false);
    };

    return (
        <div className="mt-6 border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Order Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Admin Notes (Not Saved)</label>
                    <textarea
                        name="adminnotes"
                        value={form.adminnotes ?? ""}
                        onChange={handleChange}
                        disabled={true}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                        rows="2"
                        placeholder="Admin notes are currently disabled"
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {saving ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                    </>
                ) : (
                    "💾 Save Changes"
                )}
            </button>

            <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">📦 Order Items:</h4>
                {/* Derived items from order object directly */}
                {loading ? (
                    <p className="text-gray-600">Loading items...</p>
                ) : items.length === 0 ? (
                    <p className="text-gray-600">No items found for this order</p>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => {
                            // Helper to get product details from nested structure
                            const product = item.variant?.product || item.products;

                            // Get image: Variant Specific -> Product Specific -> Global/Legacy
                            const variantMedia = item.variant?.media || [];
                            const productMedia = product?.media || [];

                            // 1. Check variant media (specific color/style)
                            let finalImage = Array.isArray(variantMedia) && variantMedia.length > 0
                                ? (variantMedia.find(m => m.is_primary)?.url || variantMedia[0]?.url)
                                : null;

                            // 2. Fallback to product media
                            if (!finalImage) {
                                finalImage = Array.isArray(productMedia) && productMedia.length > 0
                                    ? (productMedia.find(m => m.is_primary)?.url || productMedia[0]?.url)
                                    : (product?.image || null);
                            }

                            const productName = product?.name || "Unknown Product";
                            const variantTitle = item.variant?.title || "";
                            const variantSku = item.variant?.sku || "";

                            return (
                                <div key={item.id} className="border rounded-lg p-4 bg-gray-50 flex items-center gap-4">
                                    {finalImage && (
                                        <img
                                            src={finalImage}
                                            alt={productName}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">{productName}</p>
                                        {(variantTitle || variantSku) && (
                                            <p className="text-xs text-gray-500 mb-1">
                                                {variantTitle} {variantSku && `(${variantSku})`}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price}</p>
                                        {item.is_bulk_order && (
                                            <div className="mt-2 space-y-1">
                                                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                    <FaBoxes /> Bulk Order: {item.bulk_range}
                                                </span>
                                                {item.original_price && item.original_price > item.price && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 line-through">₹{item.original_price}</span>
                                                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            <FaTag /> Saved ₹{(item.original_price - item.price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">₹{(item.quantity * item.price).toFixed(2)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnifiedOrders;
