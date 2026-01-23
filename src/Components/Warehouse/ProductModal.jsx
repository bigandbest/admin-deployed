import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const STEPS = [
  { id: "basic", title: "Select Product", description: "Choose product & configure variants" },
  { id: "zonal", title: "Zonal Warehouses", description: "Assign to zonal warehouses" },
  {
    id: "division",
    title: "Division Warehouses",
    description: "Assign to division warehouses",
  },
  {
    id: "pricing",
    title: "Review",
    description: "Review assignments",
  },
];

const ProductModal = ({
  isOpen,
  onClose,
  data,
  setData,
  onSubmit,
  warehouses,
  zones = [],
  isEditing,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState({});
  const [productVariants, setProductVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantStockConfig, setVariantStockConfig] = useState({});
  const [existingStock, setExistingStock] = useState({});
  const [loadingExistingStock, setLoadingExistingStock] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  // Aggregate total stock across all warehouses
  const totalStockInfo = useMemo(() => {
    const info = {
      base: 0,
      variants: {}
    };

    Object.values(existingStock).forEach(whStock => {
      info.base += (whStock.baseStock || 0);
      if (whStock.variantStock) {
        Object.entries(whStock.variantStock).forEach(([vId, qty]) => {
          info.variants[vId] = (info.variants[vId] || 0) + (qty || 0);
        });
      }
    });

    return info;
  }, [existingStock]);

  // Sync existing stock into warehouse_assignments for editing
  useEffect(() => {
    if (isEditing && Object.keys(existingStock).length > 0 && !hasSynced && data.selectedProductId) {
      const initialAssignments = [];
      Object.entries(existingStock).forEach(([whId, whData]) => {
        const warehouseId = parseInt(whId);

        // Add base stock if any
        if (whData.baseStock > 0) {
          initialAssignments.push({
            warehouse_id: warehouseId,
            stock_quantity: whData.baseStock,
            variant_id: null
          });
        }

        // Add variant stock
        if (whData.variantStock) {
          Object.entries(whData.variantStock).forEach(([vId, qty]) => {
            if (qty > 0) {
              initialAssignments.push({
                warehouse_id: warehouseId,
                stock_quantity: qty,
                variant_id: vId
              });
            }
          });
        }
      });

      if (initialAssignments.length > 0) {
        console.log("♻️ Syncing existing stock to assignments:", initialAssignments);
        setData(prev => ({ ...prev, warehouse_assignments: initialAssignments }));
      }
      setHasSynced(true);
    }
  }, [existingStock, isEditing, hasSynced, data.selectedProductId, setData]);

  // Fetch existing stock for all warehouses when editing
  useEffect(() => {
    const fetchExistingStock = async () => {
      if (!isEditing || !data.selectedProductId || !warehouses.length) {
        setExistingStock({});
        return;
      }

      setLoadingExistingStock(true);
      try {
        console.log("🔍 Fetching existing stock for product:", data.selectedProductId);

        // Fetch stock from each warehouse
        const stockPromises = warehouses.map(async (warehouse) => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/warehouses/${warehouse.id}/products`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                }
              }
            );

            const warehouseProducts = response.data.products || response.data.data || [];
            if (response.data.success && warehouseProducts.length > 0) {
              // Find this product in the warehouse
              const productInWarehouse = warehouseProducts.find(
                p => p.product_id === data.selectedProductId || p.id === data.selectedProductId
              );

              if (productInWarehouse) {
                return {
                  warehouseId: warehouse.id,
                  stock: productInWarehouse.base_stock?.stock_quantity || productInWarehouse.stock_quantity || 0,
                  variantStock: productInWarehouse.variant_stock || {}
                };
              }
            }
            return null;
          } catch (error) {
            console.error(`Error fetching stock for warehouse ${warehouse.id}:`, error);
            return null;
          }
        });

        const results = await Promise.all(stockPromises);
        const stockMap = {};

        results.forEach(result => {
          if (result) {
            stockMap[result.warehouseId] = {
              baseStock: result.stock,
              variantStock: result.variantStock
            };
          }
        });

        console.log("📊 Existing stock loaded:", stockMap);
        setExistingStock(stockMap);
      } catch (error) {
        console.error("Error fetching existing stock:", error);
      } finally {
        setLoadingExistingStock(false);
      }
    };

    fetchExistingStock();
  }, [isEditing, data.selectedProductId, warehouses, isOpen]);

  // Fetch variants when product is selected
  useEffect(() => {
    const fetchVariants = async () => {
      if (!data.selectedProductId) {
        setProductVariants([]);
        setVariantStockConfig({});
        return;
      }

      // Check if we already have variants in availableProducts
      const currentProduct = data.availableProducts?.find(p => p.id === data.selectedProductId);
      if (currentProduct?.variants && currentProduct.variants.length > 0) {
        setProductVariants(currentProduct.variants);
        const initialConfig = {};
        currentProduct.variants.forEach(variant => {
          initialConfig[variant.id] = {
            enabled: true,
            stock_quantity: variant.stock_qty || 0
          };
        });
        setVariantStockConfig(initialConfig);
        return;
      }

      setLoadingVariants(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/variants/product/${data.selectedProductId}`
        );

        if (response.data.success && response.data.data) {
          const variants = response.data.data;
          setProductVariants(variants);

          // Initialize variant stock config
          const initialConfig = {};
          variants.forEach(variant => {
            initialConfig[variant.id] = {
              enabled: true,
              stock_quantity: variant.stock_qty || 0
            };
          });
          setVariantStockConfig(initialConfig);
        } else {
          setProductVariants([]);
          setVariantStockConfig({});
        }
      } catch (error) {
        console.error("Error fetching variants:", error);
        setProductVariants([]);
        setVariantStockConfig({});
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchVariants();
  }, [data.selectedProductId]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setStepErrors({});
      setHasSynced(false);
      // Do not clear productVariants here as it interferes with fetching
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const assignments = data.warehouse_assignments || [];

  const zonalWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.type === "zonal"),
    [warehouses]
  );

  const divisionWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.type === "division"),
    [warehouses]
  );

  const warehouseMap = useMemo(() => {
    const map = new Map();
    warehouses.forEach((warehouse) => {
      map.set(warehouse.id, warehouse);
    });
    return map;
  }, [warehouses]);

  const divisionsByParent = useMemo(() => {
    const grouped = new Map();
    divisionWarehouses.forEach((division) => {
      const parentId = division.parent_warehouse_id;
      if (!grouped.has(parentId)) {
        grouped.set(parentId, []);
      }
      grouped.get(parentId).push(division);
    });
    return grouped;
  }, [divisionWarehouses]);

  const zonalAssignmentCount = assignments.filter((assignment) => {
    const warehouse = warehouseMap.get(assignment.warehouse_id);
    return (
      warehouse?.type === "zonal" &&
      Number.parseInt(assignment.stock_quantity, 10) > 0
    );
  }).length;

  const totalAssignedWarehouses = assignments.filter(
    (assignment) => Number.parseInt(assignment.stock_quantity, 10) > 0
  ).length;

  const updateAssignment = (warehouseId, value, variantId = null) => {
    const numericValue =
      value === "" ? "" : Number.parseInt(value, 10) >= 0
        ? Number.parseInt(value, 10)
        : "";

    const currentAssignments = data.warehouse_assignments || [];
    const existingIndex = currentAssignments.findIndex(
      (assignment) =>
        assignment.warehouse_id === warehouseId &&
        (assignment.variant_id || null) === variantId
    );

    if (numericValue === "" || numericValue <= 0) {
      if (existingIndex === -1) return;
      const filtered = currentAssignments.filter(
        (assignment) => !(assignment.warehouse_id === warehouseId && (assignment.variant_id || null) === variantId)
      );
      setData({ ...data, warehouse_assignments: filtered });
      return;
    }

    const newAssignment = {
      warehouse_id: warehouseId,
      stock_quantity: numericValue,
      variant_id: variantId
    };

    if (existingIndex === -1) {
      setData({
        ...data,
        warehouse_assignments: [...currentAssignments, newAssignment],
      });
    } else {
      const updatedAssignments = [...currentAssignments];
      updatedAssignments[existingIndex] = newAssignment;
      setData({ ...data, warehouse_assignments: updatedAssignments });
    }
  };

  const clearAssignmentsByType = (type) => {
    const filtered = assignments.filter((assignment) => {
      const warehouse = warehouseMap.get(assignment.warehouse_id);
      return warehouse?.type !== type;
    });
    setData({ ...data, warehouse_assignments: filtered });
  };

  const getAssignedStock = (warehouseId, variantId = null) => {
    const assignment = assignments.find(
      (item) => item.warehouse_id === warehouseId && (item.variant_id || null) === variantId
    );
    return assignment ? assignment.stock_quantity.toString() : "";
  };

  const toggleVariant = (variantId) => {
    setVariantStockConfig(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        enabled: !prev[variantId]?.enabled
      }
    }));
  };

  const validateStep = (stepIndex) => {
    let errorMessage = "";

    switch (STEPS[stepIndex].id) {
      case "basic":
        if (!data.selectedProductId) {
          errorMessage = "Please select a product";
        } else if (!data.delivery_type) {
          errorMessage = "Select a delivery type";
        }
        break;
      case "zonal":
        if (
          data.delivery_type === "nationwide" &&
          zonalAssignmentCount === 0
        ) {
          errorMessage =
            "Nationwide products should have at least one zonal assignment";
        }
        break;
      case "division":
        if (totalAssignedWarehouses === 0) {
          errorMessage =
            "Assign stock to at least one zonal or division warehouse";
        }
        break;
      case "pricing":
        if (totalAssignedWarehouses === 0) {
          errorMessage =
            "Assign stock to at least one warehouse before saving";
        }
        break;
      default:
        break;
    }

    setStepErrors((prev) => {
      const updated = { ...prev };
      if (errorMessage) {
        updated[STEPS[stepIndex].id] = errorMessage;
      } else {
        delete updated[STEPS[stepIndex].id];
      }
      return updated;
    });

    return !errorMessage;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleFinalSubmit = () => {
    console.log("🟢 ProductModal handleFinalSubmit called!");
    console.log("Current step:", currentStep);
    console.log("Data:", data);

    if (validateStep(currentStep)) {
      console.log("✅ Validation passed, calling onSubmit");
      onSubmit();
    } else {
      console.log("❌ Validation failed");
    }
  };

  const renderVariantStockInputs = (warehouseId) => {
    const currentStock = existingStock[warehouseId];

    if (productVariants.length === 0) {
      // No variants - show single stock input
      return (
        <div>
          <input
            type="number"
            min="0"
            value={getAssignedStock(warehouseId)}
            onChange={(event) =>
              updateAssignment(warehouseId, event.target.value)
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Stock quantity"
          />
          {isEditing && currentStock && (
            <p className="text-xs text-gray-500 mt-1">
              Current stock: <span className="font-semibold text-blue-600">{currentStock.baseStock}</span> units
            </p>
          )}
        </div>
      );
    }

    // Has variants - show variant stock inputs
    return (
      <div className="space-y-2 mt-2">
        <p className="text-xs font-medium text-gray-600">Stock per variant:</p>
        {productVariants.map(variant => {
          const isEnabled = variantStockConfig[variant.id]?.enabled !== false;
          const variantCurrentStock = currentStock?.variantStock?.[variant.id];

          return (
            <div key={variant.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggleVariant(variant.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {variant.title || variant.variant_name}
                </p>
                <p className="text-xs text-gray-500">
                  {variant.packaging_details || variant.variant_weight} • ₹{variant.price || variant.variant_price}
                  {isEditing && variantCurrentStock !== undefined && (
                    <span className="ml-2 text-blue-600 font-semibold">
                      • Current: {variantCurrentStock} units
                    </span>
                  )}
                </p>
              </div>
              {isEnabled && (
                <input
                  type="number"
                  min="0"
                  value={getAssignedStock(warehouseId, variant.id)}
                  onChange={(event) =>
                    updateAssignment(warehouseId, event.target.value, variant.id)
                  }
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Stock"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "basic":
        return (
          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product *
              </label>
              <select
                value={data.selectedProductId || ""}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const selectedProduct = data.availableProducts?.find(p => p.id === selectedId);
                  setData({
                    ...data,
                    selectedProductId: selectedId,
                    name: selectedProduct?.name || "",
                    price: selectedProduct?.price || "",
                  });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a product to add to warehouses...</option>
                {data.availableProducts?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₹{product.price}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select an existing product to assign to warehouses
              </p>
            </div>

            {/* Show variants if product has them */}
            {loadingVariants && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">Loading product variants...</p>
              </div>
            )}

            {productVariants.length > 0 && !loadingVariants && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Product Variants ({productVariants.length})
                </h4>
                <div className="space-y-2">
                  {productVariants.map(variant => (
                    <div key={variant.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <p className="font-medium text-gray-900">{variant.title || variant.variant_name}</p>
                        <p className="text-sm text-gray-600">
                          {variant.packaging_details || variant.variant_weight ? `${variant.packaging_details || variant.variant_weight} • ` : ""}
                          ₹{variant.price || variant.variant_price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Current Stock</p>
                        <p className="font-semibold text-gray-900">{totalStockInfo.variants[variant.id] || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 You can set different stock quantities for each variant in each warehouse
                </p>
              </div>
            )}

            {!loadingVariants && productVariants.length === 0 && data.selectedProductId && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  This product has no variants. You'll set stock quantity per warehouse in the next steps.
                </p>
              </div>
            )}

            {/* Stock Quantity - only show if no variants */}
            {productVariants.length === 0 && data.selectedProductId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={data.initial_stock}
                  onChange={(event) =>
                    setData({ ...data, initial_stock: event.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter initial stock quantity"
                />
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  Total Current Stock across warehouses: {totalStockInfo.base} units
                </p>
              </div>
            )}

            {/* Optional: Min Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Threshold (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={data.minimum_threshold}
                onChange={(event) =>
                  setData({ ...data, minimum_threshold: event.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alert when stock falls below this level
              </p>
            </div>
          </div>
        );
      case "zonal":
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Zonal Warehouses</h4>
                <p className="text-sm text-gray-600">
                  Assign stock to zonal warehouses. {productVariants.length > 0 && "Set stock for each variant separately."}
                </p>
              </div>
              {zonalAssignmentCount > 0 && (
                <button
                  type="button"
                  onClick={() => clearAssignmentsByType("zonal")}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Clear zonal assignments
                </button>
              )}
            </div>

            {zonalWarehouses.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-dashed rounded-lg text-center text-gray-500">
                No zonal warehouses available. Create a zonal warehouse first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zonalWarehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className="border rounded-lg p-4 shadow-sm bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {warehouse.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {warehouse.pincode || "No pincode"}
                        </p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        Zonal
                      </span>
                    </div>
                    {renderVariantStockInputs(warehouse.id)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "division":
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">
                  Division Fallback
                </h4>
                <p className="text-sm text-gray-600">
                  Assign stock to specific divisions. {productVariants.length > 0 && "Configure variant stock for each division."}
                </p>
              </div>
              {totalAssignedWarehouses > 0 && (
                <button
                  type="button"
                  onClick={() => clearAssignmentsByType("division")}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Clear division assignments
                </button>
              )}
            </div>

            {zonalWarehouses.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-dashed rounded-lg text-center text-gray-500">
                Create at least one zonal warehouse to configure divisions.
              </div>
            ) : (
              zonalWarehouses.map((zonal) => {
                const divisions = divisionsByParent.get(zonal.id) || [];
                return (
                  <div
                    key={zonal.id}
                    className="border rounded-lg p-4 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {zonal.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {divisions.length} division(s)
                        </p>
                      </div>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        Division Coverage
                      </span>
                    </div>
                    {divisions.length === 0 ? (
                      <div className="p-3 bg-gray-50 rounded text-sm text-gray-500">
                        No division warehouses under this zone yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {divisions.map((division) => (
                          <div
                            key={division.id}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-900">
                                {division.name}
                              </p>
                              <span className="text-xs text-gray-500">
                                {division.pincode || "No pincode"}
                              </span>
                            </div>
                            {renderVariantStockInputs(division.id)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );
      case "pricing":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Delivery Type:</span>{" "}
                {data.delivery_type === "nationwide"
                  ? "Nationwide"
                  : "Zone-specific"}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-semibold">Assigned warehouses:</span>{" "}
                {totalAssignedWarehouses}
              </p>
              {productVariants.length > 0 && (
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-semibold">Variants:</span>{" "}
                  {productVariants.length}
                </p>
              )}
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-900 mb-3">
                Warehouse Summary
              </h4>
              {assignments.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No warehouses assigned yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {assignments.map((assignment) => {
                    const warehouse = warehouseMap.get(assignment.warehouse_id);
                    if (!warehouse) return null;

                    const variant = assignment.variant_id
                      ? productVariants.find((v) => v.id === assignment.variant_id)
                      : null;

                    return (
                      <div
                        key={`${assignment.warehouse_id}-${assignment.variant_id || "base"
                          }`}
                        className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {warehouse.name}
                            {variant && (
                              <span className="text-blue-600 ml-2">
                                • {variant.title || variant.variant_name}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {warehouse.type === "zonal"
                              ? "Zonal coverage"
                              : "Division fallback"}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {assignment.stock_quantity} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {isEditing ? "Edit Product" : "Add Product to Warehouses"}
            </h3>
            <p className="text-sm text-gray-600">
              Step {currentStep + 1} of {STEPS.length} •{" "}
              {STEPS[currentStep].description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm font-semibold ${index === currentStep
                  ? "bg-blue-600 text-white border-blue-600"
                  : index < currentStep
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white text-gray-400 border-gray-200"
                  }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${index < currentStep ? "bg-blue-500" : "bg-gray-200"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {stepErrors[STEPS[currentStep].id] && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {stepErrors[STEPS[currentStep].id]}
          </div>
        )}

        {renderStepContent()}

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-8 pt-4 border-t">
          <div className="text-xs text-gray-500">
            Zones configured: {zones.length} • Zonal warehouses:{" "}
            {zonalWarehouses.length} • Division warehouses:{" "}
            {divisionWarehouses.length}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={totalAssignedWarehouses === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isEditing ? "Update Product" : "Add to Warehouses"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    delivery_type: PropTypes.string,
    description: PropTypes.string,
    selectedProductId: PropTypes.string,
    availableProducts: PropTypes.array,
    initial_stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minimum_threshold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    warehouse_assignments: PropTypes.arrayOf(
      PropTypes.shape({
        warehouse_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        stock_quantity: PropTypes.number,
        variant_id: PropTypes.string,
      })
    ),
  }).isRequired,
  setData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      type: PropTypes.string,
      parent_warehouse_id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      pincode: PropTypes.string,
    })
  ).isRequired,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ),
  isEditing: PropTypes.bool,
};

export default ProductModal;
