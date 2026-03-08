import React, { useState, useEffect } from "react";
import {
    Card,
    Text,
    Button,
    Group,
    Table,
    ActionIcon,
    Modal,
    TextInput,
    NumberInput,
    LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import api from "../../utils/api";

const RiderPayoutRules = () => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const form = useForm({
        initialValues: {
            min_order_value: 0,
            max_order_value: 0,
            base_pay_per_km: 0,
        },
        validate: {
            min_order_value: (value) => (value < 0 ? "Cannot be negative" : null),
            max_order_value: (value, values) =>
                value <= values.min_order_value
                    ? "Must be greater than Min Order Value"
                    : null,
            base_pay_per_km: (value) => (value <= 0 ? "Must be greater than 0" : null),
        },
    });

    const fetchMilestones = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/rider-payouts");
            if (response.data.success) {
                setMilestones(response.data.data);
            }
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Failed to fetch payout rules",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMilestones();
    }, []);

    const handleOpenModal = (item = null) => {
        if (item) {
            form.setValues({
                min_order_value: Number(item.min_order_value),
                max_order_value: Number(item.max_order_value),
                base_pay_per_km: Number(item.base_pay_per_km),
            });
            setEditingId(item.id);
        } else {
            form.reset();
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/admin/rider-payouts/${editingId}`, values);
                notifications.show({
                    title: "Success",
                    message: "Payout rule updated",
                    color: "green",
                });
            } else {
                await api.post("/admin/rider-payouts", values);
                notifications.show({
                    title: "Success",
                    message: "Payout rule created",
                    color: "green",
                });
            }
            setIsModalOpen(false);
            fetchMilestones();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to save rule",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this rule?")) return;
        setLoading(true);
        try {
            await api.delete(`/admin/rider-payouts/${id}`);
            notifications.show({
                title: "Success",
                message: "Payout rule deleted",
                color: "green",
            });
            fetchMilestones();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Failed to delete rule",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 relative">
            <LoadingOverlay visible={loading} />

            <Group justify="space-between" mb="md">
                <div>
                    <Text size="xl" fw={700}>Rider Payout Rules</Text>
                    <Text size="sm" color="dimmed">
                        Manage per-km payout rates based on total order value
                    </Text>
                </div>
                <Button leftSection={<FaPlus />} onClick={() => handleOpenModal()}>
                    Add Rule
                </Button>
            </Group>

            <Card shadow="sm" p="lg" radius="md" withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Order Value Range (₹)</Table.Th>
                            <Table.Th>Base Pay per KM (₹)</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {milestones.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={3} className="text-center text-gray-500 py-4">
                                    No payout rules configured
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            milestones.map((item) => (
                                <Table.Tr key={item.id}>
                                    <Table.Td>
                                        ₹{Number(item.min_order_value).toFixed(2)} - ₹{Number(item.max_order_value).toFixed(2)}
                                    </Table.Td>
                                    <Table.Td className="font-semibold text-blue-600">
                                        ₹{Number(item.base_pay_per_km).toFixed(2)} / km
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <ActionIcon color="blue" onClick={() => handleOpenModal(item)}>
                                                <FaEdit />
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={() => handleDelete(item.id)}>
                                                <FaTrash />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>
            </Card>

            <Modal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Payout Rule" : "Add Payout Rule"}
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <NumberInput
                        label="Min Order Value (₹)"
                        description="Minimum cart total to trigger this rate"
                        required
                        min={0}
                        mb="sm"
                        {...form.getInputProps("min_order_value")}
                    />
                    <NumberInput
                        label="Max Order Value (₹)"
                        description="Maximum cart total to trigger this rate"
                        required
                        min={0}
                        mb="sm"
                        {...form.getInputProps("max_order_value")}
                    />
                    <NumberInput
                        label="Base Pay per KM (₹)"
                        description="Amount paid per km of delivery distance"
                        required
                        min={0}
                        mb="xl"
                        {...form.getInputProps("base_pay_per_km")}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Rule</Button>
                    </Group>
                </form>
            </Modal>
        </div>
    );
};

export default RiderPayoutRules;
