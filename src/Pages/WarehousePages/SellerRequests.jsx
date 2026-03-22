import React, { useState, useEffect } from 'react';
import { formatCurrency } from "../../utils/adminWalletApi"; // Reusing format function

const SellerRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");

    const [processingId, setProcessingId] = useState(null);
    const [sellingPrices, setSellingPrices] = useState({});

    const getAdminAccessToken = () => {
        const candidates = [
            localStorage.getItem('admin_token'),
            localStorage.getItem('big-best-admin-auth-token'),
        ].filter(Boolean);

        for (const raw of candidates) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed?.access_token) return parsed.access_token;
                if (typeof parsed === 'string' && parsed.trim()) {
                    return parsed.replace(/^Bearer\s+/i, '');
                }
            } catch {
                if (typeof raw === 'string' && raw.trim()) {
                    return raw.replace(/^Bearer\s+/i, '');
                }
            }
        }

        return null;
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getAdminAccessToken();
            if (!token) {
                setRequests([]);
                setError("Admin session token not found. Please login again.");
                return;
            }
            const url = statusFilter
                ? `${import.meta.env.VITE_API_BASE_URL}/admin/sellers/products/requests?status=${statusFilter}`
                : `${import.meta.env.VITE_API_BASE_URL}/admin/sellers/products/requests`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setRequests(data.data);

                // Pre-fill admin price input with seller's offer price (only if > 0)
                const initialPrices = {};
                data.data.forEach(req => {
                    if (req.status === 'PENDING_APPROVAL' && req.seller_offer_price > 0) {
                        initialPrices[req.id] = req.seller_offer_price;
                    }
                });
                setSellingPrices(initialPrices);
            } else {
                setError(data.error || "Failed to fetch requests");
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError(err.message || "Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handlePriceChange = (id, value) => {
        setSellingPrices(prev => ({ ...prev, [id]: value }));
    };

    const handleAction = async (id, action) => {
        try {
            if (!confirm(`Are you sure you want to ${action} this request?`)) return;

            setProcessingId(id);
            const token = getAdminAccessToken();
            if (!token) {
                alert("Admin session expired. Please login again.");
                setProcessingId(null);
                return;
            }

            const adminSellingPrice = sellingPrices[id];

            if (action === 'approve' && (adminSellingPrice === undefined || adminSellingPrice === null || adminSellingPrice === '')) {
                alert('Please enter an Admin Selling Price before approving.');
                setProcessingId(null);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/sellers/products/requests/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(action === 'approve' ? { adminSellingPrice } : {})
            });

            const data = await response.json();
            if (data.success) {
                alert(`Request ${action}d successfully`);
                fetchRequests();
            } else {
                alert(data.error || "Action failed");
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">📦 Seller Product Requests</h1>
                <p className="text-gray-600 mt-1">Review and approve products added by sellers to your inventory</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 flex space-x-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">All</option>
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prices (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && requests.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">No requests found.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{req.product?.name}</div>
                                        <div className="text-xs text-gray-500">Variant: {req.variant?.title || 'Default'}</div>
                                        <div className="text-xs text-gray-500">
                                            Qty offered: <strong className="text-blue-700">{req.stock_quantity}</strong>
                                        </div>
                                        <div className="text-xs text-gray-500">SKU: {req.variant?.sku || '—'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{req.seller?.business_name || req.seller?.name}</div>
                                        <div className="text-xs text-gray-500">{req.seller?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{req.warehouse?.name}</div>
                                        <div className="text-xs text-blue-600 text-semibold">Zonal ID: {req.warehouse?.zonal_warehouse_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs flex justify-between mb-1">
                                            <span className="text-gray-500">MRP:</span>
                                            <span className="line-through text-gray-400">
                                                {req.mrp > 0 ? `₹${Number(req.mrp).toFixed(2)}` : '—'}
                                            </span>
                                        </div>
                                        <div className="text-xs flex justify-between mb-2">
                                            <span className="text-gray-500">Seller Ask:</span>
                                            <span className={`font-bold ${req.seller_offer_price > 0 ? 'text-gray-900' : 'text-red-400'}`}>
                                                {req.seller_offer_price > 0 ? `₹${Number(req.seller_offer_price).toFixed(2)}` : 'Not set'}
                                            </span>
                                        </div>
                                        {req.status === 'PENDING_APPROVAL' ? (
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-semibold uppercase">Set Admin Selling Price (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={sellingPrices[req.id] ?? ''}
                                                    onChange={(e) => handlePriceChange(req.id, e.target.value)}
                                                    placeholder={req.seller_offer_price > 0 ? `Seller asked ₹${req.seller_offer_price}` : 'Enter price...'}
                                                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm bg-blue-50 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-xs flex justify-between mt-2 pt-1 border-t border-gray-200">
                                                <span className="text-gray-500 font-semibold">Admin Set:</span>
                                                <span className={`font-bold ${req.admin_selling_price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {req.admin_selling_price > 0 ? `₹${Number(req.admin_selling_price).toFixed(2)}` : 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.status === 'PENDING_APPROVAL' ? (
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    disabled={processingId === req.id}
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {processingId === req.id ? '...' : 'Approve & Transfer Stock'}
                                                </button>
                                                <button
                                                    disabled={processingId === req.id}
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    className="border border-red-600 text-red-600 text-xs px-3 py-1.5 rounded hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SellerRequests;
