import React, { useState, useEffect } from "react";
import {
    Card,
    Title,
    Group,
    Button,
    TextInput,
    Textarea,
    Image,
    LoadingOverlay,
} from "@mantine/core";
import { FaSave, FaUpload } from "react-icons/fa";
import axios from "axios";
import { notifications } from "@mantine/notifications";

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/about-content`
    : "http://localhost:8000/api/about-content";

const AboutContentManager = () => {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const [formData, setFormData] = useState({
        id: "",
        title: "",
        subtitle: "",
        heading: "",
        content: "",
        banner_image_url: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchContent = async () => {
        setLoadingData(true);
        try {
            const response = await axios.get(API_URL);
            if (response.data.success && response.data.content) {
                const data = response.data.content;
                setFormData({
                    id: data.id || "",
                    title: data.title || "About Our Company",
                    subtitle: data.subtitle || "About Big&Best",
                    heading: data.heading || "Big&Best Mart",
                    content: data.content || "",
                    banner_image_url: data.banner_image_url || "",
                });
                if (data.banner_image_url) {
                    setPreviewUrl(data.banner_image_url);
                }
            } else {
                // Initialize with default large text if empty
                handleSetDefaultText();
            }
        } catch (error) {
            console.error("Error fetching content:", error);
            // Non-blocking error
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleSetDefaultText = () => {
        const enhancedText = `Welcome to Big&Best Mart, where we are redefining the landscape of modern retail and convenience. We are not just another e-commerce platform; we are a comprehensive service ecosystem designed to integrate seamlessly into your daily life, providing speed, reliability, and quality at every touchpoint.

Our mission is to bridge the gap between traditional grocery shopping and the digital age. We understand that in today's fast-paced world, time is your most valuable asset. That is why we have engineered an ultra-fast delivery service that ensures your groceries, daily essentials, and household products reach your doorstep in minutes, not hours. Whether it’s fresh farm produce, dairy, or pantry staples, our robust logistics network guarantees freshness and timeliness.

But we go beyond groceries. Our platform features the **EATO** section, a dedicated culinary marketplace that rivals the best food delivery apps. Craving a quick snack or a full course meal? EATO connects you with top local eateries and cloud kitchens, delivering hot and fresh food with the same speed and efficiency you expect from Big&Best.

For our business partners and bulk buyers, we introduce the **Bazar** section. This robust marketplace functions like a premier B2B platform, connecting retailers, wholesalers, and small businesses with trusted suppliers. Whether you are stocking up for your store or sourcing materials for your enterprise, Bazar offers diverse categories, competitive wholesale pricing, and a transparent procurement process.

At Big&Best Mart, trust is our currency. We have forged strong collaborations with India’s most trusted brands and certified suppliers to bring you authentic products. Our commitment to quality is unwavering, backed by industry-leading certifications and rigorous food safety standards. Every product that leaves our warehouse undergoes strict quality checks to ensure it meets our high standards.

Join millions of satisfied customers who have made Big&Best Mart their go-to destination for all their daily needs. Experience the future of shopping where convenience meets quality. Fresh. Fast. Authentic. Reliable. Welcome to the Big&Best family.`;
        setFormData(prev => ({ ...prev, content: enhancedText }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const data = new FormData();
        if (formData.id) data.append("id", formData.id);
        data.append("title", formData.title);
        data.append("subtitle", formData.subtitle);
        data.append("heading", formData.heading);
        data.append("content", formData.content);

        if (selectedFile) {
            data.append("image", selectedFile);
        }

        try {
            const res = await axios.post(API_URL, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                notifications.show({ title: "Success", message: "Content updated successfully", color: "green" });
                // Update local state with returned data (especially ID if it was new)
                const updated = res.data.content;
                setFormData(prev => ({ ...prev, id: updated.id, banner_image_url: updated.banner_image_url }));
            }
        } catch (error) {
            console.error("Error saving content:", error);
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to save content",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 mantine-bg min-h-screen">
            <LoadingOverlay visible={loadingData} overlayBlur={2} />
            <Card shadow="sm" p="lg" radius="md">
                <Group position="apart" className="mb-6">
                    <Title order={2}>About Page Content Manager</Title>
                    <Button leftIcon={<FaSave />} color="blue" onClick={handleSave} loading={loading}>
                        Save Changes
                    </Button>
                </Group>

                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Banner Image Section */}
                    <div className="border p-4 rounded-md bg-gray-50">
                        <Title order={4} className="mb-4">Banner Image</Title>
                        <div className="flex gap-6 items-start">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-2">Upload New Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-xs text-gray-500 mt-2">Recommended size: 1200x600px or similar ratio.</p>
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-2">Preview</label>
                                {previewUrl ? (
                                    <Image src={previewUrl} height={200} fit="cover" radius="md" caption="Current Banner" />
                                ) : (
                                    <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">No Image</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Text Content Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            label="Section Title"
                            description="Top small heading (e.g., 'About Our Company')"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextInput
                            label="Subtitle / Tagline"
                            description="Highlight text (e.g., 'About Big&Best')"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        />
                    </div>

                    <TextInput
                        label="Main Heading"
                        description="Primary branding (e.g., 'Big&Best Mart')"
                        value={formData.heading}
                        onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                        size="md"
                    />

                    <Textarea
                        label="Main Description Content"
                        description="The detailed text about the company. Supports markdown-style formatting (newlines will be preserved)."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        minRows={15}
                        autosize
                    />

                    <div className="flex justify-end">
                        <Button variant="subtle" size="xs" onClick={handleSetDefaultText} color="gray">
                            Reset to Default Text
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AboutContentManager;
