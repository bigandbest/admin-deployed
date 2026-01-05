import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Paper,
  Title,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Text,
  Card,
  Grid,
  Alert,
  Loader,
  Pagination,
  TextInput,
  Switch,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconUpload,
  IconEdit,
  IconTrash,
  IconEye,
  IconWorld,
  IconMapPin,
  IconDownload,
  IconInfoCircle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import ZoneUploadModal from "../../Components/ZoneManagement/ZoneUploadModal";
import ZoneForm from "../../Components/ZoneManagement/ZoneForm";
import ZoneDetailsModal from "../../Components/ZoneManagement/ZoneDetailsModal";
import { deleteZone, getZoneStatistics, fetchZoneById, toggleZoneActive } from "../../utils/zoneApi";
import { getAllZones } from "../../utils/supabaseApi";

const DeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalZones: 0,
    activeZones: 0,
    nationwideZones: 0,
    totalPincodes: 0,
  });
  const [selectedZone, setSelectedZone] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    activeOnly: false,
  });

  // Modal states
  const [
    uploadModalOpened,
    { open: openUploadModal, close: closeUploadModal },
  ] = useDisclosure(false);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);
  const [
    detailsModalOpened,
    { open: openDetailsModal, close: closeDetailsModal },
  ] = useDisclosure(false);

  // Load zones data
  const loadZones = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const response = await getAllZones({
          page,
          limit: pagination.limit,
          search: filters.search,
          active_only: filters.activeOnly ? "true" : "false",
        });

        if (response.success) {
          setZones(response.data);
          setPagination((prev) => ({
            ...prev,
            ...response.pagination,
          }));
        }
      } catch (error) {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to load zones",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await getZoneStatistics();
      if (response.success && response.statistics) {
        setStatistics(response.statistics);
      } else {
        // Set default statistics if API call fails
        setStatistics({
          totalZones: 0,
          activeZones: 0,
          nationwideZones: 0,
          totalPincodes: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
      // Set default statistics on error
      setStatistics({
        totalZones: 0,
        activeZones: 0,
        nationwideZones: 0,
        totalPincodes: 0,
      });
    }
  }, []);

  useEffect(() => {
    loadZones();
    loadStatistics();
  }, [loadZones, loadStatistics]);

  // Handle search
  const handleSearch = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle delete zone
  const handleDeleteZone = async (zoneId, zoneName) => {
    if (
      !window.confirm(`Are you sure you want to delete zone "${zoneName}"?`)
    ) {
      return;
    }

    try {
      const response = await deleteZone(zoneId);
      if (response.success) {
        notifications.show({
          title: "Success",
          message: "Zone deleted successfully",
          color: "green",
          icon: <IconCheck />,
        });
        loadZones(pagination.page);
        loadStatistics();
      } else {
        throw new Error(response.message || "Delete failed");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to delete zone",
        color: "red",
        icon: <IconX />,
      });
    }
  };

  // Handle view zone details
  const handleViewZone = async (zone) => {
    try {
      // Try to fetch complete zone details with pincodes
      const response = await fetchZoneById(zone.id);
      if (response.success) {
        const completeZone = response.zone || response.data;
        setSelectedZone(completeZone);
      } else {
        // Fallback to the zone data we have
        setSelectedZone(zone);
      }
    } catch (error) {
      console.error('Failed to fetch zone details:', error);
      // Fallback to the zone data we have
      setSelectedZone(zone);
    }
    openDetailsModal();
  };

  // Handle edit zone
  const handleEditZone = (zone) => {
    setSelectedZone(zone);
    openFormModal();
  };

  // Handle successful operations
  const handleOperationSuccess = () => {
    loadZones(pagination.page);
    loadStatistics();
    closeUploadModal();
    closeFormModal();
    setSelectedZone(null);
  };

  // Handle toggle zone active status
  const [togglingZoneId, setTogglingZoneId] = useState(null);

  const handleToggleActive = async (zone) => {
    // Prevent toggling nationwide zone
    if (zone.name === "nationwide") {
      notifications.show({
        title: "Not Allowed",
        message: "Cannot deactivate nationwide zone",
        color: "orange",
        icon: <IconX />,
      });
      return;
    }

    setTogglingZoneId(zone.id);
    try {
      const response = await toggleZoneActive(zone.id);
      if (response.success) {
        notifications.show({
          title: "Success",
          message: response.message,
          color: "green",
          icon: <IconCheck />,
        });

        // Update local state optimistically
        setZones((prevZones) =>
          prevZones.map((z) =>
            z.id === zone.id ? { ...z, is_active: response.zone.is_active } : z
          )
        );
        loadStatistics();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to toggle zone status",
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setTogglingZoneId(null);
    }
  };

  // Statistics cards - Add PropTypes validation
  const StatCard = ({ title, value, icon, color = "blue" }) => (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
            {title}
          </Text>
          <Text size="xl" weight={700}>
            {value || 0}
          </Text>
        </div>
        <ActionIcon size={40} radius="md" color={color} variant="light">
          {icon}
        </ActionIcon>
      </Group>
    </Card>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.element.isRequired,
    color: PropTypes.string,
  };

  return (
    <Container size="xl" py="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <div>
            <Title order={2}>Delivery Zone Management</Title>
            <Text color="dimmed" size="sm">
              Manage zones and pincodes for product delivery
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={() => window.open("/api/zones/sample-csv", "_blank")}
            >
              Sample Excel
            </Button>
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={openUploadModal}
            >
              Upload Excel
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setSelectedZone(null);
                openFormModal();
              }}
            >
              Add Zone
            </Button>
          </Group>
        </Group>

        {/* Statistics */}
        <Grid mb="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Zones"
              value={statistics.totalZones}
              icon={<IconMapPin />}
              color="blue"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Zones"
              value={statistics.activeZones}
              icon={<IconCheck />}
              color="green"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Pincodes"
              value={statistics.totalPincodes}
              icon={<IconMapPin />}
              color="orange"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Zonal Products"
              value={statistics.zonalProducts}
              icon={<IconWorld />}
              color="violet"
            />
          </Grid.Col>
        </Grid>

        {/* Filters */}
        <Paper shadow="sm" p="md" mb="lg">
          <Group>
            <TextInput
              placeholder="Search zones..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <Switch
              label="Active only"
              checked={filters.activeOnly}
              onChange={(e) =>
                handleFilterChange("activeOnly", e.target.checked)
              }
            />
          </Group>
        </Paper>

        {/* Zones Table */}
        <Paper shadow="sm" p="md">
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Loader />
              <Text mt="md">Loading zones...</Text>
            </div>
          ) : zones.length === 0 ? (
            <Alert icon={<IconInfoCircle />} title="No zones found">
              {filters.search || filters.activeOnly
                ? "No zones match your current filters."
                : "No zones have been created yet. Upload an Excel file or create one manually."}
            </Alert>
          ) : (
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Zone Name</Table.Th>
                    <Table.Th>Display Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Pincodes</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {zones.map((zone) => (
                    <Table.Tr key={zone.id}>
                      <Table.Td>
                        <Text weight={500}>{zone.name}</Text>
                      </Table.Td>
                      <Table.Td>{zone.display_name}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={zone.is_nationwide ? "blue" : "orange"}
                          variant="light"
                          leftSection={
                            zone.is_nationwide ? (
                              <IconWorld size={12} />
                            ) : (
                              <IconMapPin size={12} />
                            )
                          }
                        >
                          {zone.is_nationwide ? "Nationwide" : "Zonal"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {zone.is_nationwide ? "All" : zone.pincode_count || 0}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Switch
                          checked={zone.is_active}
                          onChange={() => handleToggleActive(zone)}
                          disabled={togglingZoneId === zone.id || zone.name === "nationwide"}
                          color="green"
                          size="md"
                          label={zone.is_active ? "Active" : "Inactive"}
                          styles={{
                            track: {
                              cursor: zone.name === "nationwide" ? "not-allowed" : "pointer",
                            },
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" color="dimmed">
                          {new Date(zone.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => handleViewZone(zone)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="orange"
                            onClick={() => handleEditZone(zone)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          {zone.name !== "nationwide" && (
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="red"
                              onClick={() =>
                                handleDeleteZone(zone.id, zone.display_name)
                              }
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Group justify="center" mt="lg">
                  <Pagination
                    value={pagination.page}
                    onChange={(page) => {
                      setPagination((prev) => ({ ...prev, page }));
                      loadZones(page);
                    }}
                    total={pagination.totalPages}
                  />
                </Group>
              )}
            </>
          )}
        </Paper>

        {/* Modals */}
        <ZoneUploadModal
          opened={uploadModalOpened}
          onClose={closeUploadModal}
          onSuccess={handleOperationSuccess}
        />

        <ZoneForm
          opened={formModalOpened}
          onClose={closeFormModal}
          zone={selectedZone}
          onSuccess={handleOperationSuccess}
        />

        <ZoneDetailsModal
          opened={detailsModalOpened}
          onClose={closeDetailsModal}
          zone={selectedZone}
        />
      </motion.div>
    </Container>
  );
};

export default DeliveryZones;
