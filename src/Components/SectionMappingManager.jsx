import React, { useState, useEffect } from "react";
import {
    Card,
    Title,
    Text,
    Button,
    Checkbox,
    NumberInput,
    Group,
    Stack,
    Divider,
    Loader,
    Badge,
    Accordion,
    Alert,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";
import {
    getSectionByKey,
    getSectionSubcategoryMappings,
    updateSectionSubcategoryMappings,
    getCategoriesInSection,
    addCategoriesToSection,
    syncCategoriesInSection,
} from "../utils/supabaseApi";

const SectionMappingManager = ({
    sectionKey,
    sectionName,
    mappingType, // 'subcategory', 'category', or 'both'
    categories,
    subcategories,
    singleSelect = false, // New prop
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sectionId, setSectionId] = useState(null);
    const [selectedMappings, setSelectedMappings] = useState({});
    const [displayOrders, setDisplayOrders] = useState({});

    useEffect(() => {
        loadSectionMappings();
    }, [sectionKey]);

    const loadSectionMappings = async () => {
        setLoading(true);
        try {
            // Get section ID
            const sectionResult = await getSectionByKey(sectionKey);
            if (!sectionResult.success || !sectionResult.section) {
                showNotification({
                    message: "Section not found",
                    color: "red",
                });
                return;
            }

            const section = sectionResult.section;
            setSectionId(section.id);

            // Load existing mappings based on type
            if (mappingType === "subcategory" || mappingType === "both") {
                const subcatResult = await getSectionSubcategoryMappings(section.id);
                if (subcatResult.success && subcatResult.data) {
                    const mappings = {};
                    const orders = {};
                    subcatResult.data.forEach((mapping) => {
                        mappings[`sub_${mapping.subcategory_id}`] = true;
                        orders[`sub_${mapping.subcategory_id}`] = mapping.display_order;
                    });
                    setSelectedMappings((prev) => ({ ...prev, ...mappings }));
                    setDisplayOrders((prev) => ({ ...prev, ...orders }));
                }
            }

            if (mappingType === "category" || mappingType === "both") {
                const catResult = await getCategoriesInSection(section.id);
                if (catResult.success && catResult.data) {
                    const mappings = {};
                    catResult.data.forEach((mapping) => {
                        mappings[`cat_${mapping.category_id}`] = true;
                    });

                    // If singleSelect is true and multiple are selected, keep only the first one (cleanup)
                    if (singleSelect && catResult.data.length > 1) {
                        const firstKey = `cat_${catResult.data[0].category_id}`;
                        setSelectedMappings((prev) => ({ ...prev, [firstKey]: true }));
                    } else {
                        setSelectedMappings((prev) => ({ ...prev, ...mappings }));
                    }
                }
            }
        } catch (error) {
            console.error("Error loading section mappings:", error);
            showNotification({
                message: "Failed to load mappings",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMapping = (key) => {
        if (singleSelect) {
            // specific logic for single select
            setSelectedMappings((prev) => {
                const isSelected = !!prev[key];
                if (isSelected) {
                    // If already selected, allow deselection (or maybe enforce at least one? user said "allow only one", implying 0 or 1)
                    // Let's allow deselecting to 0.
                    const newMappings = { ...prev };
                    delete newMappings[key];
                    return newMappings;
                } else {
                    // If selecting new, clear all others of the same type?
                    // Or clear ALL mappings just to be safe if singleSelect applies to the whole manager
                    // The user request context implies single category.
                    // We will clear ALL selected mappings and set only this one.
                    return { [key]: true };
                }
            });
        } else {
            setSelectedMappings((prev) => ({
                ...prev,
                [key]: !prev[key],
            }));
        }

        // Set default display order if newly selected (only needed if not single select or if we want to preserve order logic)
        if (!selectedMappings[key] && !displayOrders[key]) {
            const maxOrder = Math.max(
                ...Object.values(displayOrders).filter((v) => typeof v === "number"),
                -1
            );
            setDisplayOrders((prev) => ({
                ...prev,
                [key]: maxOrder + 1,
            }));
        }
    };

    const handleDisplayOrderChange = (key, value) => {
        setDisplayOrders((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSelectAll = (type) => {
        if (singleSelect) return; // Disable for single select

        const newMappings = { ...selectedMappings };
        const newOrders = { ...displayOrders };
        let order = Math.max(...Object.values(displayOrders).filter((v) => typeof v === "number"), -1) + 1;

        if (type === "subcategory") {
            subcategories.forEach((sub) => {
                const key = `sub_${sub.id}`;
                newMappings[key] = true;
                if (!newOrders[key]) {
                    newOrders[key] = order++;
                }
            });
        } else if (type === "category") {
            categories.forEach((cat) => {
                const key = `cat_${cat.id}`;
                newMappings[key] = true;
            });
        }

        setSelectedMappings(newMappings);
        setDisplayOrders(newOrders);
    };

    const handleDeselectAll = (type) => {
        // Deselect all is fine for single select technically, but user UI might not need it if they can just uncheck.
        // But for consistency we can leave it or hide it. Plan said hide it.
        const newMappings = { ...selectedMappings };
        const newOrders = { ...displayOrders };

        if (type === "subcategory") {
            subcategories.forEach((sub) => {
                const key = `sub_${sub.id}`;
                delete newMappings[key];
                delete newOrders[key];
            });
        } else if (type === "category") {
            categories.forEach((cat) => {
                const key = `cat_${cat.id}`;
                delete newMappings[key];
            });
        }

        setSelectedMappings(newMappings);
        setDisplayOrders(newOrders);
    };

    const handleSave = async () => {
        if (!sectionId) {
            showNotification({
                message: "Section ID not found",
                color: "red",
            });
            return;
        }

        setSaving(true);
        try {
            // Save subcategory mappings
            if (mappingType === "subcategory" || mappingType === "both") {
                const subcategoryMappings = [];
                Object.keys(selectedMappings).forEach((key) => {
                    if (key.startsWith("sub_") && selectedMappings[key]) {
                        const subcategoryId = key.replace("sub_", "");
                        if (subcategoryId && subcategoryId !== "undefined") {
                            subcategoryMappings.push({
                                subcategory_id: subcategoryId,
                                display_order: displayOrders[key] || 0,
                                is_active: true,
                            });
                        }
                    }
                });

                const subResult = await updateSectionSubcategoryMappings(
                    sectionId,
                    subcategoryMappings
                );
                if (!subResult.success) {
                    throw new Error(subResult.error || "Failed to save subcategory mappings");
                }
            }

            // Save category mappings
            if (mappingType === "category" || mappingType === "both") {
                const categoryIds = [];
                Object.keys(selectedMappings).forEach((key) => {
                    if (key.startsWith("cat_") && selectedMappings[key]) {
                        categoryIds.push(key.replace("cat_", ""));
                    }
                });

                // Validation for single select
                if (singleSelect && categoryIds.length > 1) {
                    throw new Error("Only one category allowed for this section");
                }


                // Sync category mappings (replace existing with selected)
                const catResult = await syncCategoriesInSection(sectionId, categoryIds);
                if (!catResult.success) {
                    throw new Error(catResult.error || "Failed to save category mappings");
                }
            }

            showNotification({
                message: `${sectionName} mappings saved successfully`,
                color: "green",
                icon: <FaCheck />,
            });

            // Reload mappings
            await loadSectionMappings();
        } catch (error) {
            console.error("Error saving mappings:", error);
            showNotification({
                message: error.message || "Failed to save mappings",
                color: "red",
                icon: <FaTimes />,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card p="md">
                <Group position="center" py="xl">
                    <Loader size="lg" />
                    <Text>Loading {sectionName} mappings...</Text>
                </Group>
            </Card>
        );
    }

    const selectedCount = Object.values(selectedMappings).filter(Boolean).length;

    return (
        <Card p="md" withBorder>
            <Stack spacing="md">
                <Group position="apart">
                    <div>
                        <Title order={3}>{sectionName}</Title>
                        <Text size="sm" color="dimmed">
                            {singleSelect
                                ? "Select exactly one category to display"
                                : `Select which ${mappingType === "subcategory" ? "subcategories" : mappingType === "category" ? "categories" : "categories and subcategories"} to display`
                            }
                        </Text>
                    </div>
                    <Badge size="lg" color="blue">
                        {selectedCount} selected
                    </Badge>
                </Group>

                {!singleSelect && (
                    <Alert icon={<FaInfoCircle />} color="blue" variant="light">
                        Display order determines the sequence in which items appear on the frontend.
                        Lower numbers appear first.
                    </Alert>
                )}

                {(mappingType === "subcategory" || mappingType === "both") && (
                    <>
                        <Group position="apart">
                            <Title order={4}>Subcategories</Title>
                            {!singleSelect && (
                                <Group>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => handleSelectAll("subcategory")}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        onClick={() => handleDeselectAll("subcategory")}
                                    >
                                        Deselect All
                                    </Button>
                                </Group>
                            )}
                        </Group>

                        <Accordion variant="separated">
                            {categories.map((category) => {
                                const categorySubs = subcategories.filter(
                                    (sub) => sub.category_id === category.id
                                );
                                if (categorySubs.length === 0) return null;

                                return (
                                    <Accordion.Item key={category.id} value={`cat-${category.id}`}>
                                        <Accordion.Control>
                                            <Group>
                                                <Text weight={500}>{category.name}</Text>
                                                <Badge size="sm">
                                                    {categorySubs.filter((sub) => selectedMappings[`sub_${sub.id}`]).length} / {categorySubs.length}
                                                </Badge>
                                            </Group>
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <Stack spacing="xs">
                                                {categorySubs.map((subcategory) => {
                                                    const key = `sub_${subcategory.id}`;
                                                    return (
                                                        <Group key={subcategory.id} position="apart">
                                                            <Checkbox
                                                                label={subcategory.name}
                                                                checked={selectedMappings[key] || false}
                                                                onChange={() => handleToggleMapping(key)}
                                                            />
                                                            {selectedMappings[key] && (
                                                                <NumberInput
                                                                    value={displayOrders[key] || 0}
                                                                    onChange={(value) =>
                                                                        handleDisplayOrderChange(key, value)
                                                                    }
                                                                    min={0}
                                                                    max={999}
                                                                    style={{ width: 100 }}
                                                                    label="Order"
                                                                    size="xs"
                                                                />
                                                            )}
                                                        </Group>
                                                    );
                                                })}
                                            </Stack>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                );
                            })}
                        </Accordion>
                    </>
                )}

                {(mappingType === "category") && (
                    <>
                        <Group position="apart">
                            <Title order={4}>Categories</Title>
                            {!singleSelect && (
                                <Group>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => handleSelectAll("category")}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        onClick={() => handleDeselectAll("category")}
                                    >
                                        Deselect All
                                    </Button>
                                </Group>
                            )}
                        </Group>

                        <Stack spacing="xs">
                            {categories.map((category) => {
                                const key = `cat_${category.id}`;
                                return (
                                    <Checkbox
                                        key={category.id}
                                        label={category.name}
                                        checked={selectedMappings[key] || false}
                                        onChange={() => handleToggleMapping(key)}
                                    />
                                );
                            })}
                        </Stack>
                    </>
                )}

                <Divider />

                <Group position="right">
                    <Button
                        onClick={handleSave}
                        loading={saving}
                        leftIcon={<FaCheck />}
                        color="green"
                        size="md"
                    >
                        Save Mappings
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
};

export default SectionMappingManager;
