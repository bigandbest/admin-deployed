import React, { useState, useEffect } from "react";
import { 
  Card, 
  Title, 
  Table, 
  Badge, 
  Select, 
  Group,
  Text,
  Loader,
  Center,
  Stack,
  Grid
} from "@mantine/core";
import { FaWallet, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { getSellerEarnings } from "../../utils/sellerApi";

export default function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const result = await getSellerEarnings(period);
      if (result.success) {
        setEarnings(result.data.summary || {});
        setTransactions(result.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
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
      {/* Summary Cards */}
      <Grid gutter="md" className="mb-6">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card className="mantine-card" padding="lg" radius="md">
            <Group justify="space-between" className="mb-3">
              <Text c="dimmed" size="sm">Total Earnings</Text>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FaWallet className="text-green-500" size={20} />
              </div>
            </Group>
            <Text size="xl" fw={700} className="text-green-600">
              ₹{earnings?.totalEarnings?.toLocaleString() || 0}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card className="mantine-card" padding="lg" radius="md">
            <Group justify="space-between" className="mb-3">
              <Text c="dimmed" size="sm">Pending Amount</Text>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <FaArrowUp className="text-orange-500" size={20} />
              </div>
            </Group>
            <Text size="xl" fw={700} className="text-orange-600">
              ₹{earnings?.pendingAmount?.toLocaleString() || 0}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card className="mantine-card" padding="lg" radius="md">
            <Group justify="space-between" className="mb-3">
              <Text c="dimmed" size="sm">Paid Amount</Text>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FaArrowDown className="text-blue-500" size={20} />
              </div>
            </Group>
            <Text size="xl" fw={700} className="text-blue-600">
              ₹{earnings?.paidAmount?.toLocaleString() || 0}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Transactions Table */}
      <Card className="mantine-card" padding="lg" radius="md">
        <Group justify="space-between" className="mb-6">
          <div>
            <Title order={2} className="mb-1">Transaction History</Title>
            <Text c="dimmed" size="sm">Track all your earnings and payments</Text>
          </div>
          <Select
            placeholder="Select period"
            data={[
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "year", label: "This Year" },
              { value: "all", label: "All Time" },
            ]}
            value={period}
            onChange={setPeriod}
            className="w-48"
          />
        </Group>

        {transactions.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <FaWallet size={48} className="text-gray-300" />
              <Text c="dimmed" size="lg">No transactions yet</Text>
              <Text c="dimmed" size="sm">Your earnings will appear here</Text>
            </Stack>
          </Center>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Order ID</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transactions.map((transaction) => (
                <Table.Tr key={transaction.id}>
                  <Table.Td>
                    <Text size="sm">
                      {transaction.date ? new Date(transaction.date).toLocaleDateString() : "N/A"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{transaction.description}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">#{transaction.orderId}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} className="text-green-600">
                      ₹{transaction.amount?.toLocaleString() || 0}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={transaction.status === "PAID" ? "green" : "orange"}
                      variant="light"
                    >
                      {transaction.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
