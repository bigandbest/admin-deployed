import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Table,
  Switch,
  Button,
  Badge,
  TextInput,
  Modal,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Textarea,
  LoadingOverlay,
  Alert,
  Card,
  Stack,
  Flex,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import {
  getAllProductSections,
  updateProductSection,
  toggleProductSectionStatus,
  updateProductSectionOrder,
} from "../../utils/supabaseApi";

const ProductSectionsManagement = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    section_name: "",
    description: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch all product sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const result = await getAllProductSections();

      if (result.success) {
        setSections(result.sections || result.data || []);
      } else {
        throw new Error(result.error || "Failed to fetch sections");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
      notifications.show({
        title: "Error",
        message: "Failed to fetch product sections",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle section active status
  const toggleSectionStatus = async (sectionId) => {
    try {
      const result = await toggleProductSectionStatus(sectionId);

      if (result.success) {
        setSections(
          (sections || []).map((section) =>
            section.id === sectionId
              ? { ...section, is_active: !section.is_active }
              : section
          )
        );
        notifications.show({
          title: "Success",
          message: result.message,
          color: "green",
        });
      } else {
        throw new Error(result.error || "Failed to toggle section status");
      }
    } catch (error) {
      console.error("Error toggling section status:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update section status",
        color: "red",
      });
    }
  };

  // Update section
  const updateSection = async () => {
    try {
      setSubmitting(true);
      const result = await updateProductSection(selectedSection.id, formData);

      if (result.success) {
        setSections(
          (sections || []).map((section) =>
            section.id === selectedSection.id ? result.section : section
          )
        );
        notifications.show({
          title: "Success",
          message: "Section updated successfully",
          color: "green",
        });
        closeEditModal();
      } else {
        throw new Error(result.error || "Failed to update section");
      }
    } catch (error) {
      console.error("Error updating section:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update section",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update display order
  const updateSectionOrder = async (updatedSections) => {
    try {
      const sectionsWithOrder = updatedSections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
      }));

      const result = await updateProductSectionOrder(sectionsWithOrder);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Section order updated successfully",
          color: "green",
        });
      } else {
        throw new Error(result.error || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update section order",
        color: "red",
      });
      // Revert the order on error
      fetchSections();
    }
  };

  // Move section up/down
  const moveSectionUp = (index) => {
    if (!Array.isArray(sections) || index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [
      newSections[index],
      newSections[index - 1],
    ];
    setSections(newSections);
    updateSectionOrder(newSections);
  };

  const moveSectionDown = (index) => {
    if (!Array.isArray(sections) || index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [
      newSections[index + 1],
      newSections[index],
    ];
    setSections(newSections);
    updateSectionOrder(newSections);
  };

  // Open edit modal
  const openEdit = (section) => {
    setSelectedSection(section);
    setFormData({
      section_name: section.section_name,
      description: section.description || "",
      is_active: section.is_active,
    });
    openEditModal();
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} />

      <Stack spacing="xl">
        <Flex justify="space-between" align="center">
          <Title order={2}>Product Sections Management</Title>
          <Button onClick={fetchSections} variant="outline">
            Refresh
          </Button>
        </Flex>

        <Alert>
          <Text size="sm">
            Manage the visibility and order of selected homepage product
            sections. You can enable/disable sections, edit section names, and
            reorder them.
          </Text>
        </Alert>

        <Card>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: "80px" }}>Order</Table.Th>
                  <Table.Th>Section Name</Table.Th>
                  <Table.Th>Component</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th style={{ width: "120px" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.isArray(sections) && sections.map((section, index) => (
                  <Table.Tr key={section.id}>
                    <Table.Td>
                      <Flex align="center" gap="xs">
                        <Badge variant="outline" size="sm">
                          {section.display_order}
                        </Badge>
                        <Group gap="2">
                          <Tooltip label="Move Up">
                            <ActionIcon
                              variant="subtle"
                              size="xs"
                              disabled={index === 0}
                              onClick={() => moveSectionUp(index)}
                            >
                              <IconArrowUp size={12} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Move Down">
                            <ActionIcon
                              variant="subtle"
                              size="xs"
                              disabled={index === sections.length - 1}
                              onClick={() => moveSectionDown(index)}
                            >
                              <IconArrowDown size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Flex>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{section.section_name}</Text>
                      <Text size="xs" c="dimmed">
                        {section.section_key}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{section.component_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={section.is_active}
                        onChange={() => toggleSectionStatus(section.id)}
                        color="green"
                        thumbIcon={
                          section.is_active ? (
                            <IconEye size={12} />
                          ) : (
                            <IconEyeOff size={12} />
                          )
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {section.description || "No description"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Edit Section">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => openEdit(section)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Card>
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Product Section"
        size="md"
      >
        <Stack spacing="md">
          <TextInput
            label="Section Name"
            placeholder="Enter section display name"
            value={formData.section_name}
            onChange={(e) =>
              setFormData({ ...formData, section_name: e.target.value })
            }
            required
          />

          <Textarea
            label="Description"
            placeholder="Enter section description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
          />

          <Switch
            label="Active Status"
            description="Enable or disable this section"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.currentTarget.checked })
            }
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={updateSection} loading={submitting}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ProductSectionsManagement;
