import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Title,
    Text,
    Stack,
    Group,
    TextInput,
    Textarea,
    Button,
    Card,
    Table,
    Badge,
    ActionIcon,
    Tooltip,
    Alert,
    LoadingOverlay,
    Divider,
} from '@mantine/core';
import {
    IconBuildingBank,
    IconCreditCard,
    IconInfoCircle,
    IconHistory,
    IconCheck,
    IconAlertCircle,
    IconPlus,
    IconUser,
    IconPhone,
} from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { getActiveBankAccount, saveBankAccount, getAllBankAccounts } from '../api/bankAccountApi';

export default function BankAccountSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeAccount, setActiveAccount] = useState(null);
    const [history, setHistory] = useState([]);
    
    const [form, setForm] = useState({
        account_holder_name: '',
        account_number: '',
        bank_name: '',
        ifsc_code: '',
        upi_id: '',
        instructions: '',
        admin_name: '',
        admin_phone: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const activeRes = await getActiveBankAccount().catch(() => ({ success: true, data: null }));
            const historyRes = await getAllBankAccounts();
            
            if (activeRes.success && activeRes.data) {
                setActiveAccount(activeRes.data);
                setForm({
                    account_holder_name: activeRes.data.account_holder_name || '',
                    account_number: activeRes.data.account_number || '',
                    bank_name: activeRes.data.bank_name || '',
                    ifsc_code: activeRes.data.ifsc_code || '',
                    upi_id: activeRes.data.upi_id || '',
                    instructions: activeRes.data.instructions || '',
                    admin_name: activeRes.data.admin_name || '',
                    admin_phone: activeRes.data.admin_phone || '',
                });
            }
            
            if (historyRes.success) {
                setHistory(historyRes.data);
            }
        } catch (error) {
            console.error('Error fetching bank data:', error);
            showNotification({
                title: 'Error',
                message: 'Failed to fetch bank account settings',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await saveBankAccount(form);
            if (res.success) {
                showNotification({
                    title: 'Success',
                    message: 'Bank account settings updated successfully',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                });
                fetchData(); // Refresh both active and history
            }
        } catch (error) {
            showNotification({
                title: 'Error',
                message: error.message || 'Failed to save settings',
                color: 'red',
                icon: <IconAlertCircle size={18} />,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container size="lg" py="xl">
            <Stack spacing="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title fw={900} order={1}>Bank Account Settings</Title>
                        <Text color="dimmed">Manage company bank accounts for Rider COD deposits</Text>
                    </div>
                </Group>

                <Group grow align="flex-start">
                    {/* Active Settings Form */}
                    <Card withBorder shadow="sm" radius="md" p="xl" style={{ position: 'relative' }}>
                        <LoadingOverlay visible={loading || saving} overlayBlur={2} />
                        <form onSubmit={handleSave}>
                            <Stack spacing="md">
                                <Group spacing="xs">
                                    <IconBuildingBank size={20} color="var(--mantine-color-blue-filled)" />
                                    <Title order={3}>Configure Account</Title>
                                </Group>
                                
                                <Alert icon={<IconInfoCircle size={16} />} title="Note" color="blue" variant="light">
                                    Updating these details will automatically deactivate the previous account. Riders will see the new details immediately.
                                </Alert>

                                <TextInput
                                    label="Account Holder Name"
                                    placeholder="e.g. Big Bast Mart Pvt Ltd"
                                    required
                                    value={form.account_holder_name}
                                    onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                                />

                                <Group grow>
                                    <TextInput
                                        label="Bank Name"
                                        placeholder="e.g. HDFC Bank"
                                        required
                                        value={form.bank_name}
                                        onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                    />
                                    <TextInput
                                        label="IFSC Code"
                                        placeholder="e.g. HDFC0001234"
                                        required
                                        value={form.ifsc_code}
                                        onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })}
                                    />
                                </Group>

                                <TextInput
                                    label="Account Number"
                                    placeholder="Enter full account number"
                                    required
                                    value={form.account_number}
                                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                                    leftSection={<IconCreditCard size={18} />}
                                />

                                <TextInput
                                    label="UPI ID (Optional)"
                                    placeholder="e.g. bigbastmart@upi"
                                    value={form.upi_id}
                                    onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                                />

                                <Divider label="Admin Support Contact" labelPosition="center" />

                                <Group grow>
                                    <TextInput
                                        label="Admin Support Name"
                                        placeholder="e.g. Support Team"
                                        value={form.admin_name}
                                        onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                                        leftSection={<IconUser size={18} />}
                                    />
                                    <TextInput
                                        label="Support Phone"
                                        placeholder="e.g. +91 9876543210"
                                        value={form.admin_phone}
                                        onChange={(e) => setForm({ ...form, admin_phone: e.target.value })}
                                        leftSection={<IconPhone size={18} />}
                                    />
                                </Group>

                                <Textarea
                                    label="Additional Instructions"
                                    placeholder="Any specific note for riders..."
                                    minRows={3}
                                    value={form.instructions}
                                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                />

                                <Button 
                                    type="submit" 
                                    size="md" 
                                    mt="md"
                                    leftSection={<IconPlus size={18} />}
                                    loading={saving}
                                >
                                    Activate New Account
                                </Button>
                            </Stack>
                        </form>
                    </Card>

                    {/* History / Audit Log */}
                    <Card withBorder shadow="sm" radius="md" p="xl">
                        <Stack spacing="md">
                            <Group spacing="xs">
                                <IconHistory size={20} color="var(--mantine-color-gray-filled)" />
                                <Title order={3}>Account History</Title>
                            </Group>

                            <Table striped highlightOnHover withColumnBorders verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Bank / Account</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Activated On</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {history.map((item) => (
                                        <Table.Tr key={item.id}>
                                            <Table.Td>
                                                <Stack spacing={2}>
                                                    <Text size="sm" fw={500}>{item.bank_name}</Text>
                                                    <Text size="xs" color="dimmed">A/c: {item.account_number}</Text>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={item.is_active ? 'green' : 'gray'} variant="light">
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs">{new Date(item.created_at).toLocaleDateString()}</Text>
                                                <Text size="xs" color="dimmed">{new Date(item.created_at).toLocaleTimeString()}</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                    {history.length === 0 && (
                                        <Table.Tr>
                                            <Table.Td colSpan={3} align="center" py="xl">
                                                <Text color="dimmed">No history available</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                    </Card>
                </Group>
            </Stack>
        </Container>
    );
}
