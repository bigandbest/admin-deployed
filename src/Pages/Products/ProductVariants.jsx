import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ProductVariants = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    variant_name: "",
    variant_price: "",
    variant_old_price: "",
    variant_weight: "",
    variant_unit: "kg",
    variant_stock: "",
    is_default: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("Fetching products from:", `${API_BASE_URL}/admin/products`);
      const response = await axios.get(`${API_BASE_URL}/admin/products`);
      console.log("Products API response:", response.data);

      if (response.data.success) {
        const products = response.data.products.map((product) => ({
          id: product.id,
          name: product.name,
          image: product.image || product.images?.[0] || null,
        }));
        console.log("Processed products:", products);
        setProducts(products);
      } else {
        throw new Error(response.data.error || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Error fetching products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async (productId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/product-variants/product/${productId}/variants`
      );
      if (response.data.success) {
        setVariants(response.data.variants || []);
      } else {
        throw new Error(response.data.error || "Failed to fetch variants");
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
      alert("Error fetching variants: " + error.message);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    fetchVariants(product.id);
    setShowAddForm(false);
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const variantData = {
        variant_name: newVariant.variant_name,
        variant_price: parseFloat(newVariant.variant_price),
        variant_old_price: newVariant.variant_old_price
          ? parseFloat(newVariant.variant_old_price)
          : null,
        variant_weight: newVariant.variant_weight,
        variant_unit: newVariant.variant_unit,
        variant_stock: parseInt(newVariant.variant_stock),
        is_default: newVariant.is_default,
      };

      const response = await axios.post(
        `${API_BASE_URL}/product-variants/product/${selectedProduct.id}/variants`,
        variantData
      );

      if (response.data.success) {
        setVariants([...variants, response.data.variant]);
        setNewVariant({
          variant_name: "",
          variant_price: "",
          variant_old_price: "",
          variant_weight: "",
          variant_unit: "kg",
          variant_stock: "",
          is_default: false,
        });
        setShowAddForm(false);
        alert("Variant added successfully!");
      } else {
        throw new Error(response.data.error || "Failed to add variant");
      }
    } catch (error) {
      console.error("Error adding variant:", error);
      alert(
        "Error adding variant: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/product-variants/variant/${variantId}`
      );

      if (response.data.success) {
        setVariants(variants.filter((v) => v.id !== variantId));
        alert("Variant deleted successfully!");
      } else {
        throw new Error(response.data.error || "Failed to delete variant");
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      alert(
        "Error deleting variant: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Product Variants Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Select Product</h2>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <img
                    src={product.image || "/prod1.png"}
                    alt={product.name}
                    className="w-12 h-12 object-contain rounded"
                    onError={(e) => {
                      e.target.src = "/prod1.png";
                    }}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{product.name}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {product.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Variants Management */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {selectedProduct
                ? `Variants for: ${selectedProduct.name}`
                : "Select a product"}
            </h2>
            {selectedProduct && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Variant
              </button>
            )}
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddVariant}
              className="mb-4 p-4 border rounded"
            >
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Variant Name"
                  value={newVariant.variant_name}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      variant_name: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Weight (e.g., 10 kg)"
                  value={newVariant.variant_weight}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      variant_weight: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  type="number"
                  placeholder="Price"
                  value={newVariant.variant_price}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      variant_price: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Old Price"
                  value={newVariant.variant_old_price}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      variant_old_price: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newVariant.variant_stock}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      variant_stock: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={newVariant.variant_unit}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      variant_unit: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                >
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                  <option value="ltr">ltr</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newVariant.is_default}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        is_default: e.target.checked,
                      })
                    }
                  />
                  Default Variant
                </label>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {selectedProduct && (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">{variant.variant_weight}</div>
                    <div className="text-sm text-gray-600">
                      ₹{variant.variant_price}
                      {variant.variant_old_price && (
                        <span className="line-through ml-2">
                          ₹{variant.variant_old_price}
                        </span>
                      )}
                      <span className="ml-2">
                        Stock: {variant.variant_stock}
                      </span>
                      {variant.is_default && (
                        <span className="ml-2 text-blue-600">(Default)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteVariant(variant.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {variants.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No variants available
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductVariants;
