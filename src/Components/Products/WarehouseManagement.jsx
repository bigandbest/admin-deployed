import { useState, useEffect } from "react";
import { FaWarehouse, FaMapMarkerAlt, FaExchangeAlt } from "react-icons/fa";

const WarehouseManagement = ({
  product,
  warehouses = [],
  onUpdateMapping,
  onClose,
}) => {
  const [mappingType, setMappingType] = useState(
    product?.warehouse_mapping_type || "nationwide"
  );
  const [primaryWarehouses, setPrimaryWarehouses] = useState(
    product?.primary_warehouses || []
  );
  const [fallbackWarehouses, setFallbackWarehouses] = useState(
    product?.fallback_warehouses || []
  );
  const [enableFallback, setEnableFallback] = useState(
    product?.enable_fallback !== false
  );
  const [notes, setNotes] = useState(product?.warehouse_notes || "");
  const [loading, setLoading] = useState(false);

  // Filter warehouses by type
  const zonalWarehouses = warehouses.filter((w) => w.type === "zonal");
  const divisionWarehouses = warehouses.filter((w) => w.type === "division");

  const handleMappingTypeChange = (newType) => {
    setMappingType(newType);

    // Reset selections when changing type
    if (newType === "nationwide") {
      setPrimaryWarehouses(zonalWarehouses.map((w) => w.id));
      setFallbackWarehouses(divisionWarehouses.map((w) => w.id));
      setEnableFallback(true);
    } else if (newType === "zonal_only") {
      setPrimaryWarehouses([]);
      setFallbackWarehouses([]);
      setEnableFallback(false);
    } else if (newType === "division_only") {
      setPrimaryWarehouses([]);
      setFallbackWarehouses([]);
      setEnableFallback(false);
    } else {
      // Custom or zonal_with_fallback
      setPrimaryWarehouses([]);
      setFallbackWarehouses([]);
    }
  };

  const handlePrimaryWarehouseToggle = (warehouseId) => {
    setPrimaryWarehouses((prev) =>
      prev.includes(warehouseId)
        ? prev.filter((id) => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const handleFallbackWarehouseToggle = (warehouseId) => {
    setFallbackWarehouses((prev) =>
      prev.includes(warehouseId)
        ? prev.filter((id) => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const mappingData = {
        warehouse_mapping_type: mappingType,
        primary_warehouses: primaryWarehouses,
        fallback_warehouses: enableFallback ? fallbackWarehouses : [],
        enable_fallback: enableFallback,
        warehouse_notes: notes,
      };

      await onUpdateMapping(product.id, mappingData);
      onClose();
    } catch (error) {
      console.error("Error updating warehouse mapping:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseName = (id) => {
    const warehouse = warehouses.find((w) => w.id === id);
    return warehouse?.name || `Warehouse ${id}`;
  };

  const getWarehouseType = (id) => {
    const warehouse = warehouses.find((w) => w.id === id);
    return warehouse?.type || "unknown";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
                <FaWarehouse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Warehouse Assignment
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {product?.name || "Product"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Mapping Type Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Warehouse Assignment Strategy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nationwide Option */}
              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  mappingType === "nationwide"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
                onClick={() => handleMappingTypeChange("nationwide")}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400">
                      🌍
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Nationwide
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  All zonal warehouses with division fallback
                </p>
              </div>

              {/* Zonal with Fallback */}
              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  mappingType === "zonal_with_fallback"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
                onClick={() => handleMappingTypeChange("zonal_with_fallback")}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FaExchangeAlt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Zonal + Division
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select zonal and division warehouses
                </p>
              </div>

              {/* Zonal Only */}
              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  mappingType === "zonal_only"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
                onClick={() => handleMappingTypeChange("zonal_only")}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400">
                      🏪
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Zonal Only
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Regional warehouses only
                </p>
              </div>

              {/* Division Only */}
              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  mappingType === "division_only"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
                onClick={() => handleMappingTypeChange("division_only")}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">
                      🏢
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Division Only
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Division warehouses only
                </p>
              </div>
            </div>
          </div>

          {/* Warehouse Selection */}
          {(mappingType === "zonal_with_fallback" ||
            mappingType === "custom") && (
            <div className="space-y-6">
              {/* Primary Warehouses (Zonal) */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                  <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-600" />
                  Primary Warehouses (Zonal)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {zonalWarehouses.map((warehouse) => (
                    <label
                      key={warehouse.id}
                      className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={primaryWarehouses.includes(warehouse.id)}
                        onChange={() =>
                          handlePrimaryWarehouseToggle(warehouse.id)
                        }
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {warehouse.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {warehouse.location}
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        Zonal
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enable Fallback Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white">
                    Enable Fallback
                  </h5>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Allow fallback to division warehouses when primary is out of
                    stock
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableFallback}
                    onChange={(e) => setEnableFallback(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Fallback Warehouses (Division) */}
              {enableFallback && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                    <FaWarehouse className="w-4 h-4 mr-2 text-purple-600" />
                    Fallback Warehouses (Division)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {divisionWarehouses.map((warehouse) => (
                      <label
                        key={warehouse.id}
                        className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={fallbackWarehouses.includes(warehouse.id)}
                          onChange={() =>
                            handleFallbackWarehouseToggle(warehouse.id)
                          }
                          className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {warehouse.name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {warehouse.location}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          Division
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Warehouse Type Selection */}
          {(mappingType === "zonal_only" ||
            mappingType === "division_only") && (
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Select {mappingType === "zonal_only" ? "Zonal" : "Division"}{" "}
                Warehouses
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(mappingType === "zonal_only"
                  ? zonalWarehouses
                  : divisionWarehouses
                ).map((warehouse) => (
                  <label
                    key={warehouse.id}
                    className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={primaryWarehouses.includes(warehouse.id)}
                      onChange={() =>
                        handlePrimaryWarehouseToggle(warehouse.id)
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {warehouse.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {warehouse.location}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        warehouse.type === "zonal"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {warehouse.type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about warehouse assignment..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Assignment Summary */}
          {(primaryWarehouses.length > 0 ||
            fallbackWarehouses.length > 0 ||
            mappingType === "nationwide") && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="font-medium text-slate-900 dark:text-white mb-2">
                Assignment Summary
              </h5>
              <div className="space-y-1 text-sm">
                {mappingType === "nationwide" ? (
                  <div className="text-green-700 dark:text-green-300">
                    ✓ All zonal warehouses with division fallback enabled
                  </div>
                ) : (
                  <>
                    {primaryWarehouses.length > 0 && (
                      <div className="text-blue-700 dark:text-blue-300">
                        ✓ Primary:{" "}
                        {primaryWarehouses
                          .map((id) => getWarehouseName(id))
                          .join(", ")}
                      </div>
                    )}
                    {enableFallback && fallbackWarehouses.length > 0 && (
                      <div className="text-purple-700 dark:text-purple-300">
                        ✓ Fallback:{" "}
                        {fallbackWarehouses
                          .map((id) => getWarehouseName(id))
                          .join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Save Assignment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseManagement;
