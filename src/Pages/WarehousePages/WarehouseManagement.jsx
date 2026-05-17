import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductModal from "../../Components/Warehouse/ProductModal";
import ConfirmModal from "../../Components/Warehouse/ConfirmModal";
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getAllZones,
  getWarehouseHierarchy,
  getAdminWarehouseProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  addProductToWarehouse,
  getZonalWarehouseAvailablePincodes,
  getZonalWarehouseAvailablePincodesDirect,
} from "../../utils/supabaseApi";
import { getZoneProductVisibility } from "../../utils/zoneApi";
import { DeleteButton, EditButton } from "../../Components/Warehouse/ActionButtons";

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

  // Product pagination
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [productWarehouseFilter, setProductWarehouseFilter] = useState("all");
  const PRODUCT_PAGE_SIZE = 20;

  // Warehouse pagination
  const [warehousePage, setWarehousePage] = useState(1);
  const WAREHOUSE_PAGE_SIZE = 15;

  // Modal states
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false, type: "delete", title: "", message: "", onConfirm: null,
  });
  const showConfirm = ({ type, title, message, onConfirm }) =>
    setConfirmModal({ show: true, type, title, message, onConfirm });
  const hideConfirm = () =>
    setConfirmModal({ show: false, type: "delete", title: "", message: "", onConfirm: null });

  // Secure warehouse deletion state
  const [deleteWarehouseModal, setDeleteWarehouseModal] = useState({
    show: false,
    warehouseId: null,
    warehouseName: "",
    confirmText: "",
    step: 1, // 1: warning, 2: confirm name, 3: processing
    loading: false,
  });

  // Form data
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    type: "zonal",
    pincode: "",
    address: "",
    latitude: "",
    longitude: "",
    zone_ids: [],
    parent_warehouse_id: null,
    pincode_assignments: [], // For division warehouses
    seller_ids: [], // For division warehouses
    rider_ids: [], // For division warehouses
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

  const fetchProducts = useCallback(async (page = 1, search = "", warehouseId = "all") => {
    try {
      const result = await getAdminWarehouseProducts({
        page,
        limit: PRODUCT_PAGE_SIZE,
        search,
        warehouse_id: warehouseId !== "all" ? warehouseId : null,
      });
      if (result.success) {
        const productsList = result.products || result.data || [];
        setProducts(productsList);
        setProductTotalPages(result.totalPages || 1);
        setProductTotal(result.total || 0);
        setProductForm(prev => ({ ...prev, availableProducts: productsList }));
      } else {
        setError("Failed to fetch products: " + result.error);
      }
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    }
  }, [PRODUCT_PAGE_SIZE]);

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
      toast.error("Invalid warehouse type. Only zonal and division warehouses are allowed.");
      return;
    }

    // Validate division warehouses must have a parent
    if (
      warehouseForm.type === "division" &&
      !warehouseForm.parent_warehouse_id
    ) {
      toast.error("Division warehouses must have a parent zonal warehouse.");
      return;
    }

    try {
      if (editingWarehouse) {
        const result = await updateWarehouse(
          editingWarehouse.id,
          warehouseForm
        );
        if (!result.success) {
          toast.error("Failed to update warehouse: " + result.error);
          return;
        }
        toast.success("Warehouse updated successfully!");
      } else {
        const result = await createWarehouse(warehouseForm);
        if (!result.success) {
          toast.error("Failed to create warehouse: " + result.error);
          return;
        }
        toast.success("Warehouse created successfully!");
      }

      setShowWarehouseModal(false);
      setEditingWarehouse(null);
      setWarehouseForm({
        name: "",
        type: "zonal",
        pincode: "",
        address: "",
        latitude: "",
        longitude: "",
        zone_ids: [],
        parent_warehouse_id: null,
        pincode_assignments: [],
        seller_ids: [],
        rider_ids: [],
      });

      await fetchWarehouses();
      await fetchWarehouseHierarchy();
      setError("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save warehouse");
      console.error(err);
    }
  };

  const handleWarehouseDelete = (warehouseId) => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    setDeleteWarehouseModal({
      show: true,
      warehouseId,
      warehouseName: wh?.name || "Unknown",
      confirmText: "",
      step: 1,
      loading: false,
    });
  };

  const handleSecureWarehouseDelete = async () => {
    const { warehouseId, warehouseName, confirmText } = deleteWarehouseModal;

    // Step 2: Validate name confirmation
    if (deleteWarehouseModal.step === 2) {
      if (confirmText !== warehouseName) {
        toast.error("Warehouse name does not match. Please try again.");
        return;
      }

      // Move to step 3 (processing)
      setDeleteWarehouseModal((prev) => ({
        ...prev,
        step: 3,
        loading: true,
      }));

      const toastId = toast.loading("🔄 Starting deletion process...");

      try {
        // Step 1: Clear inventory
        try {
          toast.update(toastId, {
            render: "📦 Clearing inventory records...",
            type: "info",
            isLoading: true,
          });

          const clearResponse = await axios.delete(
            `${API_BASE_URL}/warehouses/${warehouseId}/inventory/clear`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
              timeout: 30000,
            }
          );

          if (clearResponse.data.success) {
            toast.update(toastId, {
              render: `✓ Cleared ${clearResponse.data.message}`,
              type: "success",
              isLoading: false,
              autoClose: 2000,
            });
          }
        } catch (clearErr) {
          console.error("Clear inventory error:", clearErr);
          toast.update(toastId, {
            render: `⚠️ Inventory clear: ${clearErr.response?.data?.error || clearErr.message}`,
            type: "warning",
            isLoading: false,
            autoClose: 3000,
          });
          // Continue with deletion even if clear fails
        }

        // Step 2: Delete warehouse
        toast.loading("🗑️ Deleting warehouse...");
        const deleteResponse = await axios.delete(
          `${API_BASE_URL}/warehouses/${warehouseId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
            timeout: 30000,
          }
        );

        if (deleteResponse.data.success) {
          toast.dismiss();
          toast.success("✅ Warehouse deleted successfully!");

          // Close modal immediately
          setDeleteWarehouseModal({
            show: false,
            warehouseId: null,
            warehouseName: "",
            confirmText: "",
            step: 1,
            loading: false,
          });
          setError("");

          // Refresh in background
          setTimeout(() => {
            fetchWarehouses();
          }, 500);
        } else {
          throw new Error(deleteResponse.data.error || "Delete failed");
        }
      } catch (err) {
        console.error("Delete warehouse error:", err);
        toast.dismiss();

        const errorMsg = err.response?.data?.error || err.message || "Failed to delete warehouse";
        toast.error(`❌ Error: ${errorMsg}`);

        setDeleteWarehouseModal((prev) => ({
          ...prev,
          step: 2,
          loading: false,
        }));
      }
    }
  };

  const closeDeleteModal = () => {
    setDeleteWarehouseModal({
      show: false,
      warehouseId: null,
      warehouseName: "",
      confirmText: "",
      step: 1,
      loading: false,
    });
  };

  // Handle product operations
  const handleProductSubmit = async () => {
    try {
      // Handle product assignment (both new and editing)
      if (productForm.selectedProductId) {
        // Validate warehouse assignments
        if (!productForm.warehouse_assignments || productForm.warehouse_assignments.length === 0) {
          toast.error("Please assign stock to at least one warehouse");
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
              const minThreshold = typeof assignment === 'object' ? (assignment.minimum_threshold || productForm.minimum_threshold) : productForm.minimum_threshold;

              if (warehouseId && (stockQuantity !== undefined && stockQuantity !== null)) {
                if (variantId) {
                  // Update variant stock in warehouse (not add, just update the quantity)
                  console.log(`Updating variant ${variantId} stock in warehouse ${warehouseId} to ${stockQuantity}`);
                  try {
                    await axios.put(
                      `${API_BASE_URL}/warehouses/${warehouseId}/products/${productForm.selectedProductId}`,
                      {
                        variant_id: variantId,
                        stock_quantity: stockQuantity,
                        minimum_threshold: minThreshold || 10,
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
                      minThreshold || 10,
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
                        minimum_threshold: minThreshold || 10,
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
                      minThreshold || 10,
                      productForm.cost_per_unit || 0
                    );
                  }
                }
              }
            }
          } catch (warehouseError) {
            console.error(`Failed to add product to warehouse ${warehouseId}:`, warehouseError);
            toast.error(`Failed to add product to some warehouses: ${warehouseError.response?.data?.error || warehouseError.message}`);
          }
        }

        setShowProductModal(false);
        setEditingProduct(null);

        // Refresh data to show updated quantities
        fetchProducts();
        fetchWarehouses();
        fetchWarehouseHierarchy();

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
        toast.success("Product saved successfully!");
        setError("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
      console.error(err);
    }
  };

  const handleProductDelete = (productId) => {
    const prod = products.find((p) => p.id === productId);
    showConfirm({
      type: "delete",
      title: "Delete Product",
      message: `Are you sure you want to delete "${prod?.name || "this product"}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const result = await deleteProduct(productId);
          if (result.success) {
            await fetchProducts();
            refreshZoneVisibility();
            toast.success("Product deleted successfully!");
            setError("");
          } else {
            toast.error("Failed to delete product: " + result.error);
          }
        } catch (err) {
          toast.error("Failed to delete product");
          console.error(err);
        }
      },
    });
  };

  // Warehouse submit with confirmation when editing
  const handleWarehouseSubmitWithConfirm = () => {
    if (editingWarehouse) {
      showConfirm({
        type: "update",
        title: "Update Warehouse",
        message: `Are you sure you want to update "${editingWarehouse.name}"?`,
        onConfirm: handleWarehouseSubmit,
      });
    } else {
      handleWarehouseSubmit();
    }
  };

  // Load initial data — fetchProducts is intentionally excluded here:
  // the [productPage, productSearch, productWarehouseFilter] effect below handles it
  // so we avoid a double API call on mount.
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchWarehouses(),
        fetchZones(),
        fetchWarehouseHierarchy(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchWarehouses, fetchZones, fetchWarehouseHierarchy]);

  // Re-fetch products when page, search, or warehouse filter changes
  useEffect(() => {
    fetchProducts(productPage, productSearch, productWarehouseFilter);
  }, [productPage, productSearch, productWarehouseFilter, fetchProducts]);

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
    total: productTotal,
    nationwide: products.filter((p) => p.delivery_type === "nationwide").length,
    zonal: products.filter((p) => p.delivery_type === "zonal").length,
  });

  const warehouseStats = getWarehouseStats();
  const productStats = getProductStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
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
          page={warehousePage}
          pageSize={WAREHOUSE_PAGE_SIZE}
          onPageChange={setWarehousePage}
          onEdit={(warehouse) => {
            setEditingWarehouse(warehouse);
            setWarehouseForm({
              name: warehouse.name || "",
              type: warehouse.type || "zonal",
              pincode: warehouse.pincode || "",
              address: warehouse.address || "",
              latitude: warehouse.latitude != null ? String(warehouse.latitude) : "",
              longitude: warehouse.longitude != null ? String(warehouse.longitude) : "",
              zone_ids: warehouse.zones ? warehouse.zones.map((z) => z.id) : [],
              pincode_assignments: warehouse.pincodes
                ? warehouse.pincodes.map((p) => ({
                  pincode: p.pincode,
                  city: p.city || "",
                  state: p.state || "",
                }))
                : [],
              parent_warehouse_id: warehouse.parent_warehouse_id || null,
              seller_ids: warehouse.sellers ? warehouse.sellers.map((s) => s.id) : [],
              rider_ids: warehouse.riders ? warehouse.riders.map((r) => r.id) : [],
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
              latitude: "",
              longitude: "",
              zone_ids: [],
              parent_warehouse_id: null,
              pincode_assignments: [],
              seller_ids: [],
              rider_ids: [],
            });
            setShowWarehouseModal(true);
          }}
        />
      )}

      {activeTab === "products" && (
        <ProductsTab
          products={products}
          warehouses={warehouses}
          page={productPage}
          totalPages={productTotalPages}
          onPageChange={setProductPage}
          searchValue={productSearch}
          onSearchChange={(v) => { setProductSearch(v); setProductPage(1); }}
          warehouseFilter={productWarehouseFilter}
          onWarehouseFilterChange={(v) => { setProductWarehouseFilter(v); setProductPage(1); }}
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
              seller_id: product.seller_id || null,
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
          onSubmit={handleWarehouseSubmitWithConfirm}
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

      {/* Global Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={hideConfirm}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Secure Warehouse Deletion Modal */}
      {deleteWarehouseModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            {deleteWarehouseModal.step === 1 && (
              <>
                <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">⚠️</div>
                    <div>
                      <h2 className="text-xl font-bold text-red-700">
                        Delete Warehouse?
                      </h2>
                      <p className="text-sm text-red-600 mt-1">
                        This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Warehouse:</strong> {deleteWarehouseModal.warehouseName}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                      <li>✓ All inventory records will be cleared</li>
                      <li>✓ The warehouse will be permanently deleted</li>
                      <li>✓ You'll need to confirm the warehouse name</li>
                    </ul>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDeleteWarehouseModal((prev) => ({
                        ...prev,
                        step: 2,
                      }));
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {deleteWarehouseModal.step === 2 && (
              <>
                <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                  <h2 className="text-xl font-bold text-red-700">
                    Confirm Warehouse Name
                  </h2>
                  <p className="text-sm text-red-600 mt-1">
                    Type the warehouse name to confirm deletion
                  </p>
                </div>
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse Name to Delete
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Enter: <strong>{deleteWarehouseModal.warehouseName}</strong>
                    </p>
                    <input
                      type="text"
                      value={deleteWarehouseModal.confirmText}
                      onChange={(e) => {
                        setDeleteWarehouseModal((prev) => ({
                          ...prev,
                          confirmText: e.target.value,
                        }));
                      }}
                      placeholder="Type warehouse name here..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      ℹ️ This prevents accidental deletion. The name must match
                      exactly.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteWarehouseModal((prev) => ({
                        ...prev,
                        step: 1,
                        confirmText: "",
                      }));
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSecureWarehouseDelete}
                    disabled={
                      deleteWarehouseModal.confirmText !==
                        deleteWarehouseModal.warehouseName || deleteWarehouseModal.loading
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Delete Warehouse
                  </button>
                </div>
              </>
            )}

            {deleteWarehouseModal.step === 3 && (
              <>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-900">
                    Processing Deletion...
                  </h2>
                </div>
                <div className="px-6 py-8 flex flex-col items-center justify-center">
                  <div className="animate-spin mb-4">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-700 text-center text-sm font-medium mb-2">
                    Step 1: Clearing inventory records...
                  </p>
                  <p className="text-gray-500 text-center text-xs">
                    Step 2: Deleting warehouse (this may take a moment)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
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

// Reusable Pagination Controls
const PaginationBar = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-600">
        Page <span className="font-medium">{page}</span> of{" "}
        <span className="font-medium">{totalPages}</span>
      </p>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === "..." ? (
              <span key={`e-${idx}`} className="px-2 py-1 text-sm text-gray-500">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-3 py-1 text-sm border rounded ${
                  p === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
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
  page,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(warehouses.length / pageSize);
  const pagedWarehouses = warehouses.slice((page - 1) * pageSize, page * pageSize);

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
                {pagedWarehouses.map((warehouse) => (
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
                      {warehouse.type === "division" && warehouse.pincodes && warehouse.pincodes.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {warehouse.pincodes.length} Pincodes
                          </div>
                          <div className="text-xs text-gray-500">
                            {Array.from(new Set(warehouse.pincodes.map(p => p.city).filter(Boolean))).join(", ")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {Array.from(new Set(warehouse.pincodes.map(p => p.state).filter(Boolean))).join(", ")}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {warehouse.pincode && <div>📍 {warehouse.pincode}</div>}
                          {warehouse.address && (
                            <div className="text-gray-500">
                              {warehouse.address}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <EditButton
                          onConfirm={() => onEdit(warehouse)}
                          label="Edit"
                        />

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
        <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
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
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

PaginationBar.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
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
  page,
  totalPages,
  onPageChange,
  searchValue,
  onSearchChange,
  warehouseFilter,
  onWarehouseFilterChange,
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
              Warehouse products only. Drop-ship products are excluded.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            {/* Search */}
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            {/* Warehouse filter */}
            <select
              value={warehouseFilter}
              onChange={(e) => onWarehouseFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
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

      {/* Only show warehouse products — dropship products are excluded */}
      {(() => {
        const warehouseProducts = products.filter(p => p.delivery_type !== "dropship");
        return warehouseProducts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No warehouse products found
          </h3>
          <p className="text-gray-500 mb-4">
            Add products to start managing your inventory. Drop-ship products are not shown here.
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
              {warehouseProducts.map((product) => (
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
                      <EditButton
                        onConfirm={() => onEdit(product)}
                        label="Edit"
                      />
                      <DeleteButton
                        onConfirm={() => onDelete(product.id)}
                        title="Delete Product"
                        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      })()}
      <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
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
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  searchValue: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
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
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [availableSellers, setAvailableSellers] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [sellerSearch, setSellerSearch] = useState("");
  const [riderSearch, setRiderSearch] = useState("");

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

  // Fetch available sellers and riders for division warehouses
  useEffect(() => {
    const fetchSellersAndRiders = async () => {
      if (data.type === "division") {
        try {
          const [sellersRes, ridersRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/seller/available-list`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            }).catch(() => ({ data: { data: [] } })),
            axios.get(`${API_BASE_URL}/riders/available-list`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            }).catch(() => ({ data: { data: [] } })),
          ]);
          setAvailableSellers(sellersRes.data?.data || []);
          setAvailableRiders(ridersRes.data?.data || []);
        } catch (err) {
          console.error("Error fetching sellers/riders:", err);
        }
      }
    };
    fetchSellersAndRiders();
  }, [data.type]);

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
    <div className="fixed inset-0 bg-gray-600/40 flex items-center justify-center z-50">
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

                        {/* Search Bar */}
                        <div className="mb-2">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="Search by name, city, pincode..."
                            value={pincodeSearch}
                            onChange={(e) =>
                              setPincodeSearch(e.target.value)
                            }
                          />
                        </div>

                        {/* Pincode dropdown (HIDDEN, kept for structure if needed but replaced by custom UI below) */}
                        <select
                          multiple
                          value={(data.pincode_assignments || []).map((p) => p.pincode)}
                          onChange={() => { }} // Controlled by custom UI
                          className="hidden"
                          size="6"
                        >
                        </select>

                        {/* Filtered List UI */}
                        <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto mb-2">
                          {availablePincodes
                            .filter((p) => {
                              if (!pincodeSearch) return true;
                              const term = pincodeSearch.toLowerCase();
                              return (
                                p.pincode.includes(term) ||
                                p.city?.toLowerCase().includes(term) ||
                                p.state?.toLowerCase().includes(term) ||
                                p.district?.toLowerCase().includes(term) ||
                                p.district?.toLowerCase().includes(term) ||
                                p.location_name?.toLowerCase().includes(term) ||
                                p.village?.toLowerCase().includes(term) ||
                                p.others?.toLowerCase().includes(term)
                              );
                            })
                            .filter(p => !(data.pincode_assignments || []).some(assigned => assigned.pincode === p.pincode)) // Hide already selected
                            .map((pincode) => (
                              <div
                                key={pincode.pincode}
                                onClick={() => {
                                  if (!pincode.is_available) return;
                                  const currentAssignments = data.pincode_assignments || [];
                                  setData({
                                    ...data,
                                    pincode_assignments: [
                                      ...currentAssignments,
                                      {
                                        pincode: pincode.pincode,
                                        city: pincode.city,
                                        state: pincode.state,
                                      }
                                    ]
                                  });
                                }}
                                className={`px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${!pincode.is_available ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {pincode.pincode} - {pincode.city}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {[
                                      pincode.location_name,
                                      pincode.village,
                                      pincode.district,
                                      pincode.others,
                                      pincode.state
                                    ].filter(Boolean).join(", ")}
                                  </div>
                                </div>
                                {!pincode.is_available ? (
                                  <span className="text-xs text-red-500 font-medium">Assigned</span>
                                ) : (
                                  <span className="text-blue-600 text-lg font-bold">+</span>
                                )}
                              </div>
                            ))}
                          {availablePincodes.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">No pincodes found</div>
                          )}
                        </div>



                        {/* Selected pincodes summary */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Selected Pincodes (
                              {(data.pincode_assignments || []).length})
                            </h4>
                            {(data.pincode_assignments || []).length > 0 && (
                              <span className="text-xs text-gray-500">
                                Click any pincode to deselect
                              </span>
                            )}
                          </div>

                          {(data.pincode_assignments || []).length > 0 ? (
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
                  (data.pincode_assignments || []).length === 0 && (
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

          {/* Seller Assignment (Division warehouses only) */}
          {data.type === "division" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🧑‍💼 Assigned Sellers
              </label>
              <div className="border rounded-lg p-3 bg-gray-50">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm mb-2"
                  placeholder="Search sellers by name, email..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                />
                {availableSellers.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto mb-2">
                    {availableSellers
                      .filter((s) => {
                        if (!sellerSearch) return true;
                        const term = sellerSearch.toLowerCase();
                        return (
                          s.business_name?.toLowerCase().includes(term) ||
                          s.user?.name?.toLowerCase().includes(term) ||
                          s.user?.email?.toLowerCase().includes(term)
                        );
                      })
                      .filter(s => !(data.seller_ids || []).includes(s.id))
                      .map((seller) => (
                        <div
                          key={seller.id}
                          onClick={() => setData({ ...data, seller_ids: [...(data.seller_ids || []), seller.id] })}
                          className="px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-blue-50 flex justify-between items-center text-sm"
                        >
                          <div>
                            <div className="font-medium">{seller.business_name || seller.user?.name}</div>
                            <div className="text-xs text-gray-500">{seller.user?.email} • {seller.seller_type}</div>
                          </div>
                          <span className="text-blue-600 text-lg font-bold">+</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">No sellers available. Sellers will appear here once registered.</p>
                )}
                {(data.seller_ids || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.seller_ids.map((sid) => {
                      const seller = availableSellers.find(s => s.id === sid);
                      return (
                        <div key={sid} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <span>{seller?.business_name || seller?.user?.name || `Seller #${sid}`}</span>
                          <button
                            type="button"
                            onClick={() => setData({ ...data, seller_ids: data.seller_ids.filter(id => id !== sid) })}
                            className="ml-2 text-green-600 hover:text-green-800 rounded-full p-0.5"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rider Assignment (Division warehouses only) */}
          {data.type === "division" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚴 Assigned Riders
              </label>
              <div className="border rounded-lg p-3 bg-gray-50">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm mb-2"
                  placeholder="Search riders by name..."
                  value={riderSearch}
                  onChange={(e) => setRiderSearch(e.target.value)}
                />
                {availableRiders.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto mb-2">
                    {availableRiders
                      .filter((r) => {
                        if (!riderSearch) return true;
                        const term = riderSearch.toLowerCase();
                        return (
                          r.user?.name?.toLowerCase().includes(term) ||
                          r.user?.email?.toLowerCase().includes(term) ||
                          r.vehicle_type?.toLowerCase().includes(term)
                        );
                      })
                      .filter(r => !(data.rider_ids || []).includes(r.id))
                      .map((rider) => (
                        <div
                          key={rider.id}
                          onClick={() => setData({ ...data, rider_ids: [...(data.rider_ids || []), rider.id] })}
                          className="px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-blue-50 flex justify-between items-center text-sm"
                        >
                          <div>
                            <div className="font-medium">{rider.user?.name || `Rider #${rider.id}`}</div>
                            <div className="text-xs text-gray-500">{rider.vehicle_type} • {rider.is_available ? '✅ Available' : '⏸ Busy'}</div>
                          </div>
                          <span className="text-blue-600 text-lg font-bold">+</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">No riders available. Riders will appear here once registered.</p>
                )}
                {(data.rider_ids || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.rider_ids.map((rid) => {
                      const rider = availableRiders.find(r => r.id === rid);
                      return (
                        <div key={rid} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          <span>{rider?.user?.name || `Rider #${rid}`}</span>
                          <button
                            type="button"
                            onClick={() => setData({ ...data, rider_ids: data.rider_ids.filter(id => id !== rid) })}
                            className="ml-2 text-orange-600 hover:text-orange-800 rounded-full p-0.5"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      );
                    })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0000001"
                value={data.latitude}
                onChange={(e) => setData({ ...data, latitude: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 28.613939"
              />
              <p className="text-gray-500 text-xs mt-1">
                Used for rider distance/payout calculation
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0000001"
                value={data.longitude}
                onChange={(e) => setData({ ...data, longitude: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 77.209021"
              />
            </div>
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
                (data.pincode_assignments || []).length === 0) ||
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
