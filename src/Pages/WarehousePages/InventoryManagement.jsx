import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {
  Card,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Badge,
  Table,
  Tabs,
  Group,
  Stack,
  Text,
  Grid,
  Paper,
  ActionIcon,
  Tooltip,
  MultiSelect,
  FileInput,
  Alert,
} from "@mantine/core";
import {
  Edit,
  Trash2,
  Plus,
  Upload,
  AlertTriangle,
  TrendingUp,
  Package,
  Search,
  Download,
  Truck,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const InventoryManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  // Form states
  const [stockForm, setStockForm] = useState({
    product_id: "",
    variant_id: "",
    stock_quantity: "",
    minimum_threshold: "",
    cost_per_unit: "",
  });

  const [transferForm, setTransferForm] = useState({
    product_id: "",
    variant_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: "",
    reason: "",
  });

  const [showMultiWarehouseModal, setShowMultiWarehouseModal] = useState(false);
  const [multiWarehouseForm, setMultiWarehouseForm] = useState({
    product_id: "",
    variant_id: "",
    records: [{ warehouse_id: "", stock_quantity: 0 }]
  });

  const handleMultiWarehouseUpdate = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      // Transform records to expected format
      const warehouse_allocations = multiWarehouseForm.records.map(r => ({
        warehouse_id: r.warehouse_id,
        stock_quantity: r.stock_quantity
      }));

      await axios.post(
        `${API_BASE_URL}/inventory/multi-warehouse/update-stock`,
        {
          product_id: multiWarehouseForm.product_id,
          variant_id: multiWarehouseForm.variant_id || null,
          warehouse_allocations
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Stock updated successfully across warehouses!");
      setShowMultiWarehouseModal(false);
      if (selectedWarehouse) fetchInventory();
    } catch (error) {
      console.error("Error updating multi-warehouse stock:", error);
      alert("Failed to update stock");
    }
  };

  const [allocationForm, setAllocationForm] = useState({
    product_id: "",
    variant_id: "",
    zonal_allocations: [{ zonal_warehouse_id: "", quantity: "" }],
  });

  const [csvFile, setCsvFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [movements, setMovements] = useState([]);

  // Fetch warehouses
  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Fetch inventory when warehouse changes
  useEffect(() => {
    if (!selectedWarehouse) return;

    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchInventory(),
          fetchAnalytics(),
          fetchLowStockItems(),
          fetchMovements(),
        ]);
      } catch (error) {
        console.error("Error fetching warehouse data:", error);
      }
    };

    fetchAllData();
  }, [selectedWarehouse]);


  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/warehouses`);
      setWarehouses(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedWarehouse(response.data.data[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}`
      );
      setInventory(response.data.inventory || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}/analytics`
      );
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}/low-stock`
      );
      setLowStockItems(response.data.data || []);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}/movements`
      );
      setMovements(response.data.data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("admin_token");

      await axios.post(
        `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}/update-stock`,
        stockForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Run both fetches in parallel
      await Promise.all([
        fetchInventory(),
        fetchAnalytics(),
      ]);

      setShowStockModal(false);
      setStockForm({
        product_id: "",
        variant_id: "",
        stock_quantity: "",
        minimum_threshold: "",
        cost_per_unit: "",
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
    }
  };


  const handleStockTransfer = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(
        `${API_BASE_URL}/stock/transfer`,
        {
          product_id: transferForm.product_id,
          variant_id: transferForm.variant_id || null,
          from_warehouse_id: transferForm.from_warehouse_id,
          to_warehouse_id: transferForm.to_warehouse_id,
          quantity: parseInt(transferForm.quantity),
          reason: transferForm.reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowTransferModal(false);
      setTransferForm({
        product_id: "",
        variant_id: "",
        from_warehouse_id: "",
        to_warehouse_id: "",
        quantity: "",
        reason: "",
      });

      alert("Stock transferred successfully");

      // Refresh data
      await Promise.all([
        fetchInventory(),
        fetchAnalytics(),
        fetchMovements()
      ]);
    } catch (error) {
      console.error("Error transferring stock:", error);
      alert(error.response?.data?.message || "Failed to transfer stock");
    }
  };


  const handleBulkUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split("\n");
          const records = [];

          // Skip header row
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const [product_id, variant_id, stock_quantity, minimum_threshold] =
              lines[i].split(",");

            records.push({
              product_id: product_id.trim(),
              variant_id: variant_id?.trim() || null,
              stock_quantity: parseInt(stock_quantity),
              minimum_threshold: parseInt(minimum_threshold) || 10,
            });
          }

          const token = localStorage.getItem("admin_token");

          const response = await axios.post(
            `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}/bulk-update`,
            { inventory_records: records },
            {
              headers: { Authorization: `Bearer ${token}` },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percentCompleted);
              },
            }
          );

          alert(`Successfully updated ${response.data.count} inventory records`);

          setShowBulkUploadModal(false);
          setCsvFile(null);
          setUploadProgress(0);

          // 🔥 Fetch data in parallel
          await Promise.all([
            fetchInventory(),
            fetchAnalytics(),
          ]);
        } catch (err) {
          console.error("Bulk upload processing failed:", err);
          alert("Failed to process CSV upload");
        }
      };

      reader.readAsText(csvFile);
    } catch (error) {
      console.error("Error uploading CSV:", error);
      alert("Failed to upload inventory data");
    }
  };


  const handleAllocateToZonal = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(
        `${API_BASE_URL}/inventory/warehouse/${selectedWarehouse}/allocate-to-zonal`,
        allocationForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowAllocationModal(false);
      setAllocationForm({
        product_id: "",
        variant_id: "",
        zonal_allocations: [{ zonal_warehouse_id: "", quantity: "" }],
      });
      fetchInventory();
    } catch (error) {
      console.error("Error allocating stock:", error);
      alert("Failed to allocate stock");
    }
  };

  const handleDeleteStock = async (stockId) => {
    if (!window.confirm("Are you sure you want to delete this stock record?"))
      return;

    try {
      const token = localStorage.getItem("admin_token");
      // Implement delete endpoint as needed
      fetchInventory();
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.includes(searchQuery)
  );

  const warehouse = warehouses.find((w) => w.id.toString() === selectedWarehouse);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Inventory Management
          </h1>
          <Group>
            <Button
              leftSection={<Upload size={16} />}
              onClick={() => setShowBulkUploadModal(true)}
              variant="light"
            >
              Bulk Upload
            </Button>
            <Button
              leftSection={<TrendingUp size={16} />}
              onClick={() => setShowMultiWarehouseModal(true)}
              variant="light"
              color="violet"
            >
              Multi-Warehouse Stock
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setShowStockModal(true)}
            >
              Add Stock
            </Button>
            <Button
              color="orange"
              leftSection={<TrendingUp size={16} />}
              onClick={() => setShowTransferModal(true)}
            >
              Transfer Stock
            </Button>
          </Group>
        </div>

        {/* Warehouse Selector */}
        <Select
          placeholder="Select Warehouse"
          value={selectedWarehouse?.toString()}
          onChange={setSelectedWarehouse}
          data={warehouses.map((w) => ({
            value: w.id.toString(),
            label: `${w.name} (${w.type})`,
          }))}
          className="max-w-md"
        />
      </div>

      {warehouse && (
        <>
          {/* Analytics Cards */}
          {analytics && (
            <Grid className="mb-6">
              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder>
                  <Group position="apart">
                    <div>
                      <Text size="sm" color="dimmed" weight={500}>
                        Total Stock
                      </Text>
                      <Text size="xl" weight={700} mt={5}>
                        {analytics.total_stock_items}
                      </Text>
                    </div>
                    <Package size={32} className="text-blue-500" />
                  </Group>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder>
                  <Group position="apart">
                    <div>
                      <Text size="sm" color="dimmed" weight={500}>
                        Inventory Value
                      </Text>
                      <Text size="xl" weight={700} mt={5}>
                        ₹{(analytics.inventory_value || 0).toLocaleString("en-IN")}
                      </Text>
                    </div>
                    <TrendingUp size={32} className="text-green-500" />
                  </Group>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder>
                  <Group position="apart">
                    <div>
                      <Text size="sm" color="dimmed" weight={500}>
                        Available Stock
                      </Text>
                      <Text size="xl" weight={700} mt={5}>
                        {analytics.total_available}
                      </Text>
                    </div>
                    <Package size={32} className="text-green-500" />
                  </Group>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper
                  p="md"
                  radius="md"
                  withBorder
                  className={
                    analytics.low_stock_count > 0
                      ? "bg-red-50 border-red-200"
                      : ""
                  }
                >
                  <Group position="apart">
                    <div>
                      <Text size="sm" color="dimmed" weight={500}>
                        Low Stock Items
                      </Text>
                      <Text size="xl" weight={700} mt={5} color="red">
                        {analytics.low_stock_count}
                      </Text>
                    </div>
                    <AlertTriangle
                      size={32}
                      className="text-red-500"
                    />
                  </Group>
                </Paper>
              </Grid.Col>
            </Grid>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="overview">Inventory Overview</Tabs.Tab>
              <Tabs.Tab value="lowstock">Low Stock Items</Tabs.Tab>
              <Tabs.Tab value="allocation">
                Allocate to Zonal
              </Tabs.Tab>
              <Tabs.Tab value="movements">Stock Movements</Tabs.Tab>
            </Tabs.List>

            {/* Inventory Overview Tab */}
            <Tabs.Panel value="overview" pt="xl">
              <Card withBorder radius="md">
                <Card.Section inheritPadding py="md">
                  <TextInput
                    placeholder="Search by product name, variant, or SKU"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    icon={<Package size={16} />}
                  />
                </Card.Section>

                <Card.Section inheritPadding>
                  {loading ? (
                    <Text>Loading inventory...</Text>
                  ) : filteredInventory.length === 0 ? (
                    <Text color="dimmed">No inventory records found</Text>
                  ) : (
                    <Table striped highlightOnHover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Variant</th>
                          <th>SKU</th>
                          <th>Stock</th>
                          <th>Reserved</th>
                          <th>Available</th>
                          <th>Min. Threshold</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <Group spacing="xs">
                                {item.product_image && (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-8 h-8 rounded"
                                  />
                                )}
                                <div>
                                  <Text weight={500} size="sm">
                                    {item.product_name}
                                  </Text>
                                  {item.category && (
                                    <Text size="xs" color="dimmed">
                                      {item.category.name}
                                    </Text>
                                  )}
                                </div>
                              </Group>
                            </td>
                            <td>{item.variant_name}</td>
                            <td>
                              <Badge variant="light">{item.sku}</Badge>
                            </td>
                            <td weight={500}>{item.stock_quantity}</td>
                            <td>{item.reserved_quantity}</td>
                            <td weight={700} color="green">
                              {item.available_quantity}
                            </td>
                            <td>{item.minimum_threshold}</td>
                            <td>
                              {item.is_low_stock ? (
                                <Badge color="red">Low Stock</Badge>
                              ) : (
                                <Badge color="green">OK</Badge>
                              )}
                            </td>
                            <td>
                              <Group spacing={0}>
                                <Tooltip label="Edit">
                                  <ActionIcon
                                    color="blue"
                                    onClick={() => {
                                      setEditingStock(item);
                                      setStockForm({
                                        product_id: item.product_id,
                                        variant_id: item.variant_id || "",
                                        stock_quantity: item.stock_quantity.toString(),
                                        minimum_threshold: item.minimum_threshold.toString(),
                                        cost_per_unit: item.cost_per_unit?.toString() || "",
                                      });
                                      setShowStockModal(true);
                                    }}
                                  >
                                    <Edit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Section>
              </Card>
            </Tabs.Panel>

            {/* Low Stock Tab */}
            <Tabs.Panel value="lowstock" pt="xl">
              <Card withBorder radius="md">
                <Card.Section inheritPadding py="md">
                  {lowStockItems.length === 0 ? (
                    <Alert icon={<AlertTriangle size={16} />} title="All Good!">
                      No low stock items in this warehouse.
                    </Alert>
                  ) : (
                    <Table striped highlightOnHover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Current Stock</th>
                          <th>Minimum</th>
                          <th>Deficit</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.map((item) => (
                          <tr key={item.id}>
                            <td weight={500}>{item.products?.name}</td>
                            <td color="red" weight={700}>
                              {item.stock_quantity}
                            </td>
                            <td>{item.minimum_threshold}</td>
                            <td color="red">
                              {item.minimum_threshold - item.stock_quantity}
                            </td>
                            <td>
                              <Button
                                size="xs"
                                onClick={() => {
                                  setStockForm({
                                    product_id: item.product_id,
                                    variant_id: item.variant_id || "",
                                    stock_quantity: item.minimum_threshold.toString(),
                                    minimum_threshold: item.minimum_threshold.toString(),
                                    cost_per_unit: item.cost_per_unit?.toString() || "",
                                  });
                                  setShowStockModal(true);
                                }}
                              >
                                Restock
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Section>
              </Card>
            </Tabs.Panel>

            {/* Allocation Tab */}
            <Tabs.Panel value="allocation" pt="xl">
              <Card withBorder radius="md">
                <Card.Section inheritPadding py="md">
                  <Text weight={500} mb="md">
                    Allocate Stock from {warehouse?.type === "division" ? "Division" : "Zonal"} to Zonal
                    Warehouses
                  </Text>
                  <Stack>
                    {/* Product Selection */}
                    <Select
                      label="Select Product"
                      placeholder="Choose a product to allocate"
                      value={allocationForm.product_id}
                      onChange={(value) => {
                        const selectedProduct = inventory.find(item => item.product_id === value);
                        setAllocationForm({
                          ...allocationForm,
                          product_id: value,
                          variant_id: selectedProduct?.variant_id || "",
                        });
                      }}
                      data={(() => {
                        // Create unique product list by grouping variants
                        const uniqueProducts = new Map();
                        inventory.forEach(item => {
                          if (!uniqueProducts.has(item.product_id)) {
                            uniqueProducts.set(item.product_id, {
                              value: item.product_id,
                              label: `${item.product_name} (Total Stock: ${inventory
                                  .filter(i => i.product_id === item.product_id)
                                  .reduce((sum, i) => sum + (i.stock_quantity || 0), 0)
                                })`,
                            });
                          }
                        });
                        return Array.from(uniqueProducts.values());
                      })()}
                      searchable
                      required
                    />

                    {/* Variant Selection - show if product has multiple variants */}
                    {allocationForm.product_id && (() => {
                      const productVariants = inventory.filter(item => item.product_id === allocationForm.product_id);
                      if (productVariants.length > 1) {
                        return (
                          <Select
                            label="Select Variant"
                            placeholder="Choose a variant"
                            value={allocationForm.variant_id}
                            onChange={(value) => {
                              setAllocationForm({
                                ...allocationForm,
                                variant_id: value,
                              });
                            }}
                            data={productVariants.map(item => ({
                              value: item.variant_id || item.product_id,
                              label: `${item.variant_name || 'Default'} (Stock: ${item.stock_quantity || 0})`,
                            }))}
                            searchable
                            required
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Show current stock for selected product/variant */}
                    {allocationForm.product_id && (() => {
                      const selectedItem = allocationForm.variant_id
                        ? inventory.find(item => item.product_id === allocationForm.product_id && item.variant_id === allocationForm.variant_id)
                        : inventory.find(item => item.product_id === allocationForm.product_id);
                      return selectedItem ? (
                        <Alert icon={<Package size={16} />} color="blue" variant="light">
                          <Text size="sm">
                            <strong>Current Stock:</strong> {selectedItem.stock_quantity || 0} units
                            {selectedItem.variant_name && ` (${selectedItem.variant_name})`}
                          </Text>
                        </Alert>
                      ) : null;
                    })()}

                    {/* Zonal Warehouse Allocations */}
                    <Text size="sm" weight={500} mt="md">Allocate to Zonal Warehouses:</Text>
                    {allocationForm.zonal_allocations.map((allocation, index) => (
                      <Group key={index} grow align="flex-end">
                        <Select
                          label={`Zonal Warehouse ${index + 1}`}
                          placeholder="Select zonal warehouse"
                          value={allocation.zonal_warehouse_id?.toString()}
                          onChange={(value) => {
                            const newAllocations = [...allocationForm.zonal_allocations];
                            newAllocations[index].zonal_warehouse_id = parseInt(value);
                            setAllocationForm({
                              ...allocationForm,
                              zonal_allocations: newAllocations,
                            });
                          }}
                          data={warehouses
                            .filter(w => w.type === "zonal")
                            .map(w => ({
                              value: w.id.toString(),
                              label: `${w.name} ${w.pincode ? `(${w.pincode})` : ''}`,
                            }))}
                          searchable
                          required
                        />
                        <NumberInput
                          label="Quantity"
                          placeholder="Enter quantity"
                          value={allocation.quantity}
                          onChange={(val) => {
                            const newAllocations = [...allocationForm.zonal_allocations];
                            newAllocations[index].quantity = val;
                            setAllocationForm({
                              ...allocationForm,
                              zonal_allocations: newAllocations,
                            });
                          }}
                          min={1}
                          required
                        />
                        {allocationForm.zonal_allocations.length > 1 && (
                          <Button
                            color="red"
                            variant="light"
                            onClick={() => {
                              const newAllocations = allocationForm.zonal_allocations.filter((_, i) => i !== index);
                              setAllocationForm({
                                ...allocationForm,
                                zonal_allocations: newAllocations,
                              });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </Group>
                    ))}

                    <Button
                      onClick={() =>
                        setAllocationForm({
                          ...allocationForm,
                          zonal_allocations: [
                            ...allocationForm.zonal_allocations,
                            { zonal_warehouse_id: "", quantity: "" },
                          ],
                        })
                      }
                      variant="light"
                      leftIcon={<Plus size={16} />}
                    >
                      Add Another Warehouse
                    </Button>

                    <Group position="right" mt="md">
                      <Button
                        onClick={handleAllocateToZonal}
                        disabled={!allocationForm.product_id || allocationForm.zonal_allocations.some(a => !a.zonal_warehouse_id || !a.quantity)}
                        leftIcon={<Truck size={16} />}
                      >
                        Allocate Stock
                      </Button>
                    </Group>
                  </Stack>
                </Card.Section>
              </Card>
            </Tabs.Panel>

            {/* Movements Tab */}
            <Tabs.Panel value="movements" pt="xl">
              <Card withBorder radius="md">
                <Card.Section inheritPadding py="md">
                  {movements.length === 0 ? (
                    <Text color="dimmed">No stock movements found</Text>
                  ) : (
                    <Table striped highlightOnHover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Reason</th>
                          <th>User</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map((m) => (
                          <tr key={m.id}>
                            <td>{new Date(m.created_at).toLocaleString()}</td>
                            <td>{m.product_name}</td>
                            <td>
                              <Badge
                                color={
                                  m.movement_type === "add"
                                    ? "green"
                                    : m.movement_type === "remove"
                                      ? "red"
                                      : "blue"
                                }
                              >
                                {m.movement_type}
                              </Badge>
                            </td>
                            <td>{m.quantity}</td>
                            <td>{m.reason || "-"}</td>
                            <td>{m.performed_by || "System"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Section>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </>
      )}

      {/* Multi-Warehouse Stock Modal */}
      <Modal
        opened={showMultiWarehouseModal}
        onClose={() => {
          setShowMultiWarehouseModal(false);
          setMultiWarehouseForm({
            product_id: "",
            variant_id: "",
            records: []
          });
        }}
        title="Multi-Warehouse Stock Update"
        size="lg"
      >
        <Stack>
          <TextInput
            label="Product ID"
            placeholder="Enter Product ID"
            value={multiWarehouseForm.product_id}
            onChange={(e) => setMultiWarehouseForm({ ...multiWarehouseForm, product_id: e.currentTarget.value })}
          />
          <TextInput
            label="Variant ID (Optional)"
            placeholder="Enter Variant ID"
            value={multiWarehouseForm.variant_id}
            onChange={(e) => setMultiWarehouseForm({ ...multiWarehouseForm, variant_id: e.currentTarget.value })}
          />

          <Text weight={500} size="sm" mt="md">Select Warehouses & Stock</Text>

          {multiWarehouseForm.records.map((record, index) => (
            <Group key={index} grow>
              <Select
                placeholder="Select Warehouse"
                data={warehouses.map(w => ({ value: w.id.toString(), label: `${w.name} (${w.type})` }))}
                value={record.warehouse_id?.toString()}
                onChange={(val) => {
                  const newRecords = [...multiWarehouseForm.records];
                  newRecords[index].warehouse_id = val;
                  setMultiWarehouseForm({ ...multiWarehouseForm, records: newRecords });
                }}
              />
              <NumberInput
                placeholder="Stock Qty"
                value={record.stock_quantity}
                onChange={(val) => {
                  const newRecords = [...multiWarehouseForm.records];
                  newRecords[index].stock_quantity = val;
                  setMultiWarehouseForm({ ...multiWarehouseForm, records: newRecords });
                }}
              />
              <ActionIcon color="red" onClick={() => {
                const newRecords = multiWarehouseForm.records.filter((_, i) => i !== index);
                setMultiWarehouseForm({ ...multiWarehouseForm, records: newRecords });
              }}>
                <Trash2 size={16} />
              </ActionIcon>
            </Group>
          ))}

          <Button variant="outline" onClick={() => {
            setMultiWarehouseForm({
              ...multiWarehouseForm,
              records: [...multiWarehouseForm.records, { warehouse_id: "", stock_quantity: 0 }]
            });
          }}>
            <Plus size={16} className="mr-2" /> Add Warehouse
          </Button>

          <Button onClick={handleMultiWarehouseUpdate} fullWidth mt="md">
            Update All Selected
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Stock"
        size="lg"
      >
        <form onSubmit={handleStockTransfer}>
          <Stack>
            <TextInput
              label="Product ID"
              placeholder="Enter Product ID"
              required
              value={transferForm.product_id}
              onChange={(e) =>
                setTransferForm({ ...transferForm, product_id: e.currentTarget.value })
              }
            />
            <TextInput
              label="Variant ID (Optional)"
              placeholder="Enter Variant ID"
              value={transferForm.variant_id}
              onChange={(e) =>
                setTransferForm({ ...transferForm, variant_id: e.currentTarget.value })
              }
            />
            <Select
              label="From Warehouse"
              placeholder="Select Source Warehouse"
              data={warehouses.map((w) => ({
                value: w.id.toString(),
                label: `${w.name} (${w.type})`,
              }))}
              required
              value={transferForm.from_warehouse_id}
              onChange={(val) => setTransferForm({ ...transferForm, from_warehouse_id: val })}
            />
            <Select
              label="To Warehouse"
              placeholder="Select Destination Warehouse"
              data={warehouses.map((w) => ({
                value: w.id.toString(),
                label: `${w.name} (${w.type})`,
              }))}
              required
              value={transferForm.to_warehouse_id}
              onChange={(val) => setTransferForm({ ...transferForm, to_warehouse_id: val })}
            />
            <NumberInput
              label="Quantity"
              placeholder="Enter Quantity"
              required
              min={1}
              value={transferForm.quantity}
              onChange={(val) => setTransferForm({ ...transferForm, quantity: val })}
            />
            <TextInput
              label="Reason"
              placeholder="Reason for transfer"
              required
              value={transferForm.reason}
              onChange={(e) =>
                setTransferForm({ ...transferForm, reason: e.currentTarget.value })
              }
            />
            <Button type="submit" mt="md">
              Transfer Stock
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal
        opened={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setEditingStock(null);
        }}
        title={editingStock ? "Edit Stock" : "Add Stock"}
      >
        <form onSubmit={handleUpdateStock}>
          <Stack>
            <TextInput
              label="Product ID"
              placeholder="Enter product ID"
              value={stockForm.product_id}
              onChange={(e) =>
                setStockForm({
                  ...stockForm,
                  product_id: e.currentTarget.value,
                })
              }
              required
            />

            <VariantSelector
              productId={stockForm.product_id}
              value={stockForm.variant_id}
              onChange={(val) =>
                setStockForm({
                  ...stockForm,
                  variant_id: val,
                })
              }
            />

            <NumberInput
              label="Stock Quantity"
              placeholder="Enter stock quantity"
              value={parseInt(stockForm.stock_quantity) || ""}
              onChange={(val) =>
                setStockForm({
                  ...stockForm,
                  stock_quantity: val?.toString() || "",
                })
              }
              required
            />

            <NumberInput
              label="Minimum Threshold"
              placeholder="Enter minimum threshold"
              value={parseInt(stockForm.minimum_threshold) || ""}
              onChange={(val) =>
                setStockForm({
                  ...stockForm,
                  minimum_threshold: val?.toString() || "",
                })
              }
            />

            <NumberInput
              label="Cost per Unit"
              placeholder="Enter cost per unit"
              value={parseFloat(stockForm.cost_per_unit) || ""}
              onChange={(val) =>
                setStockForm({
                  ...stockForm,
                  cost_per_unit: val?.toString() || "",
                })
              }
              precision={2}
            />

            <Button type="submit" fullWidth>
              {editingStock ? "Update Stock" : "Add Stock"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        opened={showBulkUploadModal}
        onClose={() => {
          setShowBulkUploadModal(false);
          setCsvFile(null);
          setUploadProgress(0);
        }}
        title="Bulk Upload Inventory"
      >
        <Stack>
          <Text size="sm" color="dimmed">
            Upload a CSV file with columns: product_id, variant_id, stock_quantity,
            minimum_threshold
          </Text>

          <FileInput
            label="Select CSV File"
            placeholder="Choose file"
            accept=".csv"
            value={csvFile}
            onChange={setCsvFile}
          />

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded">
              <div
                className="bg-blue-500 h-2 rounded transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <Button onClick={handleBulkUpload} fullWidth disabled={!csvFile}>
            Upload Inventory
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};

export default InventoryManagement;

// Helper component for Variant Selection
const VariantSelector = ({ productId, value, onChange }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setVariants([]);
      return;
    }

    const fetchVariants = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
        const product = response.data.product || response.data;
        if (product.has_variants && product.variants?.length > 0) {
          setVariants(product.variants);
        } else {
          setVariants([]);
        }
      } catch (error) {
        console.error("Failed to fetch variants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [productId]);

  if (loading) return <div className="text-sm text-gray-500">Loading variants...</div>;
  if (variants.length === 0) return null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Variant
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Variant</option>
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.active === false ? "[Inactive] " : ""}
            {v.title || v.size || v.color || v.weight || v.sku || `Variant ${v.id.substring(0, 6)}`}
            {v.price ? ` - ₹${v.price}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
};

VariantSelector.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
