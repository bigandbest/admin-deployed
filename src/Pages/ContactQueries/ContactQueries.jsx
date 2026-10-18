import React, { useState, useEffect, useCallback } from "react";
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
import api from "../../utils/api";

const STATUSES = ["Pending", "Contacted", "Resolved"];
const statusColor = (status) =>
    status === "Resolved" ? "green" : status === "Contacted" ? "blue" : "yellow";
const errMsg = (error, fallback) =>
    error?.response?.data?.message || error?.response?.data?.error || fallback;

const ContactQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const fetchQueries = useCallback(async (signal) => {
        setLoading(true);
        try {
            const { data: result } = await api.get("/contact", {
                params: { page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) },
                signal,
            });
            if (result.success) {
                setQueries(result.data);
                setTotalPages(Math.max(1, result.pagination.totalPages));
            }
        } catch (error) {
            if (error.code === "ERR_CANCELED") return;
            notifications.show({ title: "Error", message: errMsg(error, "Failed to fetch queries"), color: "red" });
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [page, statusFilter]);

    // Abort the in-flight request when page/filter change so a slow older response can't win
    useEffect(() => {
        const controller = new AbortController();
        fetchQueries(controller.signal);
        return () => controller.abort();
    }, [fetchQueries]);

    const handleStatusFilter = (value) => {
        setStatusFilter(value || "");
        setPage(1);
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
                    await api.delete(`/contact/${id}`);
                    notifications.show({ title: "Success", message: "Query deleted successfully", color: "green" });
                    // Deleting the last row of a page would leave it empty: step back one page
                    if (queries.length === 1 && page > 1) setPage(page - 1);
                    else fetchQueries();
                } catch (error) {
                    notifications.show({ title: "Error", message: errMsg(error, "Failed to delete query"), color: "red" });
                }
            },
        });
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!newStatus) return;
        try {
            await api.patch(`/contact/${id}/status`, { status: newStatus });
            notifications.show({ title: "Success", message: "Status updated successfully", color: "green" });
            // The details modal renders a snapshot of the row, so close it rather than show a stale status
            modals.closeAll();
            fetchQueries();
        } catch (error) {
            notifications.show({ title: "Error", message: errMsg(error, "Failed to update status"), color: "red" });
        }
    };

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
                            <Badge color={statusColor(query.status)}>
                                {query.status}
                            </Badge>
                            <Select
                                data={STATUSES}
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
                <Badge color={statusColor(query.status)}>
                    {query.status}
                </Badge>
            </Table.Td>
            <Table.Td>{new Date(query.created_at).toLocaleDateString()}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <ActionIcon variant="light" color="blue" aria-label="View query" onClick={() => openViewModal(query)}>
                        <FaEye size={16} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" aria-label="Delete query" onClick={() => handleDelete(query.id)}>
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
                    data={STATUSES}
                    value={statusFilter || null}
                    onChange={handleStatusFilter}
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
