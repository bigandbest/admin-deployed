import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ProductApprovalDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Try to get from session storage first
        const stored = sessionStorage.getItem(`pending_product_${id}`);
        if (stored) {
            try {
                setProduct(JSON.parse(stored));
                setLoading(false);
                return;
            } catch (e) { }
        }

        // Fallback: fetch from API
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const url = `${import.meta.env.VITE_API_BASE_URL}/admin/products?active=false&limit=100`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const found = data.products.find(p => p.id === id);
                if (found) {
                    setProduct(found);
                } else {
                    setError("Product not found or already processed.");
                }
            } else {
                setError(data.error || "Failed to fetch products");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch product");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        try {
            if (!window.confirm(`Are you sure you want to ${action} this product?`)) return;

            setProcessing(true);
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
                    sessionStorage.removeItem(`pending_product_${id}`);
                    navigate('/product-approvals');
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
                    sessionStorage.removeItem(`pending_product_${id}`);
                    navigate('/product-approvals');
                } else {
                    alert(data.error || "Rejection failed");
                }
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading details...</div>;
    if (error) return <div className="p-6 text-red-600 bg-red-50 text-center m-6 rounded">{error}</div>;
    if (!product) return <div className="p-6 text-center">No product data available.</div>;

    const primaryImage = product.media?.[0]?.url || 'https://via.placeholder.com/300';
    const otherImages = product.media?.slice(1) || [];

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link to="/product-approvals" className="text-blue-600 text-sm hover:underline mb-2 inline-block">&larr; Back to Approvals</Link>
                    <h1 className="text-2xl font-semibold text-gray-800">Review SKU Request</h1>
                    <p className="text-gray-500 text-sm mt-1">Requested by Seller ID: {product.seller_id}</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleAction('reject')}
                        disabled={processing}
                        className="px-6 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                        {processing ? '...' : 'Reject & Delete'}
                    </button>
                    <button
                        onClick={() => handleAction('approve')}
                        disabled={processing}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 shadow"
                    >
                        {processing ? '...' : 'Approve SKU'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Images Section */}
                <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4 border-b pb-2">Product Images</h3>
                    <img src={primaryImage} alt={product.name} className="w-full h-64 object-cover rounded-lg border mb-4" />
                    <div className="grid grid-cols-4 gap-2">
                        {otherImages.map((img, idx) => (
                            <img key={idx} src={img.url} alt="Variant" className="w-full h-16 object-cover rounded border" />
                        ))}
                    </div>
                </div>

                {/* Info Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">{product.name}</h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">Category</span>
                                <span className="font-medium">{product.category?.name || '—'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">Subcategory</span>
                                <span className="font-medium">{product.subcategory?.name || '—'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">Brand</span>
                                <span className="font-medium">{product.brand_name || '—'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">Vertical</span>
                                <span className="font-medium">{product.vertical}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">GST Rate</span>
                                <span className="font-medium">{product.gst_rate}%</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">HSN/SAC</span>
                                <span className="font-medium">{product.hsn_or_sac_code || '—'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <span className="block text-gray-500 text-xs">Return Policy</span>
                                <span className="font-medium">{product.return_applicable ? `${product.return_days} Days` : 'No Returns'}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-medium mb-3 border-b pb-2">Description</h3>
                        <div 
                            className="text-gray-700 text-sm max-w-none prose prose-sm prose-p:my-1 prose-strong:text-gray-900"
                            dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium mb-4 border-b pb-2">Variants ({product.variants?.length || 0})</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Name / SKU</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Pricing</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Stock</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Default</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {product.variants?.map((v, i) => (
                                        <tr key={v.id || i} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{v.title}</div>
                                                <div className="text-xs text-gray-500">{v.sku}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">₹{Number(v.price || 0).toFixed(2)}</div>
                                                <div className="text-xs text-gray-500 line-through">₹{Number(v.old_price || 0).toFixed(2)}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {v.stock_qty || 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                {v.is_default && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">Primary</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductApprovalDetails;
