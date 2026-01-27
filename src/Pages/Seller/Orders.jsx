import React, { useState, useEffect } from "react";
import { 
  Card, 
  Title, 
  Table, 
  Badge, 
  TextInput, 
  Select, 
  Group,
  ActionIcon,
  Text,
  Loader,
  Center,
  Pagination,
  Stack,
  Modal,
  Divider
} from "@mantine/core";
import { FaSearch, FaEye } from "react-icons/fa";
import { getSellerOrders, getOrderDetails } from "../../utils/sellerApi";

const statusColors = {
  PENDING: "yellow",
  CONFIRMED: "blue",
  PROCESSING: "cyan",
  SHIPPED: "violet",
  DELIVERED: "green",
  CANCELLED: "red"
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpened, setOrderModalOpened] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters = {
        page,
        limit: 10,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      
      const result = await getSellerOrders(filters);
      if (result.success) {
        setOrders(result.data.orders || []);
        setTotalPages(result.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleViewOrder = async (orderId) => {
    try {
      const result = await getOrderDetails(orderId);
      if (result.success) {
        setSelectedOrder(result.data);
        setOrderModalOpened(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
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
        <div className="mb-6">
          <Title order={2} className="mb-1">Orders</Title>
          <Text c="dimmed" size="sm">Track your product orders and earnings</Text>
        </div>

        {/* Filters */}
        <Group className="mb-6">
          <TextInput
            placeholder="Search by order ID or product..."
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
              { value: "PENDING", label: "Pending" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "SHIPPED", label: "Shipped" },
              { value: "DELIVERED", label: "Delivered" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
        </Group>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <Text c="dimmed" size="lg">No orders found</Text>
              <Text c="dimmed" size="sm">Orders for your products will appear here</Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table highlightOnHover className="mb-4">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Order ID</Table.Th>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Quantity</Table.Th>
                  <Table.Th>Your Rate</Table.Th>
                  <Table.Th>Total Payable</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.map((order) => (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text fw={500}>#{order.orderId || order.id}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{order.productName || "Product"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{order.quantity || 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>₹{order.sellerRate?.toLocaleString() || 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={700} className="text-green-600">
                        ₹{((order.sellerRate || 0) * (order.quantity || 1)).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={statusColors[order.status] || "gray"}
                        variant="light"
                      >
                        {order.status || "Unknown"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon 
                        variant="light" 
                        color="blue"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <FaEye size={16} />
                      </ActionIcon>
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

      {/* Order Details Modal */}
      <Modal
        opened={orderModalOpened}
        onClose={() => setOrderModalOpened(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Order ID</Text>
                <Text fw={600}>#{selectedOrder.orderId || selectedOrder.id}</Text>
              </div>
              <Badge 
                color={statusColors[selectedOrder.status] || "gray"}
                size="lg"
              >
                {selectedOrder.status}
              </Badge>
            </Group>

            <Divider />

            <div>
              <Text fw={600} className="mb-3">Product Details</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Product Name</Text>
                  <Text size="sm">{selectedOrder.productName}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Product Code</Text>
                  <Badge variant="light">{selectedOrder.productCode}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Quantity</Text>
                  <Text size="sm" fw={600}>{selectedOrder.quantity}</Text>
                </Group>
              </Stack>
            </div>

            <Divider />

            <div>
              <Text fw={600} className="mb-3">Payment Details</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Your Rate (Per Unit)</Text>
                  <Text size="sm" fw={600}>₹{selectedOrder.sellerRate?.toLocaleString()}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Total Quantity</Text>
                  <Text size="sm">{selectedOrder.quantity}</Text>
                </Group>
                <Group justify="space-between" className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Text fw={700}>Total Payable to You</Text>
                  <Text fw={700} className="text-green-600">
                    ₹{((selectedOrder.sellerRate || 0) * (selectedOrder.quantity || 1)).toLocaleString()}
                  </Text>
                </Group>
              </Stack>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Text size="xs" c="dimmed">
                Note: This amount will be credited to your wallet once the order is delivered successfully.
              </Text>
            </div>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
