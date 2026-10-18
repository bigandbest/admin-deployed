import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { modals } from "@mantine/modals";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import api from "../../utils/api";
import { getAllCategories, getProductsWithFilters } from "../../utils/supabaseApi";

const CARDS_URL = "/small-promo-cards";
const PRODUCT_PAGE_SIZE = 20;

const LINK_TYPES = [
    { value: "external", label: "External Link" },
    { value: "product", label: "Specific Product" },
    { value: "category", label: "Category / Subcategory" },
];

const emptyForm = (order = 1) => ({
    link: "",
    display_order: order,
    is_active: true,
    link_type: "external",
    resource_id: "",
    sub_resource_id: "",
});

const notifyError = (error, fallback) =>
    notifications.show({
        title: "Error",
        message: error?.response?.data?.error || fallback,
        color: "red",
    });

const SmallPromoCardManagement = () => {
    const [cards, setCards] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentCard, setCurrentCard] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);

    // Product picker (server-side search + infinite scroll)
    const [products, setProducts] = useState([]);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const productState = useRef({ page: 1, search: "", requestId: 0 });

    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(emptyForm());
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchCards = useCallback(async () => {
        setLoadingCards(true);
        try {
            const response = await api.get(CARDS_URL);
            if (response.data.success) setCards(response.data.cards || []);
        } catch (error) {
            notifyError(error, "Failed to fetch cards");
        } finally {
            setLoadingCards(false);
        }
    }, []);

    // Loads one page of products. A request id makes sure a slow, older response
    // can never overwrite the results of a newer search.
    const fetchProducts = useCallback(async (page, search) => {
        const state = productState.current;
        const requestId = ++state.requestId;
        state.page = page;
        state.search = search;
        setLoadingProducts(true);
        try {
            const response = await getProductsWithFilters({ search, active: true }, page, PRODUCT_PAGE_SIZE);
            if (requestId !== state.requestId) return; // superseded by a newer request
            if (!response.success) throw new Error(response.error || "Failed to load products");

            const batch = (response.products || [])
                .filter((p) => p && p.id)
                .map((p) => ({ value: String(p.id), label: p.name || "Unknown Product" }));

            setProducts((prev) => {
                const seen = new Set(page === 1 ? [] : prev.map((p) => p.value));
                const fresh = batch.filter((p) => !seen.has(p.value) && seen.add(p.value));
                return page === 1 ? fresh : [...prev, ...fresh];
            });
            setHasMoreProducts(batch.length === PRODUCT_PAGE_SIZE);
        } catch (error) {
            if (requestId === state.requestId) {
                notifications.show({ title: "Error", message: "Failed to load products", color: "red" });
            }
        } finally {
            if (requestId === state.requestId) setLoadingProducts(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await getAllCategories();
            setCategories(res.success && Array.isArray(res.categories) ? res.categories : []);
        } catch {
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        fetchCards();
        fetchProducts(1, "");
        fetchCategories();
    }, [fetchCards, fetchProducts, fetchCategories]);

    // Free the object URL created for the previous file preview
    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleProductSearch = (query) => {
        setHasMoreProducts(true);
        fetchProducts(1, query);
    };

    const handleProductsBottom = () => {
        if (hasMoreProducts && !loadingProducts) {
            fetchProducts(productState.current.page + 1, productState.current.search);
        }
    };

    const categoryOptions = useMemo(
        () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
        [categories]
    );

    const subCategoryOptions = useMemo(() => {
        if (!formData.resource_id) return [];
        const selectedCat = categories.find((c) => c.id === formData.resource_id);
        return selectedCat?.subcategories?.map((sub) => ({ value: sub.id, label: sub.name })) || [];
    }, [categories, formData.resource_id]);

    // When editing, the saved product may not be in the loaded page: keep it selectable
    const productOptions = useMemo(() => {
        const id = formData.resource_id ? String(formData.resource_id) : null;
        if (formData.link_type === "product" && id && !products.some((p) => p.value === id)) {
            return [{ value: id, label: `Product ${id.slice(0, 8)}…` }, ...products];
        }
        return products;
    }, [products, formData.link_type, formData.resource_id]);

    const openAddModal = () => {
        setCurrentCard(null);
        setFormData(emptyForm(cards.length + 1));
        setSelectedFile(null);
        setPreviewUrl(null);
        setModalOpen(true);
    };

    const openEditModal = (card) => {
        setCurrentCard(card);
        setFormData({
            link: card.link || "",
            display_order: card.display_order ?? 0,
            is_active: !!card.is_active,
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

    // Link is derived from the selection for product/category types
    const generatedLink = useMemo(() => {
        const { link_type, resource_id, sub_resource_id } = formData;
        if (link_type === "product" && resource_id) {
            return `/pages/singleproduct/${resource_id}`;
        }
        if (link_type === "category" && resource_id) {
            const cat = categories.find((c) => c.id === resource_id);
            if (!cat) return null;
            const sub = sub_resource_id && cat.subcategories?.find((s) => s.id === sub_resource_id);
            return sub
                ? `/pages/categories/subcategory/${cat.id}/${sub.id}?categoryName=${encodeURIComponent(cat.name)}&subcategoryName=${encodeURIComponent(sub.name)}`
                : `/pages/categories/${cat.id}?categoryName=${encodeURIComponent(cat.name)}`;
        }
        return null;
    }, [formData, categories]);

    useEffect(() => {
        if (modalOpen && generatedLink && generatedLink !== formData.link) {
            setFormData((prev) => ({ ...prev, link: generatedLink }));
        }
    }, [modalOpen, generatedLink, formData.link]);

    const closeModal = () => setModalOpen(false);

    const handleSave = async () => {
        if (!currentCard && !selectedFile) {
            notifications.show({ title: "Error", message: "Image is required for new cards", color: "red" });
            return;
        }
        if (!formData.link.trim()) {
            notifications.show({
                title: "Error",
                message: formData.link_type === "external" ? "Enter a link" : "Select a target for the link",
                color: "red",
            });
            return;
        }

        setSaving(true);
        const data = new FormData();
        data.append("link", formData.link.trim());
        data.append("display_order", Number(formData.display_order) || 0);
        data.append("is_active", formData.is_active);
        data.append("link_type", formData.link_type);
        data.append("resource_id", formData.resource_id || "");
        data.append("sub_resource_id", formData.sub_resource_id || "");
        if (selectedFile) data.append("image", selectedFile);

        try {
            const config = { headers: { "Content-Type": "multipart/form-data" } };
            if (currentCard) {
                await api.put(`${CARDS_URL}/${currentCard.id}`, data, config);
            } else {
                await api.post(CARDS_URL, data, config);
            }
            notifications.show({
                title: "Success",
                message: currentCard ? "Card updated" : "Card created",
                color: "green",
            });
            closeModal();
            await fetchCards();
        } catch (error) {
            notifyError(error, "Failed to save card");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (card) =>
        modals.openConfirmModal({
            title: "Delete card",
            children: <Text size="sm">Are you sure you want to delete this card?</Text>,
            labels: { confirm: "Delete", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: async () => {
                try {
                    await api.delete(`${CARDS_URL}/${card.id}`);
                    notifications.show({ title: "Success", message: "Card deleted", color: "green" });
                    fetchCards();
                } catch (error) {
                    notifyError(error, "Failed to delete card");
                }
            },
        });

    const handleToggleActive = async (card, newStatus) => {
        setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, is_active: newStatus } : c)));
        try {
            await api.put(`${CARDS_URL}/${card.id}`, { is_active: newStatus });
        } catch (error) {
            notifyError(error, "Failed to update status");
            fetchCards(); // revert to server state
        }
    };

    return (
        <div className="p-6 mantine-bg min-h-screen">
            <LoadingOverlay visible={loadingCards} overlayProps={{ blur: 2 }} />
            <Card shadow="sm" p="lg" radius="md">
                <Group justify="space-between" mb="md">
                    <Title order={2}>Small Promo Cards</Title>
                    <Button leftSection={<FaPlus />} color="blue" onClick={openAddModal}>
                        Add Card
                    </Button>
                </Group>

                <div className="overflow-x-auto">
                    <Table striped highlightOnHover verticalSpacing="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Image</Table.Th>
                                <Table.Th>Type</Table.Th>
                                <Table.Th>Link/Resource</Table.Th>
                                <Table.Th>Order</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {cards.length === 0 && !loadingCards && (
                                <Table.Tr>
                                    <Table.Td colSpan={6}>
                                        <Text c="dimmed" ta="center" size="sm">
                                            No promo cards yet
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {cards.map((card) => (
                                <Table.Tr key={card.id}>
                                    <Table.Td>
                                        <img
                                            src={card.image_url}
                                            style={{ width: 48, height: 32, objectFit: "cover", borderRadius: 4 }}
                                            alt="Card"
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text tt="capitalize" size="sm" fw={500}>
                                            {card.link_type || "external"}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td maw={200}>
                                        <Text size="xs" c="dimmed" truncate title={card.link}>
                                            {card.link}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>{card.display_order}</Table.Td>
                                    <Table.Td>
                                        <Switch
                                            checked={!!card.is_active}
                                            onLabel="ON"
                                            offLabel="OFF"
                                            onChange={(e) => handleToggleActive(card, e.currentTarget.checked)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={8}>
                                            <ActionIcon color="blue" aria-label="Edit card" onClick={() => openEditModal(card)}>
                                                <FaEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon color="red" aria-label="Delete card" onClick={() => handleDelete(card)}>
                                                <FaTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </div>
            </Card>

            <Modal
                opened={modalOpen}
                onClose={closeModal}
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
                                <Image src={previewUrl} h={150} w="100%" fit="contain" radius="md" />
                            </div>
                        )}
                    </div>

                    <Select
                        label="Link Type"
                        data={LINK_TYPES}
                        value={formData.link_type}
                        allowDeselect={false}
                        onChange={(value) =>
                            setFormData({ ...formData, link_type: value, resource_id: "", sub_resource_id: "", link: "" })
                        }
                    />

                    {formData.link_type === "product" && (
                        <Select
                            label="Select Product"
                            searchable
                            data={productOptions}
                            value={formData.resource_id ? String(formData.resource_id) : null}
                            onChange={(value) => setFormData({ ...formData, resource_id: value || "" })}
                            placeholder="Search product..."
                            onSearchChange={handleProductSearch}
                            filter={({ options }) => options}
                            nothingFoundMessage={loadingProducts ? "Loading..." : "No products found"}
                            scrollAreaProps={{ onBottomReached: handleProductsBottom }}
                        />
                    )}
                    {formData.link_type === "category" && (
                        <>
                            <Select
                                label="Select Category"
                                searchable
                                data={categoryOptions}
                                value={formData.resource_id || null}
                                onChange={(value) => setFormData({ ...formData, resource_id: value || "", sub_resource_id: "" })}
                                placeholder="Search category..."
                            />
                            {formData.resource_id && subCategoryOptions.length > 0 && (
                                <Select
                                    label="Select Subcategory"
                                    searchable
                                    clearable
                                    data={subCategoryOptions}
                                    value={formData.sub_resource_id || null}
                                    onChange={(value) => setFormData({ ...formData, sub_resource_id: value || "" })}
                                    placeholder="Search subcategory (optional)..."
                                />
                            )}
                        </>
                    )}

                    <TextInput
                        label={formData.link_type === "external" ? "Link" : "Generated Link"}
                        placeholder="https://..."
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        disabled={formData.link_type !== "external"}
                    />

                    {formData.link_type !== "external" && (
                        <Text size="xs" c="dimmed">
                            Link is automatically generated based on selection.
                        </Text>
                    )}

                    <NumberInput
                        label="Display Order"
                        value={formData.display_order}
                        min={0}
                        allowDecimal={false}
                        onChange={(val) => setFormData({ ...formData, display_order: val })}
                    />

                    <Switch
                        label="Active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.currentTarget.checked })}
                    />
                </div>

                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={closeModal}>
                        Cancel
                    </Button>
                    <Button color="blue" onClick={handleSave} loading={saving}>
                        {currentCard ? "Update" : "Create"}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default SmallPromoCardManagement;
