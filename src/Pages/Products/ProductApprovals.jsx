import React, { useState, useEffect } from 'react';
import { formatCurrency } from "../../utils/adminWalletApi"; 

const ProductApprovals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const url = `${import.meta.env.VITE_API_BASE_URL}/admin/products?active=false&limit=100`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                // Filter only products created by sellers that are pending
                const sellerPending = data.products.filter(p => !p.active && p.created_by === 'seller');
                setProducts(sellerPending);
            } else {
                setError(data.error || "Failed to fetch products");
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError(err.message || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProducts();
    }, []);

    const handleAction = async (id, action) => {
        try {
            if (!confirm(`Are you sure you want to ${action} this product?`)) return;

            setProcessingId(id);
            const token = localStorage.getItem('admin_token');

            if (action === 'approve') {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ active: true })
                });

                const data = await response.json();
                if (data.success) {
                    alert(`Product approved successfully and assigned to seller.`);
                    fetchPendingProducts();
                } else {
                    alert(data.error || "Approval failed");
                }
            } else if (action === 'reject') {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    alert(`Product rejected and deleted.`);
                    fetchPendingProducts();
                } else {
                    alert(data.error || "Rejection failed");
                }
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
                <h1 className="text-3xl font-semibold text-gray-800">📋 New SKU Approvals</h1>
                <p className="text-gray-600 mt-1">Review new product SKUs created by Sellers</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 flex space-x-4">
                <div className="flex-1 flex justify-end">
                    <button
                        onClick={fetchPendingProducts}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prices (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && products.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-4 text-center">No pending SKU requests.</td></tr>
                        ) : (
                            products.map((p) => {
                                const defaultVariant = p.variants?.[0] || {};
                                const imageUrl = p.media?.[0]?.url || 'https://via.placeholder.com/60';
                                
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <img src={imageUrl} alt={p.name} className="w-12 h-12 rounded object-cover border" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{p.category?.name || 'Category'} &gt; {p.subcategory?.name || 'Subcategory'}</div>
                                                    <div className="text-xs text-blue-600 font-medium mt-1 cursor-pointer" onClick={() => window.location.href = `/product-approvals/${p.id}`}>
                                                        View Full Details &rarr;
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{p.variants?.length || 0} Variant(s)</div>
                                            <div className="text-xs text-gray-500">First SKU: {defaultVariant.sku || '—'}</div>
                                            <div className="text-xs text-gray-500">Stock Qty: {defaultVariant.stock_qty || 0}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">₹{Number(defaultVariant.price || 0).toFixed(2)}</div>
                                            <div className="text-xs text-gray-500 line-through">MRP: ₹{Number(defaultVariant.old_price || defaultVariant.price || 0).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    onClick={() => {
                                                        // We can store the current product state in sessionStorage so the details page doesn't need to refetch it
                                                        sessionStorage.setItem(`pending_product_${p.id}`, JSON.stringify(p));
                                                        window.location.href = `/product-approvals/${p.id}`;
                                                    }}
                                                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                                                >
                                                    Review & Take Action
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductApprovals;
