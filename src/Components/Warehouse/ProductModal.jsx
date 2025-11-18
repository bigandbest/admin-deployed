import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const STEPS = [
  { id: "basic", title: "Basic Info", description: "Name & delivery type" },
  { id: "zonal", title: "Zonal Availability", description: "Assign zonal stock" },
  {
    id: "division",
    title: "Division Availability",
    description: "Fallback coverage",
  },
  {
    id: "pricing",
    title: "Pricing & Review",
    description: "Price and final checks",
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

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setStepErrors({});
    }
  }, [isOpen, isEditing]);

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

  const updateAssignment = (warehouseId, value) => {
    const numericValue =
      value === "" ? "" : Number.parseInt(value, 10) >= 0
        ? Number.parseInt(value, 10)
        : "";

    const currentAssignments = data.warehouse_assignments || [];
    const existingIndex = currentAssignments.findIndex(
      (assignment) => assignment.warehouse_id === warehouseId
    );

    if (numericValue === "" || numericValue <= 0) {
      if (existingIndex === -1) return;
      const filtered = currentAssignments.filter(
        (assignment) => assignment.warehouse_id !== warehouseId
      );
      setData({ ...data, warehouse_assignments: filtered });
      return;
    }

    const newAssignment = {
      warehouse_id: warehouseId,
      stock_quantity: numericValue,
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

  const getAssignedStock = (warehouseId) => {
    const assignment = assignments.find(
      (item) => item.warehouse_id === warehouseId
    );
    return assignment ? assignment.stock_quantity.toString() : "";
  };

  const validateStep = (stepIndex) => {
    let errorMessage = "";

    switch (STEPS[stepIndex].id) {
      case "basic":
        if (!data.name.trim()) {
          errorMessage = "Product name is required";
        } else if (!data.delivery_type) {
          errorMessage = "Select a delivery type";
        } else if (!data.category_id) {
          errorMessage = "Category ID is required";
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
        if (data.price === "" || Number.isNaN(Number.parseFloat(data.price))) {
          errorMessage = "Enter a valid price";
        } else if (Number.parseFloat(data.price) < 0) {
          errorMessage = "Price cannot be negative";
        } else if (totalAssignedWarehouses === 0) {
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
    if (validateStep(currentStep)) {
      onSubmit();
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "basic":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(event) =>
                  setData({ ...data, name: event.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Type *
              </label>
              <select
                value={data.delivery_type}
                onChange={(event) =>
                  setData({
                    ...data,
                    delivery_type: event.target.value,
                    warehouse_assignments: [],
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nationwide">
                  🌍 Nationwide Delivery (zone + divisions)
                </option>
                <option value="zonal">
                  🏙️ Zonal Delivery (division fallback optional)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category ID *
              </label>
              <input
                type="number"
                value={data.category_id}
                onChange={(event) =>
                  setData({ ...data, category_id: event.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category ID"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={data.initial_stock}
                  onChange={(event) =>
                    setData({ ...data, initial_stock: event.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Threshold
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Per Unit
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.cost_per_unit}
                  onChange={(event) =>
                    setData({ ...data, cost_per_unit: event.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={data.description}
                onChange={(event) =>
                  setData({ ...data, description: event.target.value })
                }
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
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
                  Assign stock to zonal warehouses. Divisions can be configured
                  in the next step for fallback coverage.
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
                    <input
                      type="number"
                      min="0"
                      value={getAssignedStock(warehouse.id)}
                      onChange={(event) =>
                        updateAssignment(warehouse.id, event.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Stock quantity"
                    />
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
                  Assign stock to specific divisions. These act as fallback
                  locations when the zonal warehouse is empty, keeping products
                  isolated per zone.
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <input
                              type="number"
                              min="0"
                              value={getAssignedStock(division.id)}
                              onChange={(event) =>
                                updateAssignment(division.id, event.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Stock quantity"
                            />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.price}
                  onChange={(event) =>
                    setData({ ...data, price: event.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product price"
                />
              </div>
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
              </div>
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
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assignments.map((assignment) => {
                    const warehouse = warehouseMap.get(assignment.warehouse_id);
                    if (!warehouse) return null;
                    return (
                      <div
                        key={`${assignment.warehouse_id}`}
                        className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {warehouse.name}
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
              {isEditing ? "Edit Product" : "Add New Product"}
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
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm font-semibold ${
                  index === currentStep
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
                  className={`flex-1 h-0.5 ${
                    index < currentStep ? "bg-blue-500" : "bg-gray-200"
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
                {isEditing ? "Update Product" : "Create Product"}
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
    warehouse_assignments: PropTypes.arrayOf(
      PropTypes.shape({
        warehouse_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        stock_quantity: PropTypes.number,
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

