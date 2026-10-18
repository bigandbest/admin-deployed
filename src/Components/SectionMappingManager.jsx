import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    getSectionSubcategoryMappings,
    updateSectionSubcategoryMappings,
    getCategoriesInSection,
    syncCategoriesInSection,
} from "../utils/supabaseApi";

const SUB = "sub_";
const CAT = "cat_";

// Drop every key with the given prefix, then add the new ones (server data replaces, never merges)
const replaceByPrefix = (prev, prefix, next) => {
    const out = {};
    Object.keys(prev).forEach((k) => {
        if (!k.startsWith(prefix)) out[k] = prev[k];
    });
    return { ...out, ...next };
};

const nextOrder = (orders) =>
    Math.max(-1, ...Object.values(orders).filter((v) => typeof v === "number")) + 1;

const SectionMappingManager = ({
    sectionKey,
    sectionName,
    mappingType, // 'subcategory', 'category', or 'both'
    categories,
    subcategories,
    sectionsByKey,
    singleSelect = false,
}) => {
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [selectedMappings, setSelectedMappings] = useState({});
    const [displayOrders, setDisplayOrders] = useState({});

    const sectionId = sectionsByKey?.[sectionKey]?.id ?? null;
    const sectionsResolved = !!sectionsByKey && Object.keys(sectionsByKey).length > 0;

    const wantsSubcategories = mappingType === "subcategory" || mappingType === "both";
    const wantsCategories = mappingType === "category" || mappingType === "both";

    const subcatQuery = useQuery({
        queryKey: ["section-subcategory-mappings", sectionId],
        queryFn: () => getSectionSubcategoryMappings(sectionId),
        enabled: !!sectionId && wantsSubcategories,
    });

    const catQuery = useQuery({
        queryKey: ["section-categories", sectionId],
        queryFn: () => getCategoriesInSection(sectionId),
        enabled: !!sectionId && wantsCategories,
    });

    const loading =
        !sectionsResolved ||
        (wantsSubcategories && !!sectionId && subcatQuery.isLoading) ||
        (wantsCategories && !!sectionId && catQuery.isLoading);

    // The api helpers resolve { success: false } instead of throwing, so surface both shapes
    const loadError =
        (subcatQuery.data && subcatQuery.data.success === false && subcatQuery.data.error) ||
        (catQuery.data && catQuery.data.success === false && catQuery.data.error) ||
        (subcatQuery.error && subcatQuery.error.message) ||
        (catQuery.error && catQuery.error.message) ||
        null;

    useEffect(() => {
        if (sectionsResolved && !sectionId) {
            showNotification({
                message: `Section "${sectionName}" not found`,
                color: "red",
            });
        }
    }, [sectionsResolved, sectionId, sectionName]);

    useEffect(() => {
        if (!wantsSubcategories || !subcatQuery.data?.success) return;
        const mappings = {};
        const orders = {};
        (subcatQuery.data.data || []).forEach((m) => {
            mappings[`${SUB}${m.subcategory_id}`] = true;
            orders[`${SUB}${m.subcategory_id}`] = m.display_order ?? 0;
        });
        setSelectedMappings((prev) => replaceByPrefix(prev, SUB, mappings));
        setDisplayOrders((prev) => replaceByPrefix(prev, SUB, orders));
    }, [wantsSubcategories, subcatQuery.data]);

    useEffect(() => {
        if (!wantsCategories || !catQuery.data?.success) return;
        // singleSelect sections keep only the first mapped category (cleans up legacy data)
        const rows = (catQuery.data.data || []).slice(0, singleSelect ? 1 : undefined);
        const mappings = {};
        rows.forEach((m) => {
            mappings[`${CAT}${m.category_id}`] = true;
        });
        setSelectedMappings((prev) => replaceByPrefix(prev, CAT, mappings));
    }, [wantsCategories, singleSelect, catQuery.data]);

    const handleToggleMapping = (key) => {
        const isSelected = !!selectedMappings[key];

        if (singleSelect) {
            // 0 or 1 selection: picking a new item replaces the current one
            setSelectedMappings(isSelected ? {} : { [key]: true });
            return;
        }

        setSelectedMappings((prev) => ({ ...prev, [key]: !isSelected }));

        // Give a newly selected subcategory the next free display order
        if (!isSelected && key.startsWith(SUB) && displayOrders[key] === undefined) {
            setDisplayOrders((prev) => ({ ...prev, [key]: nextOrder(prev) }));
        }
    };

    const handleDisplayOrderChange = (key, value) => {
        const n = Number(value);
        setDisplayOrders((prev) => ({ ...prev, [key]: Number.isFinite(n) && n >= 0 ? n : 0 }));
    };

    const handleSelectAll = (type) => {
        if (singleSelect) return;

        if (type === "subcategory") {
            const newMappings = {};
            const newOrders = {};
            let order = nextOrder(displayOrders);
            subcategories.forEach((sub) => {
                const key = `${SUB}${sub.id}`;
                newMappings[key] = true;
                if (displayOrders[key] === undefined) newOrders[key] = order++;
            });
            setSelectedMappings((prev) => ({ ...prev, ...newMappings }));
            setDisplayOrders((prev) => ({ ...prev, ...newOrders }));
        } else {
            const newMappings = {};
            categories.forEach((cat) => {
                newMappings[`${CAT}${cat.id}`] = true;
            });
            setSelectedMappings((prev) => ({ ...prev, ...newMappings }));
        }
    };

    const handleDeselectAll = (type) => {
        const prefix = type === "subcategory" ? SUB : CAT;
        setSelectedMappings((prev) => replaceByPrefix(prev, prefix, {}));
    };

    const handleSave = async () => {
        if (!sectionId) {
            showNotification({ message: "Section ID not found", color: "red" });
            return;
        }

        const selectedKeys = (prefix) =>
            Object.keys(selectedMappings)
                .filter((k) => k.startsWith(prefix) && selectedMappings[k])
                .map((k) => ({ key: k, id: k.slice(prefix.length) }));

        const categoryIds = wantsCategories ? selectedKeys(CAT).map((c) => c.id) : [];
        if (singleSelect && categoryIds.length > 1) {
            showNotification({
                message: "Only one category allowed for this section",
                color: "red",
                icon: <FaTimes />,
            });
            return;
        }

        setSaving(true);
        try {
            if (wantsSubcategories) {
                const subcategoryMappings = selectedKeys(SUB)
                    .filter((s) => s.id && s.id !== "undefined")
                    .map((s) => ({
                        subcategory_id: s.id,
                        display_order: displayOrders[s.key] || 0,
                        is_active: true,
                    }));

                const subResult = await updateSectionSubcategoryMappings(sectionId, subcategoryMappings);
                if (!subResult.success) {
                    throw new Error(subResult.error || "Failed to save subcategory mappings");
                }
            }

            if (wantsCategories) {
                const catResult = await syncCategoriesInSection(sectionId, categoryIds);
                if (!catResult.success) {
                    throw new Error(
                        catResult.error?.message || catResult.error || "Failed to save category mappings"
                    );
                }
            }

            showNotification({
                message: `${sectionName} mappings saved successfully`,
                color: "green",
                icon: <FaCheck />,
            });

            queryClient.invalidateQueries({ queryKey: ["section-subcategory-mappings", sectionId] });
            queryClient.invalidateQueries({ queryKey: ["section-categories", sectionId] });
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

    // Subcategories grouped by category once, instead of filtering inside every render of every accordion item
    const subsByCategory = useMemo(() => {
        const map = new Map();
        subcategories.forEach((sub) => {
            if (!map.has(sub.category_id)) map.set(sub.category_id, []);
            map.get(sub.category_id).push(sub);
        });
        return map;
    }, [subcategories]);

    if (loading) {
        return (
            <Card p="md">
                <Group justify="center" py="xl">
                    <Loader size="lg" />
                    <Text>Loading {sectionName} mappings...</Text>
                </Group>
            </Card>
        );
    }

    const selectedCount = Object.values(selectedMappings).filter(Boolean).length;
    const noun =
        mappingType === "subcategory"
            ? "subcategories"
            : mappingType === "category"
              ? "categories"
              : "categories and subcategories";

    const renderBulkButtons = (type) =>
        !singleSelect && (
            <Group>
                <Button size="xs" variant="light" onClick={() => handleSelectAll(type)}>
                    Select All
                </Button>
                <Button size="xs" variant="light" color="red" onClick={() => handleDeselectAll(type)}>
                    Deselect All
                </Button>
            </Group>
        );

    return (
        <Card p="md" withBorder>
            <Stack gap="md">
                <Group justify="space-between">
                    <div>
                        <Title order={3}>{sectionName}</Title>
                        <Text size="sm" c="dimmed">
                            {singleSelect
                                ? "Select one category to display"
                                : `Select which ${noun} to display`}
                        </Text>
                    </div>
                    <Badge size="lg" color="blue">
                        {selectedCount} selected
                    </Badge>
                </Group>

                {loadError && (
                    <Alert color="red" variant="light" title="Could not load current mappings">
                        {String(loadError)}
                    </Alert>
                )}

                {wantsSubcategories && (
                    <Alert icon={<FaInfoCircle />} color="blue" variant="light">
                        Display order determines the sequence in which items appear on the frontend.
                        Lower numbers appear first.
                    </Alert>
                )}

                {wantsCategories && mappingType === "both" && (
                    <>
                        <Group justify="space-between">
                            <Title order={4}>Categories</Title>
                            {renderBulkButtons("category")}
                        </Group>
                        <Stack gap="xs">
                            {categories.map((category) => {
                                const key = `${CAT}${category.id}`;
                                return (
                                    <Checkbox
                                        key={category.id}
                                        label={category.name}
                                        checked={!!selectedMappings[key]}
                                        onChange={() => handleToggleMapping(key)}
                                    />
                                );
                            })}
                        </Stack>
                        <Divider />
                    </>
                )}

                {wantsSubcategories && (
                    <>
                        <Group justify="space-between">
                            <Title order={4}>Subcategories</Title>
                            {renderBulkButtons("subcategory")}
                        </Group>

                        <Accordion variant="separated">
                            {categories.map((category) => {
                                const categorySubs = subsByCategory.get(category.id);
                                if (!categorySubs?.length) return null;
                                const chosen = categorySubs.filter(
                                    (sub) => selectedMappings[`${SUB}${sub.id}`]
                                ).length;

                                return (
                                    <Accordion.Item key={category.id} value={`cat-${category.id}`}>
                                        <Accordion.Control>
                                            <Group>
                                                <Text fw={500}>{category.name}</Text>
                                                <Badge size="sm">
                                                    {chosen} / {categorySubs.length}
                                                </Badge>
                                            </Group>
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <Stack gap="xs">
                                                {categorySubs.map((subcategory) => {
                                                    const key = `${SUB}${subcategory.id}`;
                                                    return (
                                                        <Group key={subcategory.id} justify="space-between">
                                                            <Checkbox
                                                                label={subcategory.name}
                                                                checked={!!selectedMappings[key]}
                                                                onChange={() => handleToggleMapping(key)}
                                                            />
                                                            {selectedMappings[key] && (
                                                                <NumberInput
                                                                    value={displayOrders[key] ?? 0}
                                                                    onChange={(value) =>
                                                                        handleDisplayOrderChange(key, value)
                                                                    }
                                                                    min={0}
                                                                    max={999}
                                                                    allowDecimal={false}
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

                {mappingType === "category" && (
                    <>
                        <Group justify="space-between">
                            <Title order={4}>Categories</Title>
                            {renderBulkButtons("category")}
                        </Group>

                        <Stack gap="xs">
                            {categories.map((category) => {
                                const key = `${CAT}${category.id}`;
                                return (
                                    <Checkbox
                                        key={category.id}
                                        label={category.name}
                                        checked={!!selectedMappings[key]}
                                        onChange={() => handleToggleMapping(key)}
                                    />
                                );
                            })}
                        </Stack>
                    </>
                )}

                <Divider />

                <Group justify="flex-end">
                    <Button
                        onClick={handleSave}
                        loading={saving}
                        disabled={!sectionId || !!loadError}
                        leftSection={<FaCheck />}
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
