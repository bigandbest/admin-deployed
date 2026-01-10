import React, { useState, useEffect } from "react";
import {
    Card,
    Title,
    Table,
    ActionIcon,
    Group,
    Button,
    TextInput,
    Switch,
    Modal,
    Image,
    NumberInput,
    LoadingOverlay,
} from "@mantine/core";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axios from "axios";
import { notifications } from "@mantine/notifications";

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/partners`
    : "http://localhost:8000/api/partners";

const PartnerManager = () => {
    const [partners, setPartners] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentPartner, setCurrentPartner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        sort_order: 0,
        active: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchPartners = async () => {
        setLoadingData(true);
        try {
            const response = await axios.get(API_URL);
            if (response.data.success) {
                setPartners(response.data.partners);
            }
        } catch (error) {
            console.error("Error fetching partners:", error);
            notifications.show({
                title: "Error",
                message: "Failed to fetch partners",
                color: "red",
            });
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const openAddModal = () => {
        setCurrentPartner(null);
        setFormData({
            name: "",
            sort_order: partners.length + 1,
            active: true,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setModalOpen(true);
    };

    const openEditModal = (partner) => {
        setCurrentPartner(partner);
        setFormData({
            name: partner.name,
            sort_order: partner.sort_order,
            active: partner.active,
        });
        setSelectedFile(null);
        setPreviewUrl(partner.image_url);
        setModalOpen(true);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!currentPartner && !selectedFile) {
            notifications.show({
                title: "Error",
                message: "Image is required for new partners",
                color: "red",
            });
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append("name", formData.name);
        data.append("sort_order", formData.sort_order);
        data.append("active", formData.active);

        if (selectedFile) {
            data.append("image", selectedFile);
        }

        try {
            if (currentPartner) {
                await axios.put(`${API_URL}/${currentPartner.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                notifications.show({ title: "Success", message: "Partner updated", color: "green" });
            } else {
                await axios.post(API_URL, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                notifications.show({ title: "Success", message: "Partner created", color: "green" });
            }

            setModalOpen(false);
            fetchPartners();
        } catch (error) {
            console.error("Error saving partner:", error);
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to save partner",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this partner?")) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                notifications.show({ title: "Success", message: "Partner deleted", color: "green" });
                fetchPartners();
            } catch (error) {
                console.error("Error deleting partner:", error);
                notifications.show({
                    title: "Error",
                    message: "Failed to delete partner",
                    color: "red",
                });
            }
        }
    };

    return (
        <div className="p-6 mantine-bg min-h-screen">
            <LoadingOverlay visible={loadingData} overlayBlur={2} />
            <Card shadow="sm" p="lg" radius="md">
                <Group position="apart" className="mb-4">
                    <Title order={2}>Partner Management</Title>
                    <Button leftIcon={<FaPlus />} color="blue" onClick={openAddModal}>
                        Add Partner
                    </Button>
                </Group>

                <div className="overflow-x-auto">
                    <Table striped highlightOnHover verticalSpacing="xs">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.map((partner) => (
                                <tr key={partner.id}>
                                    <td style={{ padding: '4px 8px' }}>
                                        <div style={{ width: '50px', height: '50px', overflow: 'hidden', borderRadius: '4px' }}>
                                            <img
                                                src={partner.image_url}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                alt="Partner"
                                            />
                                        </div>
                                    </td>
                                    <td>{partner.name}</td>
                                    <td>{partner.sort_order}</td>
                                    <td>
                                        <Switch
                                            checked={partner.active}
                                            onLabel="ON"
                                            offLabel="OFF"
                                            onChange={async (e) => {
                                                const newStatus = e.currentTarget.checked;
                                                // Optimistic update
                                                setPartners(partners.map(p => p.id === partner.id ? { ...p, active: newStatus } : p));
                                                try {
                                                    await axios.put(`${API_URL}/${partner.id}`, { active: newStatus });
                                                } catch (err) {
                                                    fetchPartners(); // Revert
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <Group spacing={8}>
                                            <ActionIcon color="blue" onClick={() => openEditModal(partner)}>
                                                <FaEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={() => handleDelete(partner.id)}>
                                                <FaTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={currentPartner ? "Edit Partner" : "Add Partner"}
                size="lg"
            >
                <div className="space-y-4">
                    <TextInput
                        label="Partner Name"
                        placeholder="Company Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium mb-1">Logo Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {previewUrl && (
                            <div className="mt-2">
                                <Image src={previewUrl} width={150} height={100} fit="contain" radius="md" />
                            </div>
                        )}
                    </div>

                    <NumberInput
                        label="Display Order"
                        value={formData.sort_order}
                        onChange={(val) => setFormData({ ...formData, sort_order: val })}
                    />

                    <Switch
                        label="Active"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.currentTarget.checked })}
                    />
                </div>

                <Group position="right" mt="lg">
                    <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button color="blue" onClick={handleSave} loading={loading}>
                        {currentPartner ? "Update" : "Create"}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default PartnerManager;
