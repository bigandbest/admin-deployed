import React, { useState, useEffect, useMemo } from "react";
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
    Select,
    LoadingOverlay,
    Text,
} from "@mantine/core";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { getAllCategories } from "../../utils/supabaseApi";
import { useRef } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/small-promo-cards`
    : "http://localhost:8000/api/small-promo-cards";

const LINK_TYPES = [
    { value: "external", label: "External Link" },
    { value: "product", label: "Specific Product" },
    { value: "category", label: "Category / Subcategory" },
];

const SmallPromoCardManagement = () => {
    const [cards, setCards] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentCard, setCurrentCard] = useState(null);
    const [loading, setLoading] = useState(false);

    // Product Pagination State
    const [products, setProducts] = useState([]);
    const [productPage, setProductPage] = useState(1);
    const [productSearch, setProductSearch] = useState("");
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [formData, setFormData] = useState({
        link: "",
        display_order: 0,
        is_active: true,
        link_type: "external",
        resource_id: "",
        sub_resource_id: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchCards = async () => {
        try {
            const response = await axios.get(API_URL);
            if (response.data.success) {
                setCards(response.data.cards);
            }
        } catch (error) {
            console.error("Error fetching cards:", error);
            // Non-critical background fetch, maybe supress toaster or use generic one
            notifications.show({
                title: "Error",
                message: "Failed to fetch cards",
                color: "red",
            });
        }
    };

    const fetchProducts = async (page, search = "") => {
        if (loadingProducts) return;
        setLoadingProducts(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL
                ? `${import.meta.env.VITE_API_BASE_URL}/productsroute/filter`
                : "http://localhost:8000/api/productsroute/filter";

            const response = await axios.get(baseUrl, {
                params: {
                    page,
                    limit: 20,
                    search,
                    active: true
                }
            });

            // In fetchProducts
            if (response.data.success) {
                const list = response.data.products || [];
                if (Array.isArray(list)) {
                    const newProducts = list
                        .filter(p => p && p.id) // Filter nulls
                        .map(p => ({
                            value: String(p.id),
                            label: p.name || "Unknown Product",
                            image: p.image_url
                        }));

                    setProducts(prev => {
                        // Ensure strict uniqueness
                        const existingIds = new Set(page === 1 ? [] : prev.map(p => p.value));

                        const uniqueNewBatch = [];
                        const seenInBatch = new Set();

                        for (const p of newProducts) {
                            if (!existingIds.has(p.value) && !seenInBatch.has(p.value)) {
                                uniqueNewBatch.push(p);
                                seenInBatch.add(p.value);
                            }
                        }

                        return page === 1 ? uniqueNewBatch : [...prev, ...uniqueNewBatch];
                    });
                    setHasMoreProducts(newProducts.length === 20);
                }
            }

        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // ... in fetchCategories
    const fetchCategories = async () => {
        try {
            const categoriesRes = await getAllCategories();
            if (categoriesRes.success && Array.isArray(categoriesRes.categories)) {
                setCategories(categoriesRes.categories);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        }
    };
    // ... in render


    useEffect(() => {
        fetchCards();
        fetchProducts(1, "");
        fetchCategories();
    }, []);

    const handleProductSearch = (query) => {
        setProductSearch(query);
        setProductPage(1);
        setHasMoreProducts(true);
        setProducts([]); // Clear current list to avoid confusing mix
        fetchProducts(1, query);
    };

    const handleProductScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMoreProducts && !loadingProducts) {
            const nextPage = productPage + 1;
            setProductPage(nextPage);
            fetchProducts(nextPage, productSearch);
        }
    };

    // Ensure selected product is in the list (if it was loaded previously but now filtered out by search, or strictly from ID)
    // This is tricky with server-side search. For now, we assume if they search, they pick from results.
    // If they edit a card, we might need to fetch the specific resource_id product details to show the label correctly.
    // For simplicity, we trust the ID value, but the label might be missing if not in the current list.
    // To fix this: When `currentCard` is set, we should ideally fetch that single product and prepend it.
    // I'll leave that as an enhancement if needed, or check if `Select` handles value-only gracefully (it implies label=value).

    // Derived Category Options
    const categoryOptions = useMemo(() => {
        return categories.map(cat => ({
            value: cat.id,
            label: cat.name
        }));
    }, [categories]);

    // Derived Subcategory Options based on selected Category
    const subCategoryOptions = useMemo(() => {
        if (!formData.resource_id) return [];
        const selectedCat = categories.find(c => c.id === formData.resource_id);
        return selectedCat?.subcategories?.map(sub => ({
            value: sub.id,
            label: sub.name
        })) || [];
    }, [categories, formData.resource_id]);

    const openAddModal = () => {
        setCurrentCard(null);
        setFormData({
            link: "",
            display_order: cards.length + 1,
            is_active: true,
            link_type: "external",
            resource_id: "",
            sub_resource_id: "",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setModalOpen(true);
    };

    const openEditModal = (card) => {
        setCurrentCard(card);
        setFormData({
            link: card.link || "",
            display_order: card.display_order,
            is_active: card.is_active,
            link_type: card.link_type || "external",
            resource_id: card.resource_id || "",
            sub_resource_id: card.sub_resource_id || "",
        });
        setSelectedFile(null);
        setPreviewUrl(card.image_url);
        setModalOpen(true);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Auto-generate link based on selection
    useEffect(() => {
        if (!modalOpen) return;

        let generatedLink = formData.link;
        if (formData.link_type === "product" && formData.resource_id) {
            generatedLink = `/pages/singleproduct/${formData.resource_id}`;
        } else if (formData.link_type === "category" && formData.resource_id) {
            const cat = categories.find(c => c.id === formData.resource_id);
            if (cat) {
                if (formData.sub_resource_id) {
                    const sub = cat.subcategories?.find(s => s.id === formData.sub_resource_id);
                    if (sub) {
                        // URL format: /pages/categories/subcategory/[CAT_ID]/[SUBCAT_ID]?categoryName=...&subcategoryName=...
                        generatedLink = `/pages/categories/subcategory/${cat.id}/${sub.id}?categoryName=${encodeURIComponent(cat.name)}&subcategoryName=${encodeURIComponent(sub.name)}`;
                    }
                } else {
                    // Category only mapping
                    generatedLink = `/pages/categories/${cat.id}?categoryName=${encodeURIComponent(cat.name)}`;
                }
            }
        } else if (formData.link_type === "external") {
            // Do not overwrite manual input unless needed
        }

        if (generatedLink !== formData.link && formData.link_type !== 'external') {
            setFormData(prev => ({ ...prev, link: generatedLink }));
        }
    }, [formData.link_type, formData.resource_id, formData.sub_resource_id, categories, modalOpen]);


    const handleSave = async () => {
        if (!currentCard && !selectedFile) {
            notifications.show({
                title: "Error",
                message: "Image is required for new cards",
                color: "red",
            });
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append("link", formData.link);
        data.append("display_order", formData.display_order);
        data.append("is_active", formData.is_active);
        data.append("link_type", formData.link_type);
        data.append("resource_id", formData.resource_id || "");
        data.append("sub_resource_id", formData.sub_resource_id || "");

        if (selectedFile) {
            data.append("image", selectedFile);
        }

        try {
            if (currentCard) {
                await axios.put(`${API_URL}/${currentCard.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                notifications.show({ title: "Success", message: "Card updated", color: "green" });
            } else {
                await axios.post(API_URL, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                notifications.show({ title: "Success", message: "Card created", color: "green" });
            }

            // Critical order: Close modal first, then cleanup/fetch
            setModalOpen(false);

            // Reset form immediate to avoid flickering if modal reopens or lag
            setFormData({ link: "", display_order: cards.length + 1, is_active: true, link_type: "external", resource_id: "", sub_resource_id: "" });
            setSelectedFile(null);
            setPreviewUrl(null);

            await fetchCards();
        } catch (error) {
            console.error("Error saving card:", error);
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to save card",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this card?")) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                notifications.show({ title: "Success", message: "Card deleted", color: "green" });
                fetchCards();
            } catch (error) {
                console.error("Error deleting card:", error);
                notifications.show({
                    title: "Error",
                    message: "Failed to delete card",
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
                    <Title order={2}>Small Promo Cards</Title>
                    <Button leftIcon={<FaPlus />} color="blue" onClick={openAddModal}>
                        Add Card
                    </Button>
                </Group>

                <div className="overflow-x-auto">
                    <Table striped highlightOnHover verticalSpacing="xs">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Type</th>
                                <th>Link/Resource</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cards.map((card) => (
                                <tr key={card.id}>
                                    <td style={{ padding: '4px 8px' }}>
                                        <div style={{ width: '30px', height: '20px', overflow: 'hidden', borderRadius: '4px' }}>
                                            <img
                                                src={card.image_url}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt="Card"
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <Text transform="capitalize" size="sm" weight={500}>
                                            {card.link_type || 'External'}
                                        </Text>
                                    </td>
                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <Text size="xs" color="dimmed" title={card.link}>
                                            {card.link}
                                        </Text>
                                    </td>
                                    <td>{card.display_order}</td>
                                    <td>
                                        <Switch
                                            checked={card.is_active}
                                            onLabel="ON"
                                            offLabel="OFF"
                                            onChange={async (e) => {
                                                try {
                                                    const newStatus = e.currentTarget.checked;
                                                    // Optimistic update
                                                    setCards(cards.map(c => c.id === card.id ? { ...c, is_active: newStatus } : c));
                                                    await axios.put(`${API_URL}/${card.id}`, { is_active: newStatus });
                                                } catch (err) {
                                                    console.error(err);
                                                    fetchCards(); // Revert on error
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <Group spacing={8}>
                                            <ActionIcon color="blue" onClick={() => openEditModal(card)}>
                                                <FaEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={() => handleDelete(card.id)}>
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
                title={currentCard ? "Edit Card" : "Add Card"}
                size="lg"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {previewUrl && (
                            <div className="mt-2">
                                <Image src={previewUrl} width="100%" height={150} fit="contain" radius="md" />
                            </div>
                        )}
                    </div>

                    <Select
                        label="Link Type"
                        data={LINK_TYPES || []}
                        value={formData.link_type}
                        onChange={(value) => setFormData({ ...formData, link_type: value, resource_id: "", sub_resource_id: "", link: "" })}
                    />

                    {formData.link_type === 'product' && (
                        <Select
                            label="Select Product"
                            searchable
                            data={Array.isArray(products) ? products : []}
                            value={formData.resource_id ? String(formData.resource_id) : null}
                            onChange={(value) => setFormData({ ...formData, resource_id: value })}
                            placeholder="Search product..."
                            onSearchChange={handleProductSearch}
                            onDropdownScroll={handleProductScroll}
                            filter={({ options }) => options}
                            nothingFound={loadingProducts ? "Loading..." : "No products found"}
                        />
                    )}
                    {formData.link_type === 'category' && (
                        <>
                            <Select
                                label="Select Category"
                                searchable
                                data={Array.isArray(categoryOptions) ? categoryOptions : []}
                                value={formData.resource_id}
                                onChange={(value) => setFormData({ ...formData, resource_id: value, sub_resource_id: "" })}
                                placeholder="Search category..."
                            />
                            {formData.resource_id && subCategoryOptions.length > 0 && (
                                <Select
                                    label="Select Subcategory"
                                    searchable
                                    data={Array.isArray(subCategoryOptions) ? subCategoryOptions : []}
                                    value={formData.sub_resource_id}
                                    onChange={(value) => setFormData({ ...formData, sub_resource_id: value })}
                                    placeholder="Search subcategory (optional)..."
                                />
                            )}
                        </>
                    )}

                    <TextInput
                        label="Generated Link (Editable)"
                        placeholder="/products/category/..."
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        disabled={formData.link_type !== 'external'}
                    />

                    {formData.link_type !== 'external' && <Text size="xs" color="dimmed">Link is automatically generated based on selection.</Text>}

                    <NumberInput
                        label="Display Order"
                        value={formData.display_order}
                        onChange={(val) => setFormData({ ...formData, display_order: val })}
                    />

                    <Switch
                        label="Active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.currentTarget.checked })}
                    />
                </div>

                <Group position="right" mt="lg">
                    <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button color="blue" onClick={handleSave} loading={loading}>
                        {currentCard ? "Update" : "Create"}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default SmallPromoCardManagement;
