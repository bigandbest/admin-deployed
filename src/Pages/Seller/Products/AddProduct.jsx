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
import { searchMasterProducts, addProductStock, requestNewProduct } from "../../../utils/sellerApi";

export default function AddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Search, 2: Add Stock or Request
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [quantity, setQuantity] = useState(100);
  const [offerPrice, setOfferPrice] = useState("");
  const [mrp, setMrp] = useState("");
  
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

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleSubmitStock = async () => {
    if (!offerPrice || offerPrice <= 0) {
      notifications.show({
        title: "Error",
        message: "Please enter a valid offer price",
        color: "red"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await addProductStock({
        productId: selectedProduct.id,
        productCode: selectedProduct.code,
        quantity,
        sellerOfferPrice: parseFloat(offerPrice),
        mrp: parseFloat(mrp) || null
      });

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Product stock added successfully! Awaiting admin approval.",
          color: "green"
        });
        navigate("/seller/products");
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to add product stock",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred while adding stock",
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
        {step === 1 ? (
          <>
            {/* Step 1: Search Product */}
            <div className="mb-6">
              <Title order={2} className="mb-2">Add Product to Inventory</Title>
              <Text c="dimmed" size="sm">Search for products in the master database</Text>
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
                <Button 
                  variant="light" 
                  leftSection={<FaPlus />}
                  onClick={() => setRequestModalOpened(true)}
                  size="md"
                >
                  Request New Product
                </Button>
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
                              onClick={() => handleSelectProduct(product)}
                            >
                              Select
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </Stack>
          </>
        ) : (
          <>
            {/* Step 2: Add Stock Details */}
            <div className="mb-6">
              <Title order={2} className="mb-2">Add Stock Details</Title>
              <Text c="dimmed" size="sm">Enter your offer price and quantity</Text>
            </div>

            <Stack gap="lg">
              {/* Selected Product Info */}
              <Card className="bg-blue-50 dark:bg-blue-900/20" padding="md">
                <Text fw={600} className="mb-2">Selected Product</Text>
                <Group>
                  <Badge size="lg">{selectedProduct?.code || selectedProduct?.sku}</Badge>
                  <Text>{selectedProduct?.name || selectedProduct?.title}</Text>
                </Group>
              </Card>

              <Divider />

              {/* Pricing Form */}
              <Group grow>
                <NumberInput
                  label="MRP (Maximum Retail Price)"
                  placeholder="Enter MRP"
                  value={mrp}
                  onChange={setMrp}
                  leftSection="₹"
                  min={0}
                  description="Optional: The printed price on the product"
                />
                <NumberInput
                  label="Your Offer Price"
                  placeholder="Enter your offer price"
                  value={offerPrice}
                  onChange={setOfferPrice}
                  leftSection="₹"
                  min={0}
                  required
                  description="The amount you want to receive for this item"
                  styles={{ input: { fontWeight: 600 } }}
                />
              </Group>

              <NumberInput
                label="Quantity"
                placeholder="Enter quantity"
                value={quantity}
                onChange={setQuantity}
                min={1}
                required
                description="Number of units you want to supply"
              />

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Text size="sm" fw={500} className="mb-2">💡 Pricing Note:</Text>
                <Text size="sm" c="dimmed">
                  Enter the exact amount you want to receive for this item. The admin will add 
                  their margin on top of your offer price to set the final selling price.
                  Your earnings are guaranteed at your offer price regardless of the final selling price.
                </Text>
              </div>

              {/* Actions */}
              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => setStep(1)}>
                  Back to Search
                </Button>
                <Button 
                  onClick={handleSubmitStock} 
                  loading={loading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Submit for Approval
                </Button>
              </Group>
            </Stack>
          </>
        )}
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
