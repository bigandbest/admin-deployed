import React, { useState, useEffect } from "react";
import {
    Card,
    Title,
    Table,
    ActionIcon,
    Group,
    Button,
    TextInput,
    Textarea,
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
    ? `${import.meta.env.VITE_API_BASE_URL}/certifications`
    : "http://localhost:8000/api/certifications";

const CertificationManager = () => {
    const [certifications, setCertifications] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentCert, setCurrentCert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sort_order: 0,
        active: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchCertifications = async () => {
        setLoadingData(true);
        try {
            const response = await axios.get(API_URL);
            if (response.data.success) {
                setCertifications(response.data.certifications);
            }
        } catch (error) {
            console.error("Error fetching certifications:", error);
            notifications.show({
                title: "Error",
                message: "Failed to fetch certifications",
                color: "red",
            });
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchCertifications();
    }, []);

    const openAddModal = () => {
        setCurrentCert(null);
        setFormData({
            name: "",
            description: "",
            sort_order: certifications.length + 1,
            active: true,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setModalOpen(true);
    };

    const openEditModal = (cert) => {
        setCurrentCert(cert);
        setFormData({
            name: cert.name,
            description: cert.description || "",
            sort_order: cert.sort_order,
            active: cert.active,
        });
        setSelectedFile(null);
        setPreviewUrl(cert.image_url);
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
        if (!currentCert && !selectedFile) {
            notifications.show({
                title: "Error",
                message: "Image is required for new certifications",
                color: "red",
            });
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("sort_order", formData.sort_order);
        data.append("active", formData.active);

        if (selectedFile) {
            data.append("image", selectedFile);
        }

        try {
            if (currentCert) {
                await axios.put(`${API_URL}/${currentCert.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                notifications.show({ title: "Success", message: "Certification updated", color: "green" });
            } else {
                await axios.post(API_URL, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                notifications.show({ title: "Success", message: "Certification created", color: "green" });
            }

            setModalOpen(false);
            fetchCertifications();
        } catch (error) {
            console.error("Error saving certification:", error);
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to save certification",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this certification?")) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                notifications.show({ title: "Success", message: "Certification deleted", color: "green" });
                fetchCertifications();
            } catch (error) {
                console.error("Error deleting certification:", error);
                notifications.show({
                    title: "Error",
                    message: "Failed to delete certification",
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
                    <Title order={2}>Certification Management</Title>
                    <Button leftIcon={<FaPlus />} color="blue" onClick={openAddModal}>
                        Add Certification
                    </Button>
                </Group>

                <div className="overflow-x-auto">
                    <Table striped highlightOnHover verticalSpacing="xs">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {certifications.map((cert) => (
                                <tr key={cert.id}>
                                    <td style={{ padding: '4px 8px' }}>
                                        <div style={{ width: '50px', height: '50px', overflow: 'hidden', borderRadius: '4px' }}>
                                            <img
                                                src={cert.image_url}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                alt="Certification"
                                            />
                                        </div>
                                    </td>
                                    <td>{cert.name}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cert.description}
                                    </td>
                                    <td>{cert.sort_order}</td>
                                    <td>
                                        <Switch
                                            checked={cert.active}
                                            onLabel="ON"
                                            offLabel="OFF"
                                            onChange={async (e) => {
                                                const newStatus = e.currentTarget.checked;
                                                setCertifications(certifications.map(c => c.id === cert.id ? { ...c, active: newStatus } : c));
                                                try {
                                                    await axios.put(`${API_URL}/${cert.id}`, { active: newStatus });
                                                } catch (err) {
                                                    fetchCertifications(); // Revert
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <Group spacing={8}>
                                            <ActionIcon color="blue" onClick={() => openEditModal(cert)}>
                                                <FaEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={() => handleDelete(cert.id)}>
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
                title={currentCert ? "Edit Certification" : "Add Certification"}
                size="lg"
            >
                <div className="space-y-4">
                    <TextInput
                        label="Certification Name"
                        placeholder="e.g. FSSAI"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Textarea
                        label="Description"
                        placeholder="Description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                        {currentCert ? "Update" : "Create"}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default CertificationManager;
