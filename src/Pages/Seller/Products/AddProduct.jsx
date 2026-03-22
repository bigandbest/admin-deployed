import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Title,
  Button,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  Group,
  Stack,
  Text,
  Modal,
  Table,
  Badge,
  FileInput,
  Divider
} from "@mantine/core";
import { FaSearch, FaPlus, FaImage } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { searchMasterProducts, requestToSellProduct, requestNewProduct } from "../../../utils/sellerApi";

export default function AddProduct() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New product request data
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductImage, setNewProductImage] = useState(null);
  const [requestModalOpened, setRequestModalOpened] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter a search term",
        color: "red"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await searchMasterProducts(searchTerm);
      if (result.success) {
        setSearchResults(result.data || []);
        if (result.data.length === 0) {
          notifications.show({
            title: "No Results",
            message: "Product not found. Would you like to request a new product?",
            color: "yellow"
          });
        }
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to search products",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      notifications.show({ title: "Info", message: "Product is already in your list", color: "blue" });
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    notifications.show({ title: "Added", message: `${product.name} added to request list`, color: "green" });
  };

  const handleRemoveFromCart = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleSubmitBatchRequest = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setLoading(true);
      const productIds = selectedProducts.map(p => p.id);

      const result = await requestToSellProduct({ productIds });

      if (result.success) {
        notifications.show({
          title: "Success",
          message: `Successfully requested ${selectedProducts.length} product(s)!`,
          color: "green"
        });
        setSelectedProducts([]);
        navigate("/seller/products");
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to request products",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred while requesting access",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewProductRequest = async () => {
    if (!newProductName || !newProductDescription) {
      notifications.show({
        title: "Error",
        message: "Please fill in all required fields",
        color: "red"
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", newProductName);
      formData.append("description", newProductDescription);
      if (newProductImage) {
        formData.append("image", newProductImage);
      }

      const result = await requestNewProduct(formData);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Product request submitted! Admin will review and share the product code.",
          color: "green"
        });
        setRequestModalOpened(false);
        navigate("/seller/products");
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to submit product request",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred while submitting request",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="mantine-card" padding="lg" radius="md">
        {/* Step 1: Search Product */}
        <div className="mb-6">
          <Title order={2} className="mb-2">Sell an Existing Product</Title>
          <Text c="dimmed" size="sm">Search for products in the master database to add to your catalog</Text>
        </div>

        <Stack gap="lg">
          <Group>
            <TextInput
              placeholder="Search by product name, code, or description..."
              leftSection={<FaSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
              size="md"
            />
            <Button onClick={handleSearch} loading={loading} size="md">
              Search
            </Button>
            {/* Removed Request New Product as per instruction */}
          </Group>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <Text fw={600} className="mb-3">Search Results</Text>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Product Code</Table.Th>
                    <Table.Th>Product Name</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {searchResults.map((product) => (
                    <Table.Tr key={product.id}>
                      <Table.Td>
                        <Badge variant="light">{product.code || product.sku}</Badge>
                      </Table.Td>
                      <Table.Td>{product.name || product.title}</Table.Td>
                      <Table.Td>{product.category || "N/A"}</Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Request List
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}

          <Divider my="sm" />

          {/* Selected Products Cart */}
          {selectedProducts.length > 0 && (
            <div>
              <Group justify="space-between" className="mb-3">
                <Text fw={600}>Selected Products ({selectedProducts.length})</Text>
                <Button
                  onClick={handleSubmitBatchRequest}
                  loading={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Request for {selectedProducts.length} Product(s)
                </Button>
              </Group>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Product Code</Table.Th>
                    <Table.Th>Product Name</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedProducts.map((product) => (
                    <Table.Tr key={`cart-${product.id}`}>
                      <Table.Td>
                        <Badge variant="light" color="gray">{product.code || product.sku}</Badge>
                      </Table.Td>
                      <Table.Td>{product.name || product.title}</Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() => handleRemoveFromCart(product.id)}
                        >
                          Remove
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}
        </Stack>
      </Card>

      {/* New Product Request Modal */}
      <Modal
        opened={requestModalOpened}
        onClose={() => setRequestModalOpened(false)}
        title="Request New Product"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Can't find your product? Submit a request and the admin will add it to the master database.
          </Text>

          <TextInput
            label="Product Name"
            placeholder="Enter product name"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            required
          />

          <Textarea
            label="Product Description"
            placeholder="Describe the product in detail"
            value={newProductDescription}
            onChange={(e) => setNewProductDescription(e.target.value)}
            required
            minRows={4}
          />

          <FileInput
            label="Product Image"
            placeholder="Upload product image"
            accept="image/*"
            leftSection={<FaImage />}
            value={newProductImage}
            onChange={setNewProductImage}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setRequestModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitNewProductRequest}
              loading={loading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Submit Request
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
