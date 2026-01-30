import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Modal,
  TextInput,
  Select,
  Badge,
  Table,
  Group,
  Stack,
  Text,
  Grid,
  Paper,
  ActionIcon,
  Tooltip,
  MultiSelect,
  Alert,
  Tabs,
  NumberInput,
} from "@mantine/core";
import {
  Plus,
  Trash2,
  Edit,
  MapPin,
  Navigation,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const PincodeManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [pincodes, setPincodes] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);

  // Form states
  const [pincodeForm, setpincodeForm] = useState({
    pincode: "",
    city: "",
    state: "",
    delivery_days: "3",
  });

  const [zoneForm, setZoneForm] = useState({
    zone_name: "",
    description: "",
    priority: "1",
    pincodes: [],
  });

  const [availablePincodes, setAvailablePincodes] = useState([]);
  const [activeTab, setActiveTab] = useState("pincodes");

  // Fetch warehouses
  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Fetch pincodes when warehouse changes
  useEffect(() => {
    if (selectedWarehouse) {
      fetchPincodes();
    }
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

  const fetchPincodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/warehouses/${selectedWarehouse}/pincodes`
      );
      setPincodes(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pincodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePincodes = async () => {
    try {
      // Fetch all pincodes that can be added
      const response = await axios.get(
        `${API_BASE_URL}/pincodes?available=true`
      );
      const formattedData = (response.data.data || []).map((p) => ({
        value: p.pincode,
        label: `${p.pincode} - ${p.city}, ${p.state}`,
      }));
      setAvailablePincodes(formattedData);
    } catch (error) {
      console.error("Error fetching available pincodes:", error);
    }
  };

  const handleAddOrUpdatePincode = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("admin_token");

      if (editingPincode) {
        // Update logic
        await axios.put(
          `${API_BASE_URL}/warehouses/${selectedWarehouse}/pincodes/${pincodeForm.pincode}`,
          pincodeForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Add logic
        await axios.post(
          `${API_BASE_URL}/warehouses/${selectedWarehouse}/pincodes`,
          { pincodes: [pincodeForm] },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setShowPincodeModal(false);
      setEditingPincode(null);
      setpincodeForm({
        pincode: "",
        city: "",
        state: "",
        delivery_days: "3",
      });
      fetchPincodes();
    } catch (error) {
      console.error("Error saving pincode:", error);
      alert("Failed to save pincode");
    }
  };


  const handleDeletePincode = async (pincode) => {
    if (!window.confirm(`Are you sure you want to delete pincode ${pincode}?`))
      return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(
        `${API_BASE_URL}/warehouses/${selectedWarehouse}/pincodes/${pincode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchPincodes();
    } catch (error) {
      console.error("Error deleting pincode:", error);
      alert("Failed to delete pincode");
    }
  };

  const openEditModal = (pincodeData) => {
    setEditingPincode(pincodeData);
    setpincodeForm({
      pincode: pincodeData.pincode,
      city: pincodeData.city,
      state: pincodeData.state,
      delivery_days: pincodeData.delivery_days?.toString() || "3"
    });
    setShowPincodeModal(true);
  };

  const filteredPincodes = pincodes.filter(
    (p) =>
      p.pincode?.includes(searchQuery) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const warehouse = warehouses.find((w) => w.id.toString() === selectedWarehouse);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Pincode & Area Management
          </h1>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setEditingPincode(null);
              setpincodeForm({
                pincode: "",
                city: "",
                state: "",
                delivery_days: "3",
              });
              fetchAvailablePincodes();
              setShowPincodeModal(true);
            }}
          >
            Add Pincode
          </Button>
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
          {/* Warehouse Info */}
          <Grid className="mb-6">
            <Grid.Col span={4}>
              <Paper p="md" radius="md" withBorder>
                <Group>
                  <MapPin size={32} className="text-blue-500" />
                  <div>
                    <Text size="sm" color="dimmed">
                      Warehouse
                    </Text>
                    <Text weight={700}>{warehouse.name}</Text>
                    <Badge size="sm" mt={5}>
                      {warehouse.type}
                    </Badge>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={4}>
              <Paper p="md" radius="md" withBorder>
                <Group>
                  <Navigation size={32} className="text-green-500" />
                  <div>
                    <Text size="sm" color="dimmed">
                      Pincodes Served
                    </Text>
                    <Text weight={700} size="xl">
                      {pincodes.length}
                    </Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={4}>
              <Paper p="md" radius="md" withBorder>
                <Group>
                  <AlertCircle size={32} className="text-orange-500" />
                  <div>
                    <Text size="sm" color="dimmed">
                      Coverage
                    </Text>
                    <Text weight={700}>
                      {warehouse.type === "division" ? "Direct" : "Zonal"}
                    </Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Tabs */}
          <Tabs value={activeTab} onTabChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="pincodes">Assigned Pincodes</Tabs.Tab>
              <Tabs.Tab value="delivery">Delivery Configuration</Tabs.Tab>
            </Tabs.List>

            {/* Pincodes Tab */}
            <Tabs.Panel value="pincodes" pt="xl">
              <Card withBorder radius="md">
                <Card.Section inheritPadding py="md">
                  <TextInput
                    placeholder="Search by pincode, city or state"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    icon={<MapPin size={16} />}
                  />
                </Card.Section>

                <Card.Section inheritPadding>
                  {loading ? (
                    <Text>Loading pincodes...</Text>
                  ) : filteredPincodes.length === 0 ? (
                    <Text color="dimmed">
                      No pincodes assigned to this warehouse
                    </Text>
                  ) : (
                    <Table striped highlightOnHover>
                      <thead>
                        <tr>
                          <th>Pincode</th>
                          <th>City</th>
                          <th>State</th>
                          <th>Delivery Days</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPincodes.map((pincode) => (
                          <tr key={pincode.pincode}>
                            <td>
                              <Badge variant="light">
                                {pincode.pincode}
                              </Badge>
                            </td>
                            <td weight={500}>{pincode.city}</td>
                            <td>{pincode.state}</td>
                            <td>
                              {pincode.delivery_days || 3} days
                            </td>
                            <td>
                              <Badge color="green">Active</Badge>
                            </td>
                            <td>
                              <Group spacing={0}>
                                <Tooltip label="Edit">
                                  <ActionIcon color="blue" onClick={() => openEditModal(pincode)}>
                                    <Edit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete">
                                  <ActionIcon
                                    color="red"
                                    onClick={() =>
                                      handleDeletePincode(pincode.pincode)
                                    }
                                  >
                                    <Trash2 size={16} />
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

            {/* Delivery Configuration Tab */}
            <Tabs.Panel value="delivery" pt="xl">
              <Grid>
                <Grid.Col span={6}>
                  <Card withBorder radius="md">
                    <Card.Section inheritPadding py="md">
                      <Text weight={700}>Warehouse Type</Text>
                    </Card.Section>
                    <Card.Section inheritPadding>
                      <Stack>
                        <div className="p-3 bg-blue-50 rounded">
                          <Group position="apart">
                            <div>
                              <Text weight={500}>Type</Text>
                              <Text size="sm" color="dimmed">
                                {warehouse.type}
                              </Text>
                            </div>
                            <Badge>{warehouse.type}</Badge>
                          </Group>
                        </div>

                        {warehouse.type === "zonal" && (
                          <Alert icon={<AlertCircle size={16} />} title="Zonal Warehouse">
                            Serves multiple pincodes within geographic zones
                          </Alert>
                        )}

                        {warehouse.type === "division" && (
                          <Alert icon={<AlertCircle size={16} />} title="Division Warehouse">
                            Serves specific pincodes with faster delivery
                          </Alert>
                        )}
                      </Stack>
                    </Card.Section>
                  </Card>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Card withBorder radius="md">
                    <Card.Section inheritPadding py="md">
                      <Text weight={700}>Service Area Statistics</Text>
                    </Card.Section>
                    <Card.Section inheritPadding>
                      <Stack>
                        <div className="p-3 bg-green-50 rounded">
                          <Group position="apart">
                            <Text size="sm">Total Pincodes</Text>
                            <Text weight={700}>{pincodes.length}</Text>
                          </Group>
                        </div>

                        <div className="p-3 bg-blue-50 rounded">
                          <Group position="apart">
                            <Text size="sm">Unique States</Text>
                            <Text weight={700}>
                              {new Set(pincodes.map((p) => p.state)).size}
                            </Text>
                          </Group>
                        </div>

                        <div className="p-3 bg-purple-50 rounded">
                          <Group position="apart">
                            <Text size="sm">Unique Cities</Text>
                            <Text weight={700}>
                              {new Set(pincodes.map((p) => p.city)).size}
                            </Text>
                          </Group>
                        </div>

                        <div className="p-3 bg-orange-50 rounded">
                          <Group position="apart">
                            <Text size="sm">Avg Delivery Days</Text>
                            <Text weight={700}>
                              {(
                                pincodes.reduce((sum, p) => sum + (p.delivery_days || 3), 0) /
                                (pincodes.length || 1)
                              ).toFixed(1)}
                            </Text>
                          </Group>
                        </div>
                      </Stack>
                    </Card.Section>
                  </Card>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          </Tabs>
        </>
      )}

      {/* Add/Edit Pincode Modal */}
      <Modal
        opened={showPincodeModal}
        onClose={() => {
          setShowPincodeModal(false);
          setEditingPincode(null);
        }}
        title={editingPincode ? "Edit Pincode Details" : "Add Pincode to Warehouse"}
      >
        <form onSubmit={handleAddOrUpdatePincode}>
          <Stack>
            <TextInput
              label="Pincode"
              placeholder="Enter pincode"
              value={pincodeForm.pincode}
              onChange={(e) =>
                setpincodeForm({
                  ...pincodeForm,
                  pincode: e.currentTarget.value,
                })
              }
              required
              disabled={!!editingPincode}
            />

            <TextInput
              label="City"
              placeholder="Enter city name"
              value={pincodeForm.city}
              onChange={(e) =>
                setpincodeForm({
                  ...pincodeForm,
                  city: e.currentTarget.value,
                })
              }
              required
            />

            <TextInput
              label="State"
              placeholder="Enter state name"
              value={pincodeForm.state}
              onChange={(e) =>
                setpincodeForm({
                  ...pincodeForm,
                  state: e.currentTarget.value,
                })
              }
              required
            />

            <NumberInput
              label="Delivery Days"
              placeholder="Enter estimated delivery days"
              value={parseInt(pincodeForm.delivery_days) || ""}
              onChange={(val) =>
                setpincodeForm({
                  ...pincodeForm,
                  delivery_days: val?.toString() || "",
                })
              }
              min={1}
              max={30}
            />

            <Button type="submit" fullWidth>
              {editingPincode ? "Update Pincode" : "Add Pincode"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};

export default PincodeManagement;
