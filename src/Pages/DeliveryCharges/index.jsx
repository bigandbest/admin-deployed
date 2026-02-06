import { useState, useEffect } from "react";
import {
    Container,
    Paper,
    Title,
    Group,
    Button,
    Table,
    Badge,
    ActionIcon,
    Text,
    Card,
    Grid,
    Alert,
    Loader,
    Modal,
    TextInput,
    Textarea,
    NumberInput,
    Switch,
    Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaRupeeSign,
    FaToggleOn,
    FaToggleOff,
    FaShoppingCart,
    FaTruck,
} from "react-icons/fa";
import { modals } from "@mantine/modals";
import {
    getAllMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestoneActive,
} from "../../utils/deliveryChargeApi";

const DeliveryCharges = () => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [opened, { open, close }] = useDisclosure(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [formData, setFormData] = useState({
        min_order_value: 0,
        delivery_charge: 0,
        discount: 0,
        surcharge: 0,
        description: "",
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch milestones on component mount
    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        try {
            setLoading(true);
            const response = await getAllMilestones();
            setMilestones(response.data || []);
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.message || "Failed to fetch milestones",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (milestone = null) => {
        if (milestone) {
            setEditingMilestone(milestone);
            setFormData({
                min_order_value: milestone.min_order_value,
                delivery_charge: milestone.delivery_charge,
                discount: milestone.discount || 0,
                surcharge: milestone.surcharge || 0,
                description: milestone.description || "",
                is_active: milestone.is_active,
            });
        } else {
            setEditingMilestone(null);
            setFormData({
                min_order_value: 0,
                delivery_charge: 0,
                discount: 0,
                surcharge: 0,
                description: "",
                is_active: true,
            });
        }
        open();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.min_order_value < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Minimum order value must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        if (formData.delivery_charge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Delivery charge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        if (formData.surcharge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Surcharge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        try {
            setSubmitting(true);

            if (editingMilestone) {
                await updateMilestone(editingMilestone.id, formData);
                notifications.show({
                    title: "Success",
                    message: "Milestone updated successfully",
                    color: "green",
                });
            } else {
                await createMilestone(formData);
                notifications.show({
                    title: "Success",
                    message: "Milestone created successfully",
                    color: "green",
                });
            }

            close();
            fetchMilestones();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.message || "Failed to save milestone",
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmEdit = (milestone) => {
        modals.openConfirmModal({
            title: "Confirm Edit",
            children: (
                <Text size="sm">
                    Are you sure you want to edit the milestone for orders ≥ ₹
                    {milestone.min_order_value}?
                </Text>
            ),
            labels: { confirm: "Edit", cancel: "Cancel" },
            confirmProps: { color: "blue" },
            onConfirm: () => handleOpenModal(milestone),
        });
    };

    const handleDelete = (milestone) => {
        modals.openConfirmModal({
            title: "Delete Milestone",
            children: (
                <Text size="sm">
                    Are you sure you want to delete the milestone for orders ≥ ₹
                    {milestone.min_order_value}? This action cannot be undone.
                </Text>
            ),
            labels: { confirm: "Delete", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: async () => {
                try {
                    await deleteMilestone(milestone.id);
                    notifications.show({
                        title: "Success",
                        message: "Milestone deleted successfully",
                        color: "green",
                    });
                    fetchMilestones();
                } catch (error) {
                    notifications.show({
                        title: "Error",
                        message: error.message || "Failed to delete milestone",
                        color: "red",
                    });
                }
            },
        });
    };

    const handleToggleActive = async (milestone) => {
        try {
            await toggleMilestoneActive(milestone.id);
            notifications.show({
                title: "Success",
                message: `Milestone ${milestone.is_active ? "deactivated" : "activated"} successfully`,
                color: "green",
            });
            fetchMilestones();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.message || "Failed to toggle milestone status",
                color: "red",
            });
        }
    };

    // Calculate statistics
    const totalMilestones = milestones.length;
    const activeMilestones = milestones.filter((m) => m.is_active).length;

    // Statistics Card Component
    const StatCard = ({ title, value, icon, color = "blue" }) => (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
                <div>
                    <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                        {title}
                    </Text>
                    <Text size="xl" weight={700} mt="xs">
                        {value}
                    </Text>
                </div>
                <div
                    style={{
                        backgroundColor: `var(--mantine-color-${color}-1)`,
                        color: `var(--mantine-color-${color}-6)`,
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "24px",
                    }}
                >
                    {icon}
                </div>
            </Group>
        </Card>
    );

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" mt="xl">
                    <Loader size="lg" />
                </Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Paper shadow="xs" p="md" mb="xl">
                <Group justify="space-between" mb="md">
                    <div>
                        <Title order={2}>Delivery Charge Milestones</Title>
                        <Text size="sm" color="dimmed" mt="xs">
                            Configure dynamic delivery charges based on order value
                        </Text>
                    </div>
                    <Button
                        leftSection={<FaPlus />}
                        onClick={() => handleOpenModal()}
                        color="blue"
                    >
                        Add Milestone
                    </Button>
                </Group>

                {/* Statistics Cards */}
                <Grid gutter="md" mb="xl">
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Total Milestones"
                            value={totalMilestones}
                            icon={<FaShoppingCart />}
                            color="blue"
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Active Milestones"
                            value={activeMilestones}
                            icon={<FaTruck />}
                            color="green"
                        />
                    </Grid.Col>
                </Grid>

                {/* Info Alert */}
                <Alert color="blue" mb="md" title="How it works">
                    The system applies the delivery charge based on the highest milestone
                    that the order value meets or exceeds. For example, if you have
                    milestones at ₹500 (₹30 charge) and ₹1000 (free), an order of ₹750
                    will use the ₹500 milestone.
                </Alert>

                {/* Milestones Table */}
                {milestones.length === 0 ? (
                    <Alert color="yellow" title="No milestones found">
                        Get started by creating your first delivery charge milestone.
                    </Alert>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Min Order Value</Table.Th>
                                <Table.Th>Delivery Charge</Table.Th>
                                <Table.Th>Discount</Table.Th>
                                <Table.Th>Surcharge</Table.Th>
                                <Table.Th>Description</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {milestones.map((milestone) => (
                                <Table.Tr key={milestone.id}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <FaRupeeSign size={12} />
                                            <Text weight={500}>{milestone.min_order_value}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <FaRupeeSign size={12} />
                                            <Text weight={500}>
                                                {milestone.delivery_charge === 0
                                                    ? "Free"
                                                    : milestone.delivery_charge}
                                            </Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <FaRupeeSign size={12} />
                                            <Text weight={500}>{milestone.discount || 0}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <FaRupeeSign size={12} />
                                            <Text weight={500}>{milestone.surcharge || 0}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" lineClamp={2}>
                                            {milestone.description || "-"}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={milestone.is_active ? "green" : "gray"}>
                                            {milestone.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color={milestone.is_active ? "gray" : "green"}
                                                onClick={() => handleToggleActive(milestone)}
                                                title={
                                                    milestone.is_active
                                                        ? "Deactivate milestone"
                                                        : "Activate milestone"
                                                }
                                            >
                                                {milestone.is_active ? (
                                                    <FaToggleOff />
                                                ) : (
                                                    <FaToggleOn />
                                                )}
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleConfirmEdit(milestone)}
                                                title="Edit milestone"
                                            >
                                                <FaEdit />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDelete(milestone)}
                                                title="Delete milestone"
                                            >
                                                <FaTrash />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Paper>

            {/* Add/Edit Modal */}
            <Modal
                opened={opened}
                onClose={close}
                title={editingMilestone ? "Edit Milestone" : "Add Milestone"}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                        <NumberInput
                            label="Minimum Order Value (₹)"
                            placeholder="Enter minimum order value"
                            required
                            min={0}
                            value={formData.min_order_value}
                            onChange={(value) =>
                                setFormData({ ...formData, min_order_value: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                        />

                        <NumberInput
                            label="Delivery Charge (₹)"
                            placeholder="Enter delivery charge (0 for free delivery)"
                            required
                            min={0}
                            value={formData.delivery_charge}
                            onChange={(value) =>
                                setFormData({ ...formData, delivery_charge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                        />

                        <NumberInput
                            label="Discount (₹)"
                            placeholder="Enter discount amount"
                            min={0}
                            value={formData.discount}
                            onChange={(value) =>
                                setFormData({ ...formData, discount: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                        />

                        <NumberInput
                            label="Surcharge (₹)"
                            placeholder="Enter surcharge amount"
                            min={0}
                            value={formData.surcharge}
                            onChange={(value) =>
                                setFormData({ ...formData, surcharge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                        />

                        <Textarea
                            label="Description"
                            placeholder="Enter description (optional)"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            minRows={3}
                        />

                        <Switch
                            label="Active"
                            checked={formData.is_active}
                            onChange={(e) =>
                                setFormData({ ...formData, is_active: e.currentTarget.checked })
                            }
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={close} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={submitting}>
                                {editingMilestone ? "Update" : "Create"}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
};

export default DeliveryCharges;
