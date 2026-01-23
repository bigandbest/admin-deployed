import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
  const [editingStock, setEditingStock] = useState(null);

  // Form states
  const [stockForm, setStockForm] = useState({
    product_id: "",
    variant_id: "",
    stock_quantity: "",
    minimum_threshold: "",
    cost_per_unit: "",
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
              leftIcon={<Upload size={16} />}
              onClick={() => setShowBulkUploadModal(true)}
              variant="light"
            >
              Bulk Upload
            </Button>
            <Button
              leftIcon={<TrendingUp size={16} />}
              onClick={() => setShowMultiWarehouseModal(true)}
              variant="light"
              color="violet"
            >
              Multi-Warehouse Stock
            </Button>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => setShowStockModal(true)}
            >
              Add Stock
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
          <Tabs value={activeTab} onTabChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="overview">Inventory Overview</Tabs.Tab>
              <Tabs.Tab value="lowstock">Low Stock Items</Tabs.Tab>
              <Tabs.Tab value="allocation">
                Allocate to Zonal
              </Tabs.Tab>
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
                    Allocate Stock from {warehouse.type === "division" ? "Division" : "Zonal"} to Zonal
                    Warehouses
                  </Text>
                  <Stack>
                    <TextInput
                      label="Product ID"
                      placeholder="Select product"
                      value={allocationForm.product_id}
                      onChange={(e) =>
                        setAllocationForm({
                          ...allocationForm,
                          product_id: e.currentTarget.value,
                        })
                      }
                    />

                    {allocationForm.zonal_allocations.map((allocation, index) => (
                      <Group key={index} grow>
                        <TextInput
                          label="Zonal Warehouse ID"
                          value={allocation.zonal_warehouse_id}
                          onChange={(e) => {
                            const newAllocations = [
                              ...allocationForm.zonal_allocations,
                            ];
                            newAllocations[index].zonal_warehouse_id =
                              e.currentTarget.value;
                            setAllocationForm({
                              ...allocationForm,
                              zonal_allocations: newAllocations,
                            });
                          }}
                        />
                        <NumberInput
                          label="Quantity"
                          value={allocation.quantity}
                          onChange={(val) => {
                            const newAllocations = [
                              ...allocationForm.zonal_allocations,
                            ];
                            newAllocations[index].quantity = val;
                            setAllocationForm({
                              ...allocationForm,
                              zonal_allocations: newAllocations,
                            });
                          }}
                        />
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
                    >
                      Add Allocation
                    </Button>

                    <Button onClick={handleAllocateToZonal}>
                      Allocate Stock
                    </Button>
                  </Stack>
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

            <TextInput
              label="Variant ID (Optional)"
              placeholder="Enter variant ID"
              value={stockForm.variant_id}
              onChange={(e) =>
                setStockForm({
                  ...stockForm,
                  variant_id: e.currentTarget.value,
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
