import React, { useState, useEffect } from "react";
import {
    Card,
    Text,
    Button,
    Group,
    TextInput,
    Textarea,
    LoadingOverlay,
    Stack,
    Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "../../utils/api";

const BankAccountSettings = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            account_holder_name: "",
            account_number: "",
            bank_name: "",
            ifsc_code: "",
            upi_id: "",
            instructions: "",
        },
        validate: {
            account_holder_name: (value) =>
                value.trim().length === 0 ? "Account holder name is required" : null,
            account_number: (value) =>
                value.trim().length === 0 ? "Account number is required" : null,
            bank_name: (value) =>
                value.trim().length === 0 ? "Bank name is required" : null,
            ifsc_code: (value) => {
                if (!value.trim()) return "IFSC code is required";
                if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim())) {
                    return "Invalid IFSC code format (e.g., SBIN0001234)";
                }
                return null;
            },
        },
    });

    const fetchBankAccount = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/bank-account");
            if (response.data.success) {
                form.setValues({
                    account_holder_name: response.data.data.account_holder_name,
                    account_number: response.data.data.account_number,
                    bank_name: response.data.data.bank_name,
                    ifsc_code: response.data.data.ifsc_code,
                    upi_id: response.data.data.upi_id || "",
                    instructions: response.data.data.instructions || "",
                });
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                notifications.show({
                    title: "Error",
                    message: "Failed to fetch bank account settings",
                    color: "red",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBankAccount();
    }, []);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const response = await api.post("/admin/bank-account", values);
            if (response.data.success) {
                notifications.show({
                    title: "Success",
                    message: "Bank account settings updated successfully",
                    color: "green",
                });
                fetchBankAccount();
            }
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to save bank account",
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ position: "relative" }}>
                <LoadingOverlay visible={loading} />
                <Group justify="space-between" mb="md">
                    <Text fw={500} size="lg">
                        COD Payment Account
                    </Text>
                    <Badge color="blue">Company Account for Riders</Badge>
                </Group>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            label="Account Holder Name"
                            placeholder="e.g., Big Bast Mart Pvt Ltd"
                            {...form.getInputProps("account_holder_name")}
                            disabled={submitting}
                        />

                        <TextInput
                            label="Account Number"
                            placeholder="e.g., 1234567890123456"
                            {...form.getInputProps("account_number")}
                            disabled={submitting}
                        />

                        <TextInput
                            label="Bank Name"
                            placeholder="e.g., State Bank of India"
                            {...form.getInputProps("bank_name")}
                            disabled={submitting}
                        />

                        <TextInput
                            label="IFSC Code"
                            placeholder="e.g., SBIN0001234"
                            {...form.getInputProps("ifsc_code")}
                            disabled={submitting}
                            description="11-character IFSC code (4 letters, 0, 6 alphanumeric)"
                        />

                        <TextInput
                            label="UPI ID (Optional)"
                            placeholder="e.g., company@upi"
                            {...form.getInputProps("upi_id")}
                            disabled={submitting}
                        />

                        <Textarea
                            label="Payment Instructions for Riders (Optional)"
                            placeholder="Add any special instructions for COD transfers..."
                            rows={4}
                            {...form.getInputProps("instructions")}
                            disabled={submitting}
                        />

                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                loading={submitting}
                                disabled={submitting || loading}
                            >
                                Save Account Settings
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </div>
    );
};

export default BankAccountSettings;
