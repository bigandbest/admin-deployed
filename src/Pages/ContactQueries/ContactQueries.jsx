import React, { useState, useEffect } from "react";
import {
    Table,
    Badge,
    ActionIcon,
    Group,
    Text,
    Paper,
    Title,
    Pagination,
    TextInput,
    Select,
    Loader,
    Button
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FaTrash, FaEye, FaSearch } from "react-icons/fa";
import { modals } from "@mantine/modals";

const ContactQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        fetchQueries();
    }, [page, statusFilter, refresh]);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            let url = `${import.meta.env.VITE_API_BASE_URL}/contact?page=${page}&limit=10`;
            if (statusFilter) {
                url += `&status=${statusFilter}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setQueries(result.data);
                setTotalPages(result.pagination.totalPages);
            } else {
                notifications.show({
                    title: "Error",
                    message: "Failed to fetch queries",
                    color: "red",
                });
            }
        } catch (error) {
            console.error("Error fetching queries:", error);
            notifications.show({
                title: "Error",
                message: "Something went wrong",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        modals.openConfirmModal({
            title: "Delete Query",
            children: (
                <Text size="sm">
                    Are you sure you want to delete this query? This action cannot be undone.
                </Text>
            ),
            labels: { confirm: "Delete", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contact/${id}`, {
                        method: "DELETE",
                    });
                    const result = await response.json();

                    if (result.success) {
                        notifications.show({
                            title: "Success",
                            message: "Query deleted successfully",
                            color: "green",
                        });
                        setRefresh(!refresh);
                    } else {
                        notifications.show({
                            title: "Error",
                            message: result.message || "Failed to delete query",
                            color: "red",
                        });
                    }
                } catch (error) {
                    console.error("Error deleting query:", error);
                    notifications.show({
                        title: "Error",
                        message: "Something went wrong",
                        color: "red",
                    });
                }
            },
        });
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contact/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            const result = await response.json();
            if (result.success) {
                notifications.show({
                    title: "Success",
                    message: "Status updated successfully",
                    color: "green",
                });
                setRefresh(!refresh);
            } else {
                notifications.show({
                    title: "Error",
                    message: result.message || "Failed to update status",
                    color: "red",
                });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            notifications.show({
                title: "Error",
                message: "Something went wrong",
                color: "red",
            });
        }
    }

    const openViewModal = (query) => {
        modals.open({
            title: "Product Request Details",
            size: "lg",
            children: (
                <div className="flex flex-col gap-4">
                    <div>
                        <Text fw={500} size="sm" c="dimmed">From</Text>
                        <Text>{query.name} ({query.email})</Text>
                    </div>
                    <div>
                        <Text fw={500} size="sm" c="dimmed">Phone</Text>
                        <Text>{query.phone}</Text>
                    </div>
                    <div>
                        <Text fw={500} size="sm" c="dimmed">Subject</Text>
                        <Text>{query.subject}</Text>
                    </div>
                    <div>
                        <Text fw={500} size="sm" c="dimmed">Quantity Requested</Text>
                        <Text>{query.quantity || 'Not specified'}</Text>
                    </div>
                    <div>
                        <Text fw={500} size="sm" c="dimmed">Product Details</Text>
                        <Paper p="md" withBorder bg="gray.1">
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{query.message}</Text>
                        </Paper>
                    </div>
                    <div>
                        <Text fw={500} size="sm" c="dimmed">Status</Text>
                        <Group>
                            <Badge color={query.status === 'Resolved' ? 'green' : query.status === 'Contacted' ? 'blue' : 'yellow'}>
                                {query.status}
                            </Badge>
                            <Select
                                data={['Pending', 'Contacted', 'Resolved']}
                                value={query.status}
                                onChange={(val) => handleStatusUpdate(query.id, val)}
                                size="xs"
                                w={120}
                            />
                        </Group>
                    </div>
                    <Text size="xs" c="dimmed">Received: {new Date(query.created_at).toLocaleString()}</Text>
                </div>
            ),
        });
    };

    const rows = queries.map((query) => (
        <Table.Tr key={query.id}>
            <Table.Td>{query.id}</Table.Td>
            <Table.Td>{query.name}</Table.Td>
            <Table.Td>{query.email}</Table.Td>
            <Table.Td>{query.subject}</Table.Td>
            <Table.Td>{query.quantity || 'N/A'}</Table.Td>
            <Table.Td>
                <Badge color={query.status === 'Resolved' ? 'green' : query.status === 'Contacted' ? 'blue' : 'yellow'}>
                    {query.status}
                </Badge>
            </Table.Td>
            <Table.Td>{new Date(query.created_at).toLocaleDateString()}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <ActionIcon variant="light" color="blue" onClick={() => openViewModal(query)}>
                        <FaEye size={16} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(query.id)}>
                        <FaTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div className="p-6">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Product Requests</Title>
                <Select
                    placeholder="Filter by Status"
                    data={['Pending', 'Contacted', 'Resolved']}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    clearable
                />
            </Group>

            <Paper shadow="xs" p="md" withBorder>
                <div className="overflow-x-auto">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Email</Table.Th>
                                <Table.Th>Subject</Table.Th>
                                <Table.Th>Quantity</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Date</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {loading ? (
                                <Table.Tr>
                                    <Table.Td colSpan={8} align="center">
                                        <Loader size="sm" />
                                    </Table.Td>
                                </Table.Tr>
                            ) : rows.length > 0 ? (
                                rows
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={8} align="center">
                                        <Text c="dimmed">No product requests found</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <Group justify="center" mt="md">
                        <Pagination total={totalPages} value={page} onChange={setPage} />
                    </Group>
                )}
            </Paper>
        </div>
    );
};

export default ContactQueries;
