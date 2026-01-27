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
  Stack
} from "@mantine/core";
import { FaPlus, FaEdit, FaEllipsisV, FaSearch } from "react-icons/fa";
import { getSellerProducts } from "../../../utils/sellerApi";

const statusColors = {
  APPROVED: "green",
  PENDING_APPROVAL: "orange",
  ACTION_REQUIRED: "red",
  REJECTED: "gray"
};

export default function SellerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        setProducts(result.data.products || []);
        setTotalPages(result.data.totalPages || 1);
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
                  <Table.Th>Stock Quantity</Table.Th>
                  <Table.Th>Your Offer Price</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td>
                      <Text fw={500}>{product.productCode || product.sku}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{product.name || product.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{product.quantity || 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>₹{product.sellerOfferPrice?.toLocaleString() || 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={statusColors[product.status] || "gray"}
                        variant="light"
                      >
                        {product.status?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon 
                          variant="light" 
                          color="blue"
                          onClick={() => navigate(`/seller/products/edit/${product.id}`)}
                        >
                          <FaEdit size={16} />
                        </ActionIcon>
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <FaEllipsisV size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item>View Details</Menu.Item>
                            <Menu.Item>Update Stock</Menu.Item>
                            <Menu.Item color="red">Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
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
    </div>
  );
}
