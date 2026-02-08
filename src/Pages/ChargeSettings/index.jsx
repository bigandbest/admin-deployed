import { useState, useEffect } from "react";
import {
    Container,
    Paper,
    Title,
    Button,
    Text,
    Card,
    Grid,
    Alert,
    Loader,
    NumberInput,
    Stack,
    Group,
    Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import {
    FaRupeeSign,
    FaHandHoldingUsd,
    FaBolt,
    FaLayerGroup,
    FaSave,
    FaEdit,
    FaTags,
} from "react-icons/fa";
import {
    getChargeSettings,
    updateChargeSettings,
} from "../../utils/chargeSettingsApi";

const ChargeSettings = () => {
    const [settings, setSettings] = useState({
        handling_charge: 0,
        surge_charge: 0,
        platform_charge: 0,
        discount_charge: 0,
        delivery_charge: 30,
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);

    // Fetch settings on component mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await getChargeSettings();
            setSettings({
                handling_charge: response.data.handling_charge || 0,
                surge_charge: response.data.surge_charge || 0,
                platform_charge: response.data.platform_charge || 0,
                discount_charge: response.data.discount_charge || 0,
                delivery_charge: response.data.delivery_charge || 30,
            });
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.message || "Failed to fetch charge settings",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmEdit = () => {
        modals.openConfirmModal({
            title: "Confirm Edit",
            children: (
                <Text size="sm">
                    Are you sure you want to edit the charge settings? These changes will
                    affect all new orders immediately.
                </Text>
            ),
            labels: { confirm: "Edit", cancel: "Cancel" },
            confirmProps: { color: "blue" },
            onConfirm: open,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (settings.handling_charge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Handling charge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        if (settings.surge_charge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Surge charge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        if (settings.platform_charge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Platform charge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        if (settings.discount_charge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Discount charge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        if (settings.delivery_charge < 0) {
            notifications.show({
                title: "Validation Error",
                message: "Delivery charge must be greater than or equal to 0",
                color: "red",
            });
            return;
        }

        try {
            setSubmitting(true);
            await updateChargeSettings(settings);
            notifications.show({
                title: "Success",
                message: "Charge settings updated successfully",
                color: "green",
            });
            close();
            fetchSettings();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.message || "Failed to update charge settings",
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Info Card Component
    const InfoCard = ({ title, value, icon, color = "blue", description }) => (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <div>
                    <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                        {title}
                    </Text>
                    <Group gap="xs" mt="xs">
                        <FaRupeeSign size={20} color={`var(--mantine-color-${color}-6)`} />
                        <Text size="xl" weight={700} color={color}>
                            {value}
                        </Text>
                    </Group>
                    {description && (
                        <Text size="xs" color="dimmed" mt="xs">
                            {description}
                        </Text>
                    )}
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
                        <Title order={2}>Charge Settings</Title>
                        <Text size="sm" color="dimmed" mt="xs">
                            Configure global charges applied to orders
                        </Text>
                    </div>
                    <Button
                        leftSection={<FaEdit />}
                        onClick={handleConfirmEdit}
                        color="blue"
                    >
                        Edit Settings
                    </Button>
                </Group>

                {/* Info Alert */}
                <Alert color="blue" mb="xl" mt="md" title="About These Charges">
                    These are fixed charges that will be applied to orders in addition to
                    delivery charges. All values are in rupees (₹).
                </Alert>

                {/* Current Values Display */}
                <Grid gutter="md" mb="xl">
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <InfoCard
                            title="Handling Charge"
                            value={settings.handling_charge}
                            icon={<FaHandHoldingUsd />}
                            color="blue"
                            description="Fee for order processing and handling"
                        />
                    </Grid.Col>
                    {/* <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <InfoCard
                            title="Surge Charge"
                            value={settings.surge_charge}
                            icon={<FaBolt />}
                            color="orange"
                            description="Additional fee during peak demand"
                        />
                    </Grid.Col> */}
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <InfoCard
                            title="Platform Charge"
                            value={settings.platform_charge}
                            icon={<FaLayerGroup />}
                            color="green"
                            description="Platform usage/service fee"
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <InfoCard
                            title="Discount"
                            value={settings.discount_charge}
                            icon={<FaTags />}
                            color="grape"
                            description="Global discount applied to orders"
                        />
                    </Grid.Col>
                    {/* <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <InfoCard
                            title="Default Delivery"
                            value={settings.delivery_charge}
                            icon={<FaRupeeSign />}
                            color="cyan"
                            description="Base delivery fee when no milestone met"
                        />
                    </Grid.Col> */}
                </Grid>
            </Paper>

            {/* Edit Modal */}
            <Modal
                opened={opened}
                onClose={close}
                title="Update Charge Settings"
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                        <NumberInput
                            label="Handling Charge (₹)"
                            placeholder="Enter handling charge"
                            required
                            min={0}
                            value={settings.handling_charge}
                            onChange={(value) =>
                                setSettings({ ...settings, handling_charge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                            description="Fee charged for order processing and handling"
                        />

                        {/* <NumberInput
                            label="Surge Charge (₹)"
                            placeholder="Enter surge charge"
                            required
                            min={0}
                            value={settings.surge_charge}
                            onChange={(value) =>
                                setSettings({ ...settings, surge_charge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                            description="Additional fee during peak demand periods"
                        /> */}

                        <NumberInput
                            label="Platform Charge (₹)"
                            placeholder="Enter platform charge"
                            required
                            min={0}
                            value={settings.platform_charge}
                            onChange={(value) =>
                                setSettings({ ...settings, platform_charge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                            description="Platform usage and service fee"
                        />

                        <NumberInput
                            label="Discount (₹)"
                            placeholder="Enter discount amount"
                            required
                            min={0}
                            value={settings.discount_charge}
                            onChange={(value) =>
                                setSettings({ ...settings, discount_charge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                            description="Global discount to substract from order total"
                        />

                        {/* <NumberInput
                            label="Default Delivery Charge (₹)"
                            placeholder="Enter base delivery charge"
                            required
                            min={0}
                            value={settings.delivery_charge}
                            onChange={(value) =>
                                setSettings({ ...settings, delivery_charge: value || 0 })
                            }
                            leftSection={<FaRupeeSign />}
                            description="Charge applied when order is below all milestones"
                        /> */}

                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={close} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={submitting}
                                leftSection={<FaSave />}
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
};

export default ChargeSettings;
