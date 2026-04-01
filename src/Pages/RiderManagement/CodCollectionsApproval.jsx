import React, { useState, useEffect } from "react";
import {
    Card,
    Text,
    Button,
    Group,
    Table,
    Badge,
    Modal,
    Textarea,
    TextInput,
    LoadingOverlay,
    Stack,
    Image,
    Pagination,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import api from "../../utils/api";

const CodCollectionsApproval = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [filter, setFilter] = useState('PENDING_DEPOSIT');

    const form = useForm({
        initialValues: {
            notes: "",
        },
    });

    const fetchCollections = async (pageNum = 1) => {
        setLoading(true);
        try {
            const response = await api.get("/admin/cod-collections", {
                params: {
                    status: filter,
                    page: pageNum,
                    limit: 10,
                },
            });
            if (response.data.success) {
                setCollections(response.data.data);
                setTotal(response.data.pagination.pages);
                setPage(pageNum);
            }
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Failed to fetch COD collections",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections(1);
    }, [filter]);

    const openActionModal = (collection, type) => {
        setSelectedCollection(collection);
        setActionType(type);
        form.reset();
        setActionModalOpen(true);
    };

    const handleApprove = async (values) => {
        setProcessing(true);
        try {
            const response = await api.post(
                `/admin/cod-collections/${selectedCollection.id}/approve`,
                { notes: values.notes }
            );
            if (response.data.success) {
                notifications.show({
                    title: "Success",
                    message: response.data.message,
                    color: "green",
                });
                setActionModalOpen(false);
                fetchCollections(page);
            }
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to approve",
                color: "red",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (values) => {
        if (!values.notes.trim()) {
            notifications.show({
                title: "Error",
                message: "Please provide a rejection reason",
                color: "red",
            });
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post(
                `/admin/cod-collections/${selectedCollection.id}/reject`,
                { reason: values.notes }
            );
            if (response.data.success) {
                notifications.show({
                    title: "Success",
                    message: response.data.message,
                    color: "green",
                });
                setActionModalOpen(false);
                fetchCollections(page);
            }
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to reject",
                color: "red",
            });
        } finally {
            setProcessing(false);
        }
    };

    const rows = collections.map((collection) => (
        <Table.Tr key={collection.id}>
            <Table.Td>
                <Text fw={500} size="sm">
                    {collection.rider_name}
                </Text>
                <Text size="xs" c="dimmed">
                    {collection.rider_phone}
                </Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">₹{Number(collection.amount_collected).toFixed(2)}</Text>
            </Table.Td>
            <Table.Td>
                <Badge
                    color={
                        collection.status === 'PENDING_DEPOSIT'
                            ? 'yellow'
                            : collection.status === 'DEPOSIT_CLAIMED'
                            ? 'blue'
                            : collection.status === 'APPROVED'
                            ? 'green'
                            : 'red'
                    }
                >
                    {collection.status}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Text size="xs">
                    {new Date(collection.created_at).toLocaleDateString()}
                </Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    {collection.payment_proof && (
                        <Button
                            size="xs"
                            variant="light"
                            onClick={() => {
                                setSelectedCollection(collection);
                                setViewModalOpen(true);
                            }}
                            leftSection={<FaEye size={12} />}
                        >
                            View Proof
                        </Button>
                    )}
                    {['PENDING_DEPOSIT', 'DEPOSIT_CLAIMED'].includes(collection.status) && (
                        <>
                            <Button
                                size="xs"
                                color="green"
                                onClick={() => openActionModal(collection, 'approve')}
                                leftSection={<FaCheck size={12} />}
                            >
                                Approve
                            </Button>
                            <Button
                                size="xs"
                                color="red"
                                onClick={() => openActionModal(collection, 'reject')}
                                leftSection={<FaTimes size={12} />}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                <Group justify="space-between" mb="md">
                    <Text fw={500} size="lg">
                        COD Collections Approval
                    </Text>
                </Group>

                <Group gap="md" mb="md">
                    {['PENDING_DEPOSIT', 'DEPOSIT_CLAIMED', 'APPROVED', 'REJECTED'].map((status) => (
                        <Button
                            key={status}
                            variant={filter === status ? 'filled' : 'light'}
                            onClick={() => setFilter(status)}
                            size="sm"
                        >
                            {status}
                        </Button>
                    ))}
                </Group>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ position: "relative" }}>
                <LoadingOverlay visible={loading} />

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Rider</Table.Th>
                            <Table.Th>Amount</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.length > 0 ? (
                            rows
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={5} ta="center">
                                    <Text size="sm" c="dimmed">
                                        No COD collections found
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>

                {total > 1 && (
                    <Group justify="center" mt="md">
                        <Pagination value={page} onChange={fetchCollections} total={total} />
                    </Group>
                )}
            </Card>

            {/* View Proof Modal */}
            <Modal
                opened={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Payment Proof"
                size="lg"
            >
                {selectedCollection?.payment_proof && (
                    <Stack>
                        {selectedCollection.payment_proof.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <Image
                                src={selectedCollection.payment_proof}
                                alt="Payment proof"
                                fit="contain"
                            />
                        ) : (
                            <Text>
                                <a
                                    href={selectedCollection.payment_proof}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Proof →
                                </a>
                            </Text>
                        )}
                        <Text size="sm" c="dimmed">
                            Uploaded: {new Date(selectedCollection.claimed_at).toLocaleString()}
                        </Text>
                    </Stack>
                )}
            </Modal>

            {/* Action Modal */}
            <Modal
                opened={actionModalOpen}
                onClose={() => setActionModalOpen(false)}
                title={actionType === 'approve' ? 'Approve COD Deposit' : 'Reject COD Deposit'}
            >
                {selectedCollection && (
                    <form
                        onSubmit={form.onSubmit(
                            actionType === 'approve' ? handleApprove : handleReject
                        )}
                    >
                        <Stack gap="md">
                            <div>
                                <Text fw={500} size="sm">
                                    Rider: {selectedCollection.rider_name}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    Amount: ₹{Number(selectedCollection.amount_collected).toFixed(2)}
                                </Text>
                            </div>

                            {actionType === 'reject' && (
                                <Textarea
                                    label="Rejection Reason"
                                    placeholder="Explain why this deposit proof is being rejected..."
                                    rows={3}
                                    {...form.getInputProps("notes")}
                                    disabled={processing}
                                />
                            )}

                            {actionType === 'approve' && (
                                <Textarea
                                    label="Notes (Optional)"
                                    placeholder="Add any notes about this approval..."
                                    rows={3}
                                    {...form.getInputProps("notes")}
                                    disabled={processing}
                                />
                            )}

                            <Group justify="flex-end">
                                <Button
                                    variant="light"
                                    onClick={() => setActionModalOpen(false)}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    color={actionType === 'approve' ? 'green' : 'red'}
                                    loading={processing}
                                    disabled={processing}
                                >
                                    {actionType === 'approve' ? 'Approve' : 'Reject'}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default CodCollectionsApproval;
