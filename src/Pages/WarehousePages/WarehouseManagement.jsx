import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import ProductModal from "../../Components/Warehouse/ProductModal";
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getAllZones,
  getWarehouseHierarchy,
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  addProductToWarehouse,
  getZonalWarehouseAvailablePincodes,
  getZonalWarehouseAvailablePincodesDirect,
} from "../../utils/supabaseApi";
import { getZoneProductVisibility } from "../../utils/zoneApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const WarehouseManagement = () => {
  const [activeTab, setActiveTab] = useState("warehouses");
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("all");
  const [zoneVisibility, setZoneVisibility] = useState(null);
  const [zoneVisibilityLoading, setZoneVisibilityLoading] = useState(false);
  const [zoneVisibilityError, setZoneVisibilityError] = useState("");

  // Stock Management states
  const [stockData, setStockData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  // Modal states
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form data
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    type: "zonal",
    pincode: "",
    address: "",
    zone_ids: [],
    parent_warehouse_id: null,
    pincode_assignments: [], // For division warehouses
  });

  const [warehouseHierarchy, setWarehouseHierarchy] = useState([]);

  const [productForm, setProductForm] = useState({
    selectedProductId: "",
    searchTerm: "",
    availableProducts: [],
    name: "",
    price: "",
    delivery_type: "zonal",
    warehouse_assignments: [],
    description: "",
    category_id: "", // Optional field
    initial_stock: 100,
    minimum_threshold: 10,
    cost_per_unit: 0,
  });

  // Fetch all data
  const fetchWarehouses = useCallback(async () => {
    try {
      const result = await getAllWarehouses();
      if (result.success) {
        setWarehouses(result.data || []);
      } else {
        setError("Failed to fetch warehouses: " + result.error);
      }
    } catch (err) {
      setError("Failed to fetch warehouses");
      console.error(err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const result = await getAllProducts();
      if (result.success) {
        const productsList = result.products || result.data || [];
        setProducts(productsList);
        // Update productForm with available products
        setProductForm(prev => ({
          ...prev,
          availableProducts: productsList
        }));
      } else {
        setError("Failed to fetch products: " + result.error);
      }
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      const result = await getAllZones({ active_only: "true" });
      if (result.success) {
        setZones(result.data || []);
      } else {
        setError("Failed to fetch zones: " + result.error);
      }
    } catch (err) {
      setError("Failed to fetch zones");
      console.error(err);
    }
  }, []);

  const fetchWarehouseHierarchy = useCallback(async () => {
    try {
      const result = await getWarehouseHierarchy();
      if (result.success) {
        setWarehouseHierarchy(result.data);
      } else {
        console.error("Failed to fetch warehouse hierarchy:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch warehouse hierarchy:", err);
    }
  }, []);

  const fetchZoneVisibility = useCallback(
    async (zoneId) => {
      if (!zoneId || zoneId === "all") {
        setZoneVisibility(null);
        setZoneVisibilityError("");
        return;
      }

      setZoneVisibilityLoading(true);
      try {
        const normalizedZoneId = Number(zoneId);
        if (Number.isNaN(normalizedZoneId)) {
          throw new Error("Invalid zone selection");
        }

        const result = await getZoneProductVisibility(normalizedZoneId);
        if (result?.success) {
          setZoneVisibility(result);
          setZoneVisibilityError("");
        } else {
          setZoneVisibility(null);
          setZoneVisibilityError(
            result?.error || "Failed to load zone visibility data"
          );
        }
      } catch (visibilityError) {
        setZoneVisibility(null);
        setZoneVisibilityError(
          visibilityError.message ||
          "Failed to load zone visibility data"
        );
      } finally {
        setZoneVisibilityLoading(false);
      }
    },
    []
  );

  const refreshZoneVisibility = useCallback(() => {
    if (!selectedZoneId || selectedZoneId === "all") return;
    fetchZoneVisibility(selectedZoneId);
  }, [selectedZoneId, fetchZoneVisibility]);

  // Handle warehouse operations
  const handleWarehouseSubmit = async () => {
    // Validate warehouse type - only allow zonal and division
    if (!["zonal", "division"].includes(warehouseForm.type)) {
      setError(
        "Invalid warehouse type. Only zonal and division warehouses are allowed."
      );
      return;
    }

    // Validate division warehouses must have a parent
    if (
      warehouseForm.type === "division" &&
      !warehouseForm.parent_warehouse_id
    ) {
      setError("Division warehouses must have a parent zonal warehouse.");
      return;
    }

    try {
      if (editingWarehouse) {
        const result = await updateWarehouse(
          editingWarehouse.id,
          warehouseForm
        );
        if (!result.success) {
          setError("Failed to update warehouse: " + result.error);
          return;
        }
      } else {
        const result = await createWarehouse(warehouseForm);
        if (!result.success) {
          setError("Failed to create warehouse: " + result.error);
          return;
        }
      }

      setShowWarehouseModal(false);
      setEditingWarehouse(null);
      setWarehouseForm({
        name: "",
        type: "zonal",
        pincode: "",
        address: "",
        zone_ids: [],
        parent_warehouse_id: null,
        pincode_assignments: [],
      });

      await fetchWarehouses();
      await fetchWarehouseHierarchy();
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save warehouse");
      console.error(err);
    }
  };

  const handleWarehouseDelete = async (warehouseId) => {
    if (!window.confirm("Are you sure you want to delete this warehouse?"))
      return;

    try {
      const result = await deleteWarehouse(warehouseId);
      if (result.success) {
        await fetchWarehouses();
        setError("");
      } else {
        setError("Failed to delete warehouse: " + result.error);
      }
    } catch (err) {
      setError("Failed to delete warehouse");
      console.error(err);
    }
  };

  // Handle product operations
  const handleProductSubmit = async () => {
    try {
      // Handle product assignment (both new and editing)
      if (productForm.selectedProductId) {
        // Validate warehouse assignments
        if (!productForm.warehouse_assignments || productForm.warehouse_assignments.length === 0) {
          setError("Please assign stock to at least one warehouse");
          return;
        }

        // Add product to each assigned warehouse
        // Group assignments by warehouse to handle both base product and variants
        const warehouseGroups = new Map();

        productForm.warehouse_assignments.forEach(assignment => {
          const warehouseId = typeof assignment === 'object' ? assignment.warehouse_id : assignment;
          if (!warehouseGroups.has(warehouseId)) {
            warehouseGroups.set(warehouseId, []);
          }
          warehouseGroups.get(warehouseId).push(assignment);
        });

        // Process each warehouse
        for (const [warehouseId, assignments] of warehouseGroups) {
          try {
            // Process each assignment (could be base product or variant)
            for (const assignment of assignments) {
              const stockQuantity = typeof assignment === 'object' ? assignment.stock_quantity : productForm.initial_stock;
              const variantId = typeof assignment === 'object' ? assignment.variant_id : null;

              if (warehouseId && stockQuantity > 0) {
                if (variantId) {
                  // Update variant stock in warehouse (not add, just update the quantity)
                  console.log(`Updating variant ${variantId} stock in warehouse ${warehouseId} to ${stockQuantity}`);
                  try {
                    await axios.put(
                      `${API_BASE_URL}/warehouses/${warehouseId}/products/${productForm.selectedProductId}`,
                      {
                        variant_id: variantId,
                        stock_quantity: stockQuantity,
                        minimum_threshold: productForm.minimum_threshold || 10,
                        cost_per_unit: productForm.cost_per_unit || 0
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                        }
                      }
                    );
                    console.log(`✅ Successfully updated variant ${variantId} in warehouse ${warehouseId}`);
                  } catch (variantError) {
                    console.error(`Variant update error:`, variantError);
                    // If update fails, try to add it
                    console.log(`Trying to add variant ${variantId} to warehouse ${warehouseId}`);
                    await addProductToWarehouse(
                      warehouseId,
                      productForm.selectedProductId,
                      stockQuantity,
                      productForm.minimum_threshold || 10,
                      productForm.cost_per_unit || 0,
                      variantId
                    );
                  }
                } else {
                  // Update base product stock in warehouse
                  console.log(`Updating product stock in warehouse ${warehouseId} to ${stockQuantity}`);
                  try {
                    await axios.put(
                      `${API_BASE_URL}/warehouses/${warehouseId}/products/${productForm.selectedProductId}`,
                      {
                        stock_quantity: stockQuantity,
                        minimum_threshold: productForm.minimum_threshold || 10,
                        cost_per_unit: productForm.cost_per_unit || 0
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                        }
                      }
                    );
                    console.log(`✅ Successfully updated product in warehouse ${warehouseId}`);
                  } catch (updateError) {
                    console.error(`Update error:`, updateError);
                    // If update fails (product doesn't exist), add it
                    console.log(`Trying to add product to warehouse ${warehouseId}`);
                    await addProductToWarehouse(
                      warehouseId,
                      productForm.selectedProductId,
                      stockQuantity,
                      productForm.minimum_threshold || 10,
                      productForm.cost_per_unit || 0
                    );
                  }
                }
              }
            }
          } catch (warehouseError) {
            console.error(`Failed to add product to warehouse ${warehouseId}:`, warehouseError);
            setError(`Failed to add product to some warehouses: ${warehouseError.response?.data?.error || warehouseError.message}`);
          }
        }

        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({
          selectedProductId: "",
          searchTerm: "",
          availableProducts: products,
          name: "",
          price: "",
          delivery_type: "zonal",
          warehouse_assignments: [],
          description: "",
          category_id: "",
          initial_stock: 100,
          minimum_threshold: 10,
          cost_per_unit: 0,
        });

        await fetchProducts();
        refreshZoneVisibility();
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
      console.error(err);
    }
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      const result = await deleteProduct(productId);
      if (result.success) {
        await fetchProducts();
        refreshZoneVisibility();
        setError("");
      } else {
        setError("Failed to delete product: " + result.error);
      }
    } catch (err) {
      setError("Failed to delete product");
      console.error(err);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWarehouses(),
        fetchProducts(),
        fetchZones(),
        fetchWarehouseHierarchy(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchWarehouses, fetchProducts, fetchZones, fetchWarehouseHierarchy]);

  useEffect(() => {
    fetchZoneVisibility(selectedZoneId);
  }, [selectedZoneId, fetchZoneVisibility]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getWarehouseStats = () => ({
    total: warehouses.length,
    zonal: warehouses.filter((w) => w.type === "zonal").length,
    division: warehouses.filter((w) => w.type === "division").length,
  });

  const getProductStats = () => ({
    total: products.length,
    nationwide: products.filter((p) => p.delivery_type === "nationwide").length,
    zonal: products.filter((p) => p.delivery_type === "zonal").length,
  });

  const warehouseStats = getWarehouseStats();
  const productStats = getProductStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Warehouse Management
        </h1>
        <p className="text-gray-600">
          Manage zonal warehouses, division warehouses, and their hierarchical
          relationships
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Warehouses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {warehouseStats.total}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {warehouseStats.zonal} Zonal • {warehouseStats.division}{" "}
                Division
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {productStats.total}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {productStats.nationwide} Nationwide • {productStats.zonal}{" "}
                Zonal
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🌍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Available Zones
              </p>
              <p className="text-2xl font-bold text-gray-900">{zones.length}</p>
              <div className="text-xs text-gray-500 mt-1">Coverage areas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              {
                id: "warehouses",
                name: "Warehouses",
                icon: "🏢",
                count: warehouseStats.total,
              },
              {
                id: "products",
                name: "Products",
                icon: "📦",
                count: productStats.total,
              },
              {
                id: "stock",
                name: "Stock Management",
                icon: "📊",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "warehouses" && (
        <WarehousesTab
          warehouses={warehouses}
          warehouseHierarchy={warehouseHierarchy}
          onEdit={(warehouse) => {
            setEditingWarehouse(warehouse);
            setWarehouseForm({
              name: warehouse.name || "",
              type: warehouse.type || "zonal",
              pincode: warehouse.pincode || "",
              address: warehouse.address || "",
              zone_ids: warehouse.zones ? warehouse.zones.map((z) => z.id) : [],
              parent_warehouse_id: warehouse.parent_warehouse_id || null,
            });
            setShowWarehouseModal(true);
          }}
          onDelete={handleWarehouseDelete}
          onAdd={() => {
            setEditingWarehouse(null);
            setWarehouseForm({
              name: "",
              type: "zonal",
              pincode: "",
              address: "",
              zone_ids: [],
              parent_warehouse_id: null,
              pincode_assignments: [],
            });
            setShowWarehouseModal(true);
          }}
        />
      )}

      {activeTab === "products" && (
        <ProductsTab
          products={products}
          warehouses={warehouses}
          onEdit={(product) => {
            setEditingProduct(product);
            setProductForm({
              selectedProductId: product.id || "",
              searchTerm: "",
              availableProducts: products, // Pass all products to the modal
              name: product.name || "",
              price: product.price || "",
              delivery_type: product.delivery_type || "zonal",
              warehouse_assignments: product.warehouse_assignments || [],
              description: product.description || "",
              category_id: product.category_id || "",
              initial_stock: product.initial_stock || 100,
              minimum_threshold: product.minimum_threshold || 10,
              cost_per_unit: product.cost_per_unit || 0,
            });
            setShowProductModal(true);
          }}
          onDelete={handleProductDelete}
          onAdd={() => {
            setEditingProduct(null);
            setProductForm({
              selectedProductId: "",
              searchTerm: "",
              availableProducts: products, // Pass all products to the modal
              name: "",
              price: "",
              delivery_type: "zonal",
              warehouse_assignments: [],
              description: "",
              category_id: "", // Optional field
              initial_stock: 100,
              minimum_threshold: 10,
              cost_per_unit: 0,
            });
            setShowProductModal(true);
          }}
          selectedZoneId={selectedZoneId}
          onZoneChange={setSelectedZoneId}
          zoneVisibility={zoneVisibility}
          zoneVisibilityLoading={zoneVisibilityLoading}
          zoneVisibilityError={zoneVisibilityError}
        />
      )}

      {activeTab === "stock" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Management</h3>
          <p className="text-gray-600 mb-4">
            Stock management features are being integrated. This will include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Stock overview across all warehouses</li>
            <li>Low stock alerts and notifications</li>
            <li>Stock movement tracking and history</li>
            <li>Stock transfer between warehouses</li>
            <li>Stock adjustment and reconciliation</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Coming Soon:</strong> Full stock management functionality will be available here.
              For now, you can manage warehouse assignments in the Products tab.
            </p>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      {showWarehouseModal && (
        <WarehouseModal
          isOpen={showWarehouseModal}
          onClose={() => {
            setShowWarehouseModal(false);
            setEditingWarehouse(null);
          }}
          data={warehouseForm}
          setData={setWarehouseForm}
          onSubmit={handleWarehouseSubmit}
          zones={zones}
          warehouses={warehouses}
          isEditing={!!editingWarehouse}
        />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          data={productForm}
          setData={setProductForm}
          onSubmit={handleProductSubmit}
          warehouses={warehouses}
          zones={zones}
          isEditing={!!editingProduct}
        />
      )}
    </div>
  );
};

// Warehouse Hierarchy Component
const WarehouseHierarchyView = ({ warehouseHierarchy }) => {
  if (warehouseHierarchy.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Warehouse Hierarchy
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Zonal warehouses (regional) contain division warehouses (local pincode
          coverage)
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {warehouseHierarchy.map((hierarchy) => (
            <div key={hierarchy.id} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">🏢</span>
                <span className="font-semibold text-gray-900">
                  {hierarchy.name}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Zonal
                </span>
                <span className="text-sm text-gray-500">
                  ({hierarchy.children_count || 0} division warehouses)
                </span>
              </div>
              {hierarchy.children && hierarchy.children.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
                  {hierarchy.children.map((child) => (
                    <div key={child.id} className="flex items-center space-x-2">
                      <span className="text-sm">🏬</span>
                      <span className="text-gray-700">{child.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Division
                      </span>
                      {child.pincodes && child.pincodes.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({child.pincodes.length} pincodes)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Warehouses Tab Component
const WarehousesTab = ({
  warehouses,
  onEdit,
  onDelete,
  onAdd,
  warehouseHierarchy,
}) => {
  return (
    <div>
      {/* Warehouse Hierarchy */}
      <WarehouseHierarchyView warehouseHierarchy={warehouseHierarchy} />

      {/* Warehouses List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Warehouses</h3>
          <button
            onClick={onAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Warehouse</span>
          </button>
        </div>

        {warehouses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No warehouses found
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first warehouse to start managing inventory.
            </p>
            <button
              onClick={onAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add First Warehouse
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Coverage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {warehouse.parent_warehouse_id && (
                            <span className="text-gray-400 mr-2">└─</span>
                          )}
                          {warehouse.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {warehouse.id}
                        </div>
                        {warehouse.parent_warehouse_id && (
                          <div className="text-xs text-blue-600 mt-1">
                            Under:{" "}
                            {warehouses.find(
                              (w) => w.id === warehouse.parent_warehouse_id
                            )?.name || "Unknown Parent"}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${warehouse.type === "zonal"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                            }`}
                        >
                          {warehouse.type === "zonal"
                            ? "Zonal Warehouse"
                            : "Division Warehouse"}
                        </span>

                        {warehouse.type === "zonal" && (
                          <div className="text-xs text-gray-600">
                            {
                              warehouses.filter(
                                (w) => w.parent_warehouse_id === warehouse.id
                              ).length
                            }{" "}
                            division warehouses
                          </div>
                        )}

                        {warehouse.zones && warehouse.zones.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {warehouse.zones.slice(0, 2).map((zone) => (
                              <span
                                key={zone.id}
                                className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                              >
                                {zone.name}
                              </span>
                            ))}
                            {warehouse.zones.length > 2 && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                +{warehouse.zones.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {warehouse.pincode && <div>📍 {warehouse.pincode}</div>}
                        {warehouse.address && (
                          <div className="text-gray-500">
                            {warehouse.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onEdit(warehouse)}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded"
                        >
                          Edit
                        </button>

                        {warehouse.type === "zonal" &&
                          warehouses.filter(
                            (w) => w.parent_warehouse_id === warehouse.id
                          ).length > 0 && (
                            <button
                              onClick={() => {
                                const children = warehouses.filter(
                                  (w) => w.parent_warehouse_id === warehouse.id
                                );
                                const childNames = children
                                  .map((c) => c.name)
                                  .join(", ");
                                alert(
                                  `Division warehouses under ${warehouse.name}:\n\n${childNames}`
                                );
                              }}
                              className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs"
                            >
                              View Divisions
                            </button>
                          )}

                        <button
                          onClick={() => onDelete(warehouse.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded"
                        >
                          Delete
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
    </div>
  );
};

// PropTypes for WarehouseHierarchyView component
WarehouseHierarchyView.propTypes = {
  warehouseHierarchy: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      children_count: PropTypes.number,
      children: PropTypes.array,
    })
  ).isRequired,
};

// PropTypes for WarehousesTab component
WarehousesTab.propTypes = {
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      type: PropTypes.string,
      location: PropTypes.string,
      is_active: PropTypes.bool,
    })
  ).isRequired,
  warehouseHierarchy: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      children_count: PropTypes.number,
      children: PropTypes.array,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

// Products Tab Component
const ProductsTab = ({
  products,
  warehouses,
  onEdit,
  onDelete,
  onAdd,
  selectedZoneId,
  onZoneChange,
  zoneVisibility,
  zoneVisibilityLoading,
  zoneVisibilityError,
}) => {
  const zonalWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.type === "zonal"),
    [warehouses]
  );

  const warehouseMap = useMemo(() => {
    const map = new Map();
    warehouses.forEach((warehouse) => map.set(warehouse.id, warehouse));
    return map;
  }, [warehouses]);

  const zoneVisibilityMap = useMemo(() => {
    if (!zoneVisibility?.products) return null;
    return new Map(
      zoneVisibility.products.map((product) => [product.id, product])
    );
  }, [zoneVisibility]);

  const renderAvailability = (product) => {
    if (selectedZoneId !== "all") {
      if (zoneVisibilityLoading) {
        return (
          <span className="text-xs text-gray-500">Loading visibility...</span>
        );
      }

      if (zoneVisibilityError) {
        return (
          <span className="text-xs text-red-500">{zoneVisibilityError}</span>
        );
      }

      const zoneProduct = zoneVisibilityMap?.get(product.id);
      if (!zoneProduct) {
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full">
            Unavailable in selected zone
          </span>
        );
      }

      if (zoneProduct.visibility === "zone_available") {
        return (
          <div className="space-y-1">
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
              Zone level stock available
            </span>
            {zoneProduct.zone_assignment && (
              <p className="text-xs text-gray-600">
                {zoneProduct.zone_assignment.available_quantity} units in{" "}
                {zoneProduct.zone_assignment.warehouse_name}
              </p>
            )}
          </div>
        );
      }

      if (
        zoneProduct.visibility === "division_only" &&
        zoneProduct.division_available?.length
      ) {
        return (
          <div className="space-y-1">
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full">
              Division-only coverage
            </span>
            <p className="text-xs text-gray-600">
              Available in{" "}
              {zoneProduct.division_available
                .map((division) => division.warehouse_name)
                .join(", ")}
            </p>
          </div>
        );
      }

      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full">
          Unavailable in selected zone
        </span>
      );
    }

    const zonalAssignments =
      product.warehouse_assignments?.filter((assignment) => {
        const warehouse = warehouseMap.get(assignment.warehouse_id);
        return (
          warehouse?.type === "zonal" &&
          Number.parseInt(assignment.stock_quantity, 10) > 0
        );
      }) || [];

    const divisionAssignments =
      product.warehouse_assignments?.filter((assignment) => {
        const warehouse = warehouseMap.get(assignment.warehouse_id);
        return (
          warehouse?.type === "division" &&
          Number.parseInt(assignment.stock_quantity, 10) > 0
        );
      }) || [];

    if (
      !product.warehouse_assignments ||
      product.warehouse_assignments.length === 0
    ) {
      return (
        <span className="text-xs text-gray-500">No warehouse assignments</span>
      );
    }

    return (
      <div className="space-y-1">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
          Zonal: {zonalAssignments.length}
        </span>
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">
          Divisions: {divisionAssignments.length}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <p className="text-sm text-gray-600">
              Manage zone-aware visibility and stock assignments.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            {zonalWarehouses.length > 0 && (
              <select
                value={selectedZoneId}
                onChange={(event) => onZoneChange(event.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Zones</option>
                {zonalWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onAdd}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 justify-center"
            >
              <span>➕</span>
              <span>Add Product</span>
            </button>
          </div>
        </div>
        {selectedZoneId !== "all" && zoneVisibility?.zone && (
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            Viewing availability for{" "}
            <span className="font-semibold">
              {zoneVisibility.zone.name}
            </span>
            . Zone level availability always takes precedence over divisions.
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-4">
            Add products to start managing your inventory.
          </p>
          <button
            onClick={onAdd}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.description && product.description.length > 50
                          ? `${product.description.substring(0, 50)}...`
                          : product.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ₹{product.price}
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${product.delivery_type === "nationwide"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                          }`}
                      >
                        {product.delivery_type === "nationwide"
                          ? "🌍 Nationwide"
                          : "🏙️ Zonal Only"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {renderAvailability(product)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded"
                      >
                        Delete
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
  );
};

// PropTypes for ProductsTab component
ProductsTab.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      price: PropTypes.number,
      delivery_type: PropTypes.string,
      description: PropTypes.string,
      warehouse_assignments: PropTypes.array,
    })
  ).isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  selectedZoneId: PropTypes.string.isRequired,
  onZoneChange: PropTypes.func.isRequired,
  zoneVisibility: PropTypes.object,
  zoneVisibilityLoading: PropTypes.bool,
  zoneVisibilityError: PropTypes.string,
};

// Warehouse Modal Component
const WarehouseModal = ({
  isOpen,
  onClose,
  data,
  setData,
  onSubmit,
  zones,
  warehouses,
  isEditing,
}) => {
  const [availablePincodes, setAvailablePincodes] = useState([]);
  const [loadingPincodes, setLoadingPincodes] = useState(false);

  // Fetch available pincodes when parent warehouse changes for division warehouses
  useEffect(() => {
    const fetchAvailablePincodes = async () => {
      if (data.type === "division" && data.parent_warehouse_id) {
        setLoadingPincodes(true);
        try {
          // Try backend API first
          let result = await getZonalWarehouseAvailablePincodes(
            data.parent_warehouse_id
          );

          // If backend fails, try direct Supabase query as fallback
          if (!result.success) {
            console.warn(
              "Backend API failed, trying direct Supabase query:",
              result.error
            );
            result = await getZonalWarehouseAvailablePincodesDirect(
              data.parent_warehouse_id
            );
          }

          if (result.success) {
            setAvailablePincodes(result.data || []);
          } else {
            console.error("Failed to fetch available pincodes:", result.error);
            setAvailablePincodes([]);
          }
        } catch (error) {
          console.error("Error fetching available pincodes:", error);
          setAvailablePincodes([]);
        } finally {
          setLoadingPincodes(false);
        }
      } else {
        setAvailablePincodes([]);
      }
    };

    fetchAvailablePincodes();
  }, [data.type, data.parent_warehouse_id]);

  if (!isOpen) return null;

  const handleZoneToggle = (zoneId) => {
    const currentZoneIds = data.zone_ids || [];
    if (currentZoneIds.includes(zoneId)) {
      setData({
        ...data,
        zone_ids: currentZoneIds.filter((id) => id !== zoneId),
      });
    } else {
      setData({
        ...data,
        zone_ids: [...currentZoneIds, zoneId],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Warehouse" : "Add New Warehouse"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Name *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter warehouse name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Type *
            </label>
            <select
              value={data.type}
              onChange={(e) =>
                setData({
                  ...data,
                  type: e.target.value,
                  zone_ids: e.target.value === "zonal" ? data.zone_ids : [],
                  parent_warehouse_id:
                    e.target.value === "division"
                      ? data.parent_warehouse_id
                      : null,
                  pincode_assignments:
                    e.target.value === "division"
                      ? data.pincode_assignments
                      : [],
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* Only zonal and division warehouses are allowed - central warehouses removed */}
              <option value="zonal">
                🏙️ Zonal Warehouse (Top-level regional coverage)
              </option>
              <option value="division">
                🏬 Division Warehouse (Local pincode coverage under zonal)
              </option>
            </select>
          </div>

          {data.type === "division" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Zonal Warehouse *
              </label>
              <select
                value={data.parent_warehouse_id || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    parent_warehouse_id: e.target.value || null,
                    pincode_assignments: [], // Clear pincodes when parent changes
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a zonal warehouse</option>
                {warehouses
                  .filter((w) => w.type === "zonal")
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Division warehouses serve specific pincodes under a parent zonal
                warehouse
              </p>
            </div>
          )}

          {data.type === "zonal" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Served Zones *
              </label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                {zones.length === 0 ? (
                  <p className="text-gray-500 text-sm">No zones available</p>
                ) : (
                  zones.map((zone) => (
                    <label
                      key={zone.id}
                      className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(data.zone_ids || []).includes(zone.id)}
                        onChange={() => handleZoneToggle(zone.id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {zone.name} ({zone.state})
                      </span>
                    </label>
                  ))
                )}
              </div>
              {data.type === "zonal" && (data.zone_ids || []).length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Please select at least one zone for zonal warehouses
                </p>
              )}
            </div>
          )}

          {data.type === "division" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Served Pincodes *
              </label>
              <div className="border rounded-lg p-4 bg-gray-50">
                {data.parent_warehouse_id ? (
                  <>
                    {loadingPincodes ? (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="text-gray-600 font-medium">
                            Loading available pincodes...
                          </span>
                        </div>
                      </div>
                    ) : availablePincodes.length > 0 ? (
                      <>
                        {/* Header with stats and actions */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">
                                Available Pincodes:
                              </span>{" "}
                              <span className="text-green-600 font-semibold">
                                {
                                  availablePincodes.filter(
                                    (p) => p.is_available
                                  ).length
                                }
                              </span>
                              {" • "}
                              <span className="text-orange-600 font-semibold">
                                {
                                  availablePincodes.filter(
                                    (p) => !p.is_available
                                  ).length
                                }
                              </span>{" "}
                              assigned
                            </div>
                          </div>
                        </div>

                        {/* Pincode dropdown */}
                        <select
                          multiple
                          value={data.pincode_assignments.map((p) => p.pincode)}
                          onChange={(e) => {
                            const selectedOptions = Array.from(
                              e.target.selectedOptions
                            );
                            const selectedPincodes = selectedOptions.map(
                              (option) => {
                                const pincodeData = availablePincodes.find(
                                  (p) => p.pincode === option.value
                                );
                                return {
                                  pincode: pincodeData.pincode,
                                  city: pincodeData.city,
                                  state: pincodeData.state,
                                };
                              }
                            );
                            setData({
                              ...data,
                              pincode_assignments: selectedPincodes,
                            });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                          size="6"
                        >
                          {availablePincodes.map((pincode) => (
                            <option
                              key={pincode.pincode}
                              value={pincode.pincode}
                              disabled={!pincode.is_available}
                              className={
                                pincode.is_available ? "" : "text-gray-400"
                              }
                            >
                              {pincode.pincode} - {pincode.city},{" "}
                              {pincode.state}
                              {!pincode.is_available && " (Already Assigned)"}
                            </option>
                          ))}
                        </select>

                        <div className="text-xs text-gray-500 mt-2">
                          Hold Ctrl/Cmd to select multiple pincodes. Only
                          available pincodes can be selected.
                        </div>

                        {/* Selected pincodes summary */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Selected Pincodes (
                              {data.pincode_assignments.length})
                            </h4>
                            {data.pincode_assignments.length > 0 && (
                              <span className="text-xs text-gray-500">
                                Click any pincode to deselect
                              </span>
                            )}
                          </div>

                          {data.pincode_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {data.pincode_assignments.map(
                                (assignment, index) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                  >
                                    <span className="font-semibold">
                                      {assignment.pincode}
                                    </span>
                                    <span className="mx-1 text-blue-600">
                                      •
                                    </span>
                                    <span className="text-blue-700">
                                      {assignment.city}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setData({
                                          ...data,
                                          pincode_assignments:
                                            data.pincode_assignments.filter(
                                              (_, i) => i !== index
                                            ),
                                        });
                                      }}
                                      className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                      title="Remove pincode"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="text-gray-400 mb-2">
                                <svg
                                  className="mx-auto h-6 w-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-500">
                                No pincodes selected
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Click on available pincodes above to select them
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-3">
                          <svg
                            className="mx-auto h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          No pincodes available
                        </h3>
                        <p className="text-sm text-gray-500">
                          The parent zonal warehouse doesn&apos;t have any zones
                          assigned, or those zones don&apos;t have pincodes
                          configured.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-3">
                      <svg
                        className="mx-auto h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Select Parent Warehouse First
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a zonal warehouse above to see available pincodes
                      for this division warehouse.
                    </p>
                  </div>
                )}

                {data.type === "division" &&
                  data.pincode_assignments.length === 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex">
                        <div className="shrink-0">
                          <svg
                            className="h-4 w-4 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-2">
                          <p className="text-xs text-red-800">
                            Please select at least one pincode for division
                            warehouses
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input
              type="text"
              value={data.pincode}
              onChange={(e) => setData({ ...data, pincode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pincode"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter warehouse address"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={
              !data.name.trim() ||
              (data.type === "zonal" && data.zone_ids.length === 0) ||
              (data.type === "division" &&
                data.pincode_assignments.length === 0) ||
              !["zonal", "division"].includes(data.type)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isEditing ? "Update Warehouse" : "Create Warehouse"}
          </button>
        </div>
      </div>
    </div>
  );
};


// PropTypes for WarehouseModal component
WarehouseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    zone_ids: PropTypes.arrayOf(PropTypes.number),
    pincode: PropTypes.string,
    address: PropTypes.string,
    warehouse_assignments: PropTypes.array,
    parent_warehouse_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    pincode_assignments: PropTypes.arrayOf(
      PropTypes.shape({
        pincode: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
      })
    ),
  }).isRequired,
  setData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ).isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      type: PropTypes.string,
    })
  ).isRequired,
  isEditing: PropTypes.bool.isRequired,
};

export default WarehouseManagement;
