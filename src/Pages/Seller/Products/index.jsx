import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Title,
  Button,
  Table,
  Badge,
  TextInput,
  Select,
  Group,
  ActionIcon,
  Text,
  Menu,
  Loader,
  Center,
  Pagination,
  Stack,
  Modal,
  Drawer,
} from "@mantine/core";
import { FaPlus, FaEdit, FaEllipsisV, FaSearch, FaBox, FaTruck } from "react-icons/fa";
import { getSellerProducts, addProductStock } from "../../../utils/sellerApi";
import { notifications } from "@mantine/notifications";

const statusColors = {
  APPROVED: "green",
  PENDING_APPROVAL: "orange",
  ACTION_REQUIRED: "red",
  REJECTED: "gray"
};

function VariantEditorCard({ variant, onSaved }) {
  const [offerPrice, setOfferPrice] = useState(variant.seller_offer_price || 0);
  const [quantity, setQuantity] = useState(variant.stock_quantity || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const payload = {
        product_id: variant.product_id,
        variant_id: variant.variant_id,
        stock_quantity: parseInt(quantity, 10),
        offer_price: parseFloat(offerPrice),
        mrp: variant.mrp || null
      };

      const res = await addProductStock(payload);
      if (res.success) {
        notifications.show({ title: "Success", message: "Variant updated and sent for approval", color: "green" });
        onSaved();
      } else {
        notifications.show({ title: "Error", message: res.error || "Failed to update variant", color: "red" });
      }
    } catch (err) {
      notifications.show({ title: "Error", message: "Failed to save variant", color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card withBorder>
      <Group justify="space-between">
        <Stack gap="xs">
          <Text fw={600}>{variant.variant_name}</Text>
          <Group>
            <Badge color={statusColors[variant.status] || "gray"}>
              {variant.status?.replace("_", " ")}
            </Badge>
            <Text size="xs" c="dimmed">SKU: {variant.sku}</Text>
          </Group>
        </Stack>
        <Group>
          <TextInput
            label="Offer Price (₹)"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            disabled={variant.status === 'PENDING_APPROVAL'}
          />
          <TextInput
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={variant.status === 'PENDING_APPROVAL'}
          />
          <Button
            mt="lg"
            onClick={handleSave}
            loading={submitting}
            disabled={variant.status === 'PENDING_APPROVAL'}
          >
            Save
          </Button>
        </Group>
      </Group>
    </Card>
  );
}

export default function SellerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const filters = {
        page,
        limit: 10,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const result = await getSellerProducts(filters);
      if (result.success) {
        // Group variants by product
        const grouped = (result.data || []).reduce((acc, curr) => {
          if (!acc[curr.product_id]) {
            acc[curr.product_id] = {
              id: curr.product_id,
              product_name: curr.product_name,
              category: curr.category,
              source_type: curr.source_type,
              productCode: curr.sku?.split('-')[0] || curr.product_id?.slice(0, 8).toUpperCase(),
              variants: []
            };
          }
          acc[curr.product_id].variants.push(curr);
          return acc;
        }, {});

        setProducts(Object.values(grouped));
        setTotalPages(result.count ? Math.ceil(result.count / 10) : 1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  if (loading) {
    return (
      <Center h="80vh">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Card className="mantine-card" padding="lg" radius="md">
        {/* Header */}
        <Group justify="space-between" className="mb-6">
          <div>
            <Title order={2} className="mb-1">My Products</Title>
            <Text c="dimmed" size="sm">Manage your product inventory</Text>
          </div>
          <Button
            leftSection={<FaPlus />}
            onClick={() => navigate("/seller/add-product")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add Product
          </Button>
        </Group>

        {/* Filters */}
        <Group className="mb-6">
          <TextInput
            placeholder="Search products..."
            leftSection={<FaSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: "all", label: "All Status" },
              { value: "APPROVED", label: "Approved" },
              { value: "PENDING_APPROVAL", label: "Pending Approval" },
              { value: "ACTION_REQUIRED", label: "Action Required" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
          <Button onClick={handleSearch} variant="light">Search</Button>
        </Group>

        {/* Products Table */}
        {products.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <FaPlus size={48} className="text-gray-300" />
              <Text c="dimmed">No products found. Add your first product!</Text>
              <Button onClick={() => navigate("/seller/add-product")}>Add Product</Button>
            </Stack>
          </Center>
        ) : (
          <>
            <Table highlightOnHover className="mb-4">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product Code</Table.Th>
                  <Table.Th>Product Name</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Source Type</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td>
                      <Badge variant="light">{product.productCode}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{product.product_name}</Text>
                      <Text size="xs" c="dimmed">{product.variants.length} Variant(s)</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{product.category || "N/A"}</Text>
                    </Table.Td>
                    <Table.Td>
                      {product.source_type === "DROP_SHIP" ? (
                        <Badge color="violet" leftSection={<FaTruck size={10} />}>Drop Ship</Badge>
                      ) : (
                        <Badge color="blue" leftSection={<FaBox size={10} />}>Warehouse</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          setSelectedProduct(product);
                          setVariantsModalOpen(true);
                        }}
                      >
                        Manage Variants
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="center" className="mt-4">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={setPage}
                />
              </Group>
            )}
          </>
        )}
      </Card>

      {/* Manage Variants Modal */}
      <Modal
        opened={variantsModalOpen}
        onClose={() => setVariantsModalOpen(false)}
        title={selectedProduct ? `Manage Variants: ${selectedProduct.product_name}` : ""}
        size="xl"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Set your stock quantity and offer price for each individual variant.
          </Text>
          {selectedProduct?.variants.map(variant => (
            <VariantEditorCard
              key={variant.id}
              variant={variant}
              onSaved={fetchProducts}
            />
          ))}
        </Stack>
      </Modal>
    </div>
  );
}
