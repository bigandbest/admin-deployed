import React, { useState, useEffect } from "react";
import { 
  Card, 
  Title, 
  Table, 
  Badge, 
  Group,
  Text,
  Loader,
  Center,
  Stack,
  Button,
  Modal,
  NumberInput,
  Divider
} from "@mantine/core";
import { FaHandshake, FaCheck, FaTimes } from "react-icons/fa";
import { getNegotiations, acceptCounterOffer, declineCounterOffer } from "../../utils/sellerApi";
import { notifications } from "@mantine/notifications";

const statusColors = {
  PENDING_APPROVAL: "yellow",
  ACTION_REQUIRED: "orange",
  APPROVED: "green",
  REJECTED: "red"
};

export default function Negotiations() {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModalOpened, setActionModalOpened] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [newOfferPrice, setNewOfferPrice] = useState("");

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const result = await getNegotiations();
      if (result.success) {
        setNegotiations(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching negotiations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (negotiationId) => {
    try {
      const result = await acceptCounterOffer(negotiationId);
      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Counter offer accepted successfully!",
          color: "green"
        });
        fetchNegotiations();
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to accept offer",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred",
        color: "red"
      });
    }
  };

  const handleDecline = (negotiation) => {
    setSelectedNegotiation(negotiation);
    setNewOfferPrice(negotiation.yourOfferPrice || "");
    setActionModalOpened(true);
  };

  const handleSubmitCounterOffer = async () => {
    if (!newOfferPrice || newOfferPrice <= 0) {
      notifications.show({
        title: "Error",
        message: "Please enter a valid offer price",
        color: "red"
      });
      return;
    }

    try {
      const result = await declineCounterOffer(selectedNegotiation.id, newOfferPrice);
      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Counter offer submitted successfully!",
          color: "green"
        });
        setActionModalOpened(false);
        fetchNegotiations();
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to submit counter offer",
          color: "red"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred",
        color: "red"
      });
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
          <Title order={2} className="mb-1">Price Negotiations</Title>
          <Text c="dimmed" size="sm">Manage price negotiations with admin</Text>
        </div>

        {/* Negotiations Table */}
        {negotiations.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <FaHandshake size={48} className="text-gray-300" />
              <Text c="dimmed" size="lg">No active negotiations</Text>
              <Text c="dimmed" size="sm">Price negotiations will appear here</Text>
            </Stack>
          </Center>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Your Offer</Table.Th>
                <Table.Th>Admin Counter</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {negotiations.map((negotiation) => (
                <Table.Tr key={negotiation.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{negotiation.productName}</Text>
                      <Badge variant="light" size="xs">{negotiation.productCode}</Badge>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Text>{negotiation.quantity || 0} units</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600}>₹{negotiation.yourOfferPrice?.toLocaleString() || 0}</Text>
                  </Table.Td>
                  <Table.Td>
                    {negotiation.adminCounterPrice ? (
                      <Text fw={600} className="text-orange-600">
                        ₹{negotiation.adminCounterPrice.toLocaleString()}
                      </Text>
                    ) : (
                      <Text c="dimmed">Pending</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={statusColors[negotiation.status] || "gray"}
                      variant="light"
                    >
                      {negotiation.status?.replace("_", " ") || "Unknown"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {negotiation.status === "ACTION_REQUIRED" && negotiation.adminCounterPrice && (
                      <Group gap="xs">
                        <Button
                          size="xs"
                          color="green"
                          leftSection={<FaCheck size={12} />}
                          onClick={() => handleAccept(negotiation.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          leftSection={<FaTimes size={12} />}
                          onClick={() => handleDecline(negotiation)}
                        >
                          Counter
                        </Button>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Counter Offer Modal */}
      <Modal
        opened={actionModalOpened}
        onClose={() => setActionModalOpened(false)}
        title="Submit Counter Offer"
        size="md"
      >
        {selectedNegotiation && (
          <Stack gap="md">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Text size="sm" fw={500} className="mb-2">Admin's Counter Offer</Text>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Admin offered:</Text>
                <Text fw={700} className="text-orange-600">
                  ₹{selectedNegotiation.adminCounterPrice?.toLocaleString()}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">For quantity:</Text>
                <Text fw={600}>{selectedNegotiation.quantity} units</Text>
              </Group>
            </div>

            <Divider />

            <div>
              <Text fw={500} className="mb-2">Your Decision</Text>
              <Text size="sm" c="dimmed" className="mb-3">
                Enter a new offer price to continue negotiation
              </Text>
              
              <NumberInput
                label="Your New Offer Price"
                placeholder="Enter new price per unit"
                value={newOfferPrice}
                onChange={setNewOfferPrice}
                leftSection="₹"
                min={0}
                required
                size="md"
              />
            </div>

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setActionModalOpened(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitCounterOffer}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Submit Counter Offer
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
