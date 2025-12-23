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
  MultiSelect,
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
  IconPackage,
  IconX,
} from "@tabler/icons-react";
import {
  getAllProductSections,
  updateProductSection,
  toggleProductSectionStatus,
  updateProductSectionOrder,
} from "../../utils/supabaseApi";
import axios from "axios";

const ProductSectionsManagement = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [productsModalOpened, { open: openProductsModal, close: closeProductsModal }] =
    useDisclosure(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    section_name: "",
    description: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Product management state
  const [sectionProducts, setSectionProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productCounts, setProductCounts] = useState({});

  // Fetch all product sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const result = await getAllProductSections();

      if (result.success) {
        const sanitizedSections = (result.sections || result.data || []).filter(Boolean);
        setSections(sanitizedSections);
        // Fetch product counts for all sections
        fetchProductCounts(sanitizedSections);
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

  // Fetch product counts for all sections
  const fetchProductCounts = async (sectionsList) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const counts = {};

      await Promise.all(
        sectionsList.map(async (section) => {
          try {
            const response = await axios.get(
              `${apiUrl}/product-sections/${section.id}/products?limit=1`
            );
            if (response.data.success && response.data.pagination) {
              counts[section.id] = response.data.pagination.total;
            }
          } catch (error) {
            console.error(`Error fetching count for section ${section.id}:`, error);
            counts[section.id] = 0;
          }
        })
      );

      setProductCounts(counts);
    } catch (error) {
      console.error("Error fetching product counts:", error);
    }
  };

  // Fetch products in a section
  const fetchSectionProducts = async (sectionId) => {
    try {
      setProductsLoading(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const response = await axios.get(
        `${apiUrl}/product-sections/${sectionId}/products?limit=100`
      );

      if (response.data.success) {
        setSectionProducts(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching section products:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch products in section",
        color: "red",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch all products for selection
  const fetchAllProducts = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const response = await axios.get(`${apiUrl}/admin/products`);

      if (response.data.success && response.data.products) {
        setAllProducts(response.data.products);
      }
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };

  // Open products modal
  const openManageProducts = (section) => {
    setSelectedSection(section);
    fetchSectionProducts(section.id);
    fetchAllProducts();
    openProductsModal();
  };

  // Add products to section
  const addProductsToSection = async () => {
    if (selectedProductIds.length === 0) {
      notifications.show({
        title: "Warning",
        message: "Please select at least one product",
        color: "yellow",
      });
      return;
    }

    try {
      setSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const response = await axios.post(
        `${apiUrl}/product-sections/${selectedSection.id}/products`,
        { product_ids: selectedProductIds }
      );

      if (response.data.success) {
        notifications.show({
          title: "Success",
          message: response.data.message,
          color: "green",
        });
        setSelectedProductIds([]);
        fetchSectionProducts(selectedSection.id);
        fetchProductCounts(sections);
      }
    } catch (error) {
      console.error("Error adding products:", error);
      notifications.show({
        title: "Error",
        message: "Failed to add products to section",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Remove product from section
  const removeProductFromSection = async (productId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const response = await axios.delete(
        `${apiUrl}/product-sections/${selectedSection.id}/products/${productId}`
      );

      if (response.data.success) {
        notifications.show({
          title: "Success",
          message: "Product removed from section",
          color: "green",
        });
        fetchSectionProducts(selectedSection.id);
        fetchProductCounts(sections);
      }
    } catch (error) {
      console.error("Error removing product:", error);
      notifications.show({
        title: "Error",
        message: "Failed to remove product from section",
        color: "red",
      });
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

  // Filter available products (not already in section)
  const availableProducts = allProducts.filter(
    (product) =>
      !sectionProducts.some((sp) => sp.id === product.id) &&
      product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

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
            sections. You can enable/disable sections, edit section names, manage products, and
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
                  <Table.Th>Products</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th style={{ width: "180px" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.isArray(sections) && sections.filter(Boolean).map((section, index) => (
                  <Table.Tr key={section?.id ?? index}>
                    <Table.Td>
                      <Flex align="center" gap="xs">
                        <Badge variant="outline" size="sm">
                          {section?.display_order ?? index + 1}
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
                      <Badge color="blue" variant="light">
                        {productCounts[section.id] || 0} products
                      </Badge>
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
                        <Tooltip label="Manage Products">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => openManageProducts(section)}
                          >
                            <IconPackage size={16} />
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

      {/* Manage Products Modal */}
      <Modal
        opened={productsModalOpened}
        onClose={closeProductsModal}
        title={`Manage Products - ${selectedSection?.section_name}`}
        size="xl"
      >
        <Stack spacing="md">
          {/* Add Products Section */}
          <Card withBorder>
            <Stack spacing="sm">
              <Text fw={500}>Add Products to Section</Text>
              <TextInput
                placeholder="Search products..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
              />
              <MultiSelect
                placeholder="Select products to add"
                data={availableProducts.map((p) => ({
                  value: p.id.toString(),
                  label: `${p.name} (₹${p.price})`,
                }))}
                value={selectedProductIds}
                onChange={setSelectedProductIds}
                searchable
                maxDropdownHeight={200}
              />
              <Button
                onClick={addProductsToSection}
                loading={submitting}
                disabled={selectedProductIds.length === 0}
              >
                Add Selected Products
              </Button>
            </Stack>
          </Card>

          {/* Current Products Section */}
          <Card withBorder>
            <Stack spacing="sm">
              <Text fw={500}>
                Current Products ({sectionProducts.length})
              </Text>
              <LoadingOverlay visible={productsLoading} />
              {sectionProducts.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No products in this section yet
                </Text>
              ) : (
                <ScrollArea h={300}>
                  <Stack spacing="xs">
                    {sectionProducts.map((product) => (
                      <Group
                        key={product.id}
                        justify="space-between"
                        p="sm"
                        style={{
                          border: "1px solid #e9ecef",
                          borderRadius: "4px",
                        }}
                      >
                        <div>
                          <Text fw={500}>{product.name}</Text>
                          <Text size="sm" c="dimmed">
                            ₹{product.price}
                            {product.old_price && (
                              <span style={{ textDecoration: "line-through", marginLeft: "8px" }}>
                                ₹{product.old_price}
                              </span>
                            )}
                          </Text>
                        </div>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => removeProductFromSection(product.id)}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Group>
                    ))}
                  </Stack>
                </ScrollArea>
              )}
            </Stack>
          </Card>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ProductSectionsManagement;
