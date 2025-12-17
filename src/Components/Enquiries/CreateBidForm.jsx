// admin-deployed/src/Components/Enquiries/CreateBidForm.jsx
import { useState, useEffect } from 'react';
import { createBid } from '../../api/adminEnquiryApi';
import { toast } from 'react-toastify';

export default function CreateBidForm({ enquiry, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        bid_type: 'SINGLE_PRODUCT',
        validity_hours: 24,
        terms: '',
        notes: '',
    });
    const [products, setProducts] = useState([
        {
            product_id: enquiry.product_id,
            variant_id: enquiry.variant_id || null,
            quantity: enquiry.quantity,
            unit_price: enquiry.expected_price || 0,
        },
    ]);
    const [loading, setLoading] = useState(false);

    const handleProductChange = (index, field, value) => {
        const newProducts = [...products];
        newProducts[index][field] = value;
        setProducts(newProducts);
    };

    const addProduct = () => {
        setProducts([
            ...products,
            {
                product_id: '',
                variant_id: null,
                quantity: 1,
                unit_price: 0,
            },
        ]);
        setFormData(prev => ({ ...prev, bid_type: 'MULTI_PRODUCT' }));
    };

    const removeProduct = (index) => {
        const newProducts = products.filter((_, i) => i !== index);
        setProducts(newProducts);
        if (newProducts.length === 1) {
            setFormData(prev => ({ ...prev, bid_type: 'SINGLE_PRODUCT' }));
        }
    };

    const calculateTotal = () => {
        return products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const bidData = {
                enquiry_id: enquiry.id,
                bid_type: formData.bid_type,
                validity_hours: parseInt(formData.validity_hours),
                terms: formData.terms || null,
                notes: formData.notes || null,
                products: products.map(p => ({
                    product_id: p.product_id,
                    variant_id: p.variant_id || null,
                    quantity: parseInt(p.quantity),
                    unit_price: parseFloat(p.unit_price),
                })),
            };

            const response = await createBid(bidData);

            if (response.success) {
                toast.success('Bid created successfully!');
                if (onSuccess) onSuccess(response.bid);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to create bid');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Bid Offer</h2>
                <p className="text-gray-600">Provide a quote for this enquiry</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Products */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Products
                        </label>
                        {products.length < 5 && (
                            <button
                                type="button"
                                onClick={addProduct}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                + Add Product
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {products.map((product, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">Product {index + 1}</h4>
                                    {products.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProduct(index)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={product.quantity}
                                            onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Unit Price (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={product.unit_price}
                                            onChange={(e) => handleProductChange(index, 'unit_price', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-semibold">₹{(product.quantity * product.unit_price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-blue-900">Total Bid Amount:</span>
                            <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Validity Hours */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validity (Hours)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="168"
                        value={formData.validity_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, validity_hours: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        How long this bid offer will be valid (max 7 days)
                    </p>
                </div>

                {/* Terms */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Terms & Conditions (Optional)
                    </label>
                    <textarea
                        rows="3"
                        value={formData.terms}
                        onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Payment terms, delivery conditions, etc."
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Internal Notes (Optional)
                    </label>
                    <textarea
                        rows="2"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Notes visible to customer"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Bid...' : 'Create Bid Offer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
