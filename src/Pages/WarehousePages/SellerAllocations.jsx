import React, { useState, useEffect } from 'react';
import {
    Card, Table, Badge, Button, Group, Text, Title,
    TextInput, ActionIcon, Menu, Modal, Box, Alert, Loader
} from '@mantine/core';
import { IconSearch, IconDotsVertical, IconCheck, IconX, IconAlertCircle, IconFileDescription } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const SellerAllocations = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [pincodeInput, setPincodeInput] = useState('');
    const [allocating, setAllocating] = useState(false);

    useEffect(() => {
        fetchUnallocatedSellers();
    }, []);

    const fetchUnallocatedSellers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const url = `${import.meta.env.VITE_API_BASE_URL}/admin/sellers/unallocated`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setSellers(data.data || []);
            } else {
                notifications.show({
                    title: 'Error',
                    message: data.error || 'Failed to fetch unallocated sellers',
                    color: 'red'
                });
            }
        } catch (error) {
            console.error('Error fetching unallocated sellers:', error);
            notifications.show({
                title: 'Error',
                message: 'Internal server error',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAllocateClick = (seller) => {
        setSelectedSeller(seller);
        setPincodeInput(seller.pincode || ''); // Default to seller's registered pincode if available
        setIsAllocateModalOpen(true);
    };

    const submitAllocation = async () => {
        if (!pincodeInput || pincodeInput.length < 6) {
            notifications.show({ title: 'Validation Error', message: 'Please enter a valid 6-digit pincode', color: 'red' });
            return;
        }

        try {
            setAllocating(true);
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/sellers/${selectedSeller.id}/allocate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pincode: pincodeInput })
            });

            const data = await response.json();

            if (data.success) {
                notifications.show({ title: 'Success', message: data.message, color: 'green' });
                setIsAllocateModalOpen(false);
                fetchUnallocatedSellers(); // Refresh list
            } else {
                notifications.show({ title: 'Error', message: data.error, color: 'red' });
            }
        } catch (error) {
            console.error('Allocation error:', error);
            notifications.show({ title: 'Error', message: 'Failed to communicate with server', color: 'red' });
        } finally {
            setAllocating(false);
        }
    };

    const filteredSellers = sellers.filter(seller =>
        (seller.business_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (seller.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (seller.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title order={2}>Seller Verification & Allocations</Title>
                    <Text c="dimmed">Review seller KYC documents and assign them to a division warehouse.</Text>
                </div>
            </div>

            <Card shadow="sm" p="lg" radius="md" withBorder>
                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                    <div className="flex-1 max-w-md">
                        <TextInput
                            placeholder="Search by business name, state, or email..."
                            icon={<IconSearch size="1.2rem" />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        />
                    </div>
                    <Button variant="light" onClick={fetchUnallocatedSellers}>
                        Refresh List
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader size="lg" />
                    </div>
                ) : filteredSellers.length === 0 ? (
                    <div className="text-center p-8">
                        <IconAlertCircle size="3rem" className="mx-auto text-gray-400 mb-2" />
                        <Text c="dimmed">No pending unallocated sellers found.</Text>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table striped highlightOnHover>
                            <thead>
                                <tr>
                                    <th>Business Info</th>
                                    <th>Contact Person</th>
                                    <th>Location Data</th>
                                    <th>KYC Docs</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSellers.map((seller) => (
                                    <tr key={seller.id}>
                                        <td>
                                            <Text fw={600} size="sm">{seller.business_name || 'N/A'}</Text>
                                            <Badge size="xs" color="gray" mt={2}>{seller.business_type || 'Retail'}</Badge>
                                        </td>
                                        <td>
                                            <Text size="sm">{seller.user?.name || 'N/A'}</Text>
                                            <Text size="xs" c="dimmed">{seller.user?.email}</Text>
                                            <Text size="xs" c="dimmed">{seller.user?.phone}</Text>
                                        </td>
                                        <td>
                                            <Text size="sm">{seller.city}, {seller.state}</Text>
                                            <Text size="xs" fw={500}>Pincode: {seller.pincode || 'N/A'}</Text>
                                        </td>
                                        <td>
                                            <Box maw={200}>
                                                <Text size="xs"><span className="font-semibold">GSTIN:</span> {seller.gstin || 'None'}</Text>
                                                <Text size="xs"><span className="font-semibold">PAN:</span> {seller.pan || 'None'}</Text>
                                                <Text size="xs" mt={2}><span className="font-semibold">Bank:</span> {seller.bank_name || 'N/A'} ({seller.bank_account_no ? `...${seller.bank_account_no.slice(-4)}` : 'N/A'})</Text>
                                            </Box>
                                        </td>
                                        <td>
                                            <Button
                                                size="xs"
                                                color="blue"
                                                leftIcon={<IconCheck size={14} />}
                                                onClick={() => handleAllocateClick(seller)}
                                            >
                                                Verify & Allocate
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Allocation Modal */}
            <Modal
                opened={isAllocateModalOpen}
                onClose={() => !allocating && setIsAllocateModalOpen(false)}
                title={<Title order={4}>Verify Seller & Assign Warehouse</Title>}
                size="md"
            >
                {selectedSeller && (
                    <div className="space-y-4">
                        <Alert icon={<IconFileDescription size="1rem" />} color="blue" variant="light">
                            Allocating a division warehouse to <b>{selectedSeller.business_name}</b> will mark their account as Verified.
                        </Alert>

                        <TextInput
                            label="Serving Pincode"
                            description="Enter the pincode where this seller physically operates. We will assign them to the local Division Warehouse serving this area."
                            placeholder="e.g. 110001"
                            required
                            value={pincodeInput}
                            onChange={(e) => setPincodeInput(e.currentTarget.value)}
                            maxLength={6}
                        />

                        <Group position="right" mt="xl">
                            <Button variant="default" onClick={() => setIsAllocateModalOpen(false)} disabled={allocating}>
                                Cancel
                            </Button>
                            <Button color="blue" onClick={submitAllocation} loading={allocating}>
                                Confirm Allocation
                            </Button>
                        </Group>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SellerAllocations;
