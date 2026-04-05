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
  Divider,
  Button,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { FaSearch, FaEye, FaCheck, FaCopy } from "react-icons/fa";
import { getSellerSubOrders, acceptSellerSubOrder } from "../../utils/sellerApi";
import { notifications } from "@mantine/notifications";

const statusColors = {
  pending: "yellow",
  confirmed: "blue",
  picked: "orange",
  out_for_delivery: "violet",
  delivered: "green",
  cancelled: "red",
};

const statusLabels = {
  pending: "Pending Acceptance",
  confirmed: "Accepted",
  picked: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function SellerOrders() {
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpened, setOrderModalOpened] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

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
      };
      const result = await getSellerSubOrders(filters);
      console.log('Seller sub-orders response:', result);
      if (result.success) {
        setSubOrders(result.data || []);
        setTotalPages(result.pagination?.pages || 1);
      } else {
        console.error('Sub-orders fetch failed:', result.error);
      }
    } catch (error) {
      console.error("Error fetching sub-orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderModalOpened(true);
  };

  const handleAccept = async (subOrderId) => {
    setAcceptingId(subOrderId);
    try {
      const result = await acceptSellerSubOrder(subOrderId);
      if (result.success) {
        notifications.show({
          title: "Order Accepted",
          message: `Delivery OTP: ${result.data?.delivery_otp || "—"}. Share this with the customer.`,
          color: "green",
          autoClose: 8000,
        });
        fetchOrders();
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to accept order",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to accept order", color: "red" });
    } finally {
      setAcceptingId(null);
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
        <div className="mb-6">
          <Title order={2} className="mb-1">Orders</Title>
          <Text c="dimmed" size="sm">Orders containing your products. Accept them to confirm fulfillment.</Text>
        </div>

        <Group className="mb-6">
          <Select
            placeholder="Filter by status"
            data={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending Acceptance" },
              { value: "confirmed", label: "Accepted" },
              { value: "picked", label: "Picked Up" },
              { value: "out_for_delivery", label: "Out for Delivery" },
              { value: "delivered", label: "Delivered" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-56"
          />
        </Group>

        {subOrders.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <Text c="dimmed" size="lg">No orders found</Text>
              <Text c="dimmed" size="sm">Orders containing your products will appear here</Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table highlightOnHover className="mb-4">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Sub-Order ID</Table.Th>
                  <Table.Th>Items</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Delivery OTP</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {subOrders.map((order) => (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">#{order.id?.slice(-8)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{order.items?.length || 0} item(s)</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{order.customer?.name || "—"}</Text>
                      <Text size="xs" c="dimmed">{order.customer?.pincode}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={statusColors[order.fulfillment_status] || "gray"} variant="light">
                        {statusLabels[order.fulfillment_status] || order.fulfillment_status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {order.delivery_otp ? (
                        <Group gap={6}>
                          <Text fw={700} size="sm" style={{ letterSpacing: 2 }}>{order.delivery_otp}</Text>
                          <CopyButton value={order.delivery_otp} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? "Copied!" : "Copy OTP"} withArrow>
                                <ActionIcon size="xs" color={copied ? "teal" : "gray"} variant="subtle" onClick={copy}>
                                  <FaCopy size={12} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="light" color="blue" onClick={() => handleViewOrder(order)}>
                          <FaEye size={16} />
                        </ActionIcon>
                        {order.fulfillment_status === "pending" && (
                          <ActionIcon
                            variant="filled"
                            color="green"
                            loading={acceptingId === order.id}
                            onClick={() => handleAccept(order.id)}
                            title="Accept Order"
                          >
                            <FaCheck size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="center" className="mt-4">
                <Pagination total={totalPages} value={page} onChange={setPage} />
              </Group>
            )}
          </>
        )}
      </Card>

      {/* Order Details Modal */}
      <Modal
        opened={orderModalOpened}
        onClose={() => setOrderModalOpened(false)}
        title="Sub-Order Details"
        size="lg"
      >
        {selectedOrder && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Sub-Order ID</Text>
                <Text fw={600}>#{selectedOrder.id?.slice(-8)}</Text>
              </div>
              <Badge color={statusColors[selectedOrder.fulfillment_status] || "gray"} size="lg">
                {statusLabels[selectedOrder.fulfillment_status] || selectedOrder.fulfillment_status}
              </Badge>
            </Group>

            {selectedOrder.delivery_otp && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Text size="sm" c="dimmed" mb={4}>Delivery OTP — show this to the customer</Text>
                <Group gap={12} align="center">
                  <Text size="32px" fw={900} style={{ letterSpacing: 6, color: '#1971c2' }}>
                    {selectedOrder.delivery_otp}
                  </Text>
                  <CopyButton value={selectedOrder.delivery_otp} timeout={2000}>
                    {({ copied, copy }) => (
                      <Button size="xs" variant="light" color={copied ? "teal" : "blue"} onClick={copy} leftSection={<FaCopy size={12} />}>
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>The rider will need this OTP to complete delivery</Text>
              </div>
            )}

            <Divider />

            <div>
              <Text fw={600} mb={8}>Customer</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Name</Text>
                  <Text size="sm">{selectedOrder.customer?.name || "—"}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Phone</Text>
                  <Text size="sm">{selectedOrder.customer?.phone || "—"}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Delivery Address</Text>
                  <Text size="sm" ta="right" style={{ maxWidth: 260 }}>{selectedOrder.customer?.address}</Text>
                </Group>
              </Stack>
            </div>

            <Divider />

            <div>
              <Text fw={600} mb={8}>Items ({selectedOrder.items?.length})</Text>
              <Stack gap="xs">
                {selectedOrder.items?.map((item, i) => (
                  <Group key={i} justify="space-between">
                    <div>
                      <Text size="sm">{item.product_name}</Text>
                      <Text size="xs" c="dimmed">{item.variant_name}</Text>
                    </div>
                    <Group gap={16}>
                      <Text size="sm">×{item.quantity}</Text>
                      <Text size="sm" fw={600}>₹{item.unit_price}</Text>
                      <Text size="sm" c="green" fw={600}>You earn: ₹{item.seller_earnings?.toFixed(2)}</Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Group justify="space-between">
                <Text fw={700}>Total Earnings</Text>
                <Text fw={700} className="text-green-600">
                  ₹{selectedOrder.totals?.total_seller_earnings?.toFixed(2) || "0.00"}
                </Text>
              </Group>
            </div>

            {selectedOrder.fulfillment_status === "pending" && (
              <Button
                fullWidth
                color="green"
                loading={acceptingId === selectedOrder.id}
                onClick={() => { handleAccept(selectedOrder.id); setOrderModalOpened(false); }}
                leftSection={<FaCheck />}
              >
                Accept Order
              </Button>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  );
}
