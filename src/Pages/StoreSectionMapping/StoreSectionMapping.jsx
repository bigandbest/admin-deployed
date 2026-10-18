import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Card,
  Select,
  Switch,
  Table,
  Modal,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  MultiSelect,
  LoadingOverlay,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import api from "../../utils/api";

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.message || fallback;

const notifyError = (error, fallback) =>
  showNotification({
    color: "red",
    title: "Error",
    message: errorMessage(error, fallback),
  });

const StoreSectionMapping = () => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [mappings, setMappings] = useState([]);

  // Modal + form state
  const [mappingModal, setMappingModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Only section-group mappings are shown here, so ask the API for just those
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [sectionsRes, mappingsRes] = await Promise.all([
        api.get("/store-section-mappings/product-sections/list", {
          params: { allow_group_mapping: true },
        }),
        api.get("/store-section-mappings/list", {
          params: { type: "section-group" },
        }),
      ]);
      setSections(sectionsRes.data.sections || []);
      setMappings(mappingsRes.data.mappings || []);
    } catch (error) {
      notifyError(error, "Failed to load mappings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get("/categories/groups");
      setGroups(res.data.groups || []);
    } catch (error) {
      notifyError(error, "Failed to load groups");
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Groups are only needed once the modal is opened
  useEffect(() => {
    if (mappingModal && groups.length === 0) fetchGroups();
  }, [mappingModal, groups.length, fetchGroups]);

  const closeModal = () => {
    setMappingModal(false);
    setSelectedSection(null);
    setSelectedGroups([]);
  };

  const handleGroupMapping = async () => {
    if (!selectedSection || selectedGroups.length === 0) return;

    setSubmitting(true);
    try {
      await api.post("/store-section-mappings/section-group", {
        section_id: Number(selectedSection),
        group_ids: selectedGroups,
      });
      showNotification({
        color: "green",
        title: "Saved",
        message: "Group mapping updated",
      });
      closeModal();
      fetchInitialData();
    } catch (error) {
      notifyError(error, "Failed to save group mapping");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMappingStatus = async (mapping) => {
    const next = !mapping.is_active;
    // Optimistic update so the switch responds instantly; rolled back on failure
    setMappings((prev) =>
      prev.map((m) => (m.id === mapping.id ? { ...m, is_active: next } : m))
    );
    try {
      await api.put(`/store-section-mappings/${mapping.id}/status`, {
        is_active: next,
      });
    } catch (error) {
      setMappings((prev) =>
        prev.map((m) =>
          m.id === mapping.id ? { ...m, is_active: mapping.is_active } : m
        )
      );
      notifyError(error, "Failed to update status");
    }
  };

  const runDelete = async (mappingId, failMessage) => {
    try {
      await api.delete(`/store-section-mappings/${mappingId}`);
      fetchInitialData();
    } catch (error) {
      notifyError(error, failMessage);
    }
  };

  // Deletes every group of the section and its linked products (backend cascade)
  const deleteMapping = (mapping) =>
    modals.openConfirmModal({
      title: "Delete mapping",
      children: (
        <Text size="sm">
          Delete all groups mapped to <b>{mapping.section_name}</b>? This also
          removes all linked products from this section.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => runDelete(mapping.id, "Failed to delete mapping"),
    });

  // The list API already returns each group's own mapping id (psg_<id>)
  const deleteIndividualGroup = (group) => {
    if (!group._mapping_id) {
      notifyError(null, "Group mapping ID not found");
      return;
    }
    modals.openConfirmModal({
      title: "Remove group",
      children: (
        <Text size="sm">
          Remove <b>{group.name}</b> from this section?
        </Text>
      ),
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => runDelete(group._mapping_id, "Failed to remove group"),
    });
  };

  const handleEditGroupMapping = (mapping) => {
    setSelectedSection(String(mapping.section_id));
    setSelectedGroups((mapping.groups || []).map((g) => String(g.id)));
    setMappingModal(true);
  };

  // Picking a section in the modal preloads its already-mapped groups
  const handleSectionChange = (value) => {
    setSelectedSection(value);
    const existing = mappings.find((m) => String(m.section_id) === value);
    setSelectedGroups((existing?.groups || []).map((g) => String(g.id)));
  };

  const sectionOptions = useMemo(
    () =>
      sections
        .filter((s) => s.allow_group_mapping)
        .map((s) => ({
          value: String(s.id),
          label: `${s.section_name} (${s.section_key})`,
        })),
    [sections]
  );

  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: String(g.id), label: g.name })),
    [groups]
  );

  return (
    <div className="p-6">
      <LoadingOverlay visible={loading} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Group-Section Mapping
        </h1>
        <Text c="dimmed" size="sm">
          Manage group-section relationships and product assignments
        </Text>
      </div>

      <Card shadow="sm" p="lg" radius="md" className="mb-6">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Group-Section Mappings</Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setMappingModal(true)}
          >
            Map Group to Section
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Section Name</Table.Th>
              <Table.Th>Mapped Groups</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {mappings.length === 0 && !loading && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" size="sm">
                    No group mappings yet
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {mappings.map((mapping) => (
              <Table.Tr key={mapping.id}>
                <Table.Td>{mapping.section_name}</Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {mapping.groups?.map((group) => (
                      <Badge
                        key={group.id}
                        size="lg"
                        variant="filled"
                        color="blue"
                        rightSection={
                          <ActionIcon
                            size="xs"
                            color="white"
                            radius="xl"
                            variant="transparent"
                            aria-label={`Remove ${group.name}`}
                            onClick={() => deleteIndividualGroup(group)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        }
                      >
                        {group.name}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={!!mapping.is_active}
                    onChange={() => toggleMappingStatus(mapping)}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Edit mapping">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        aria-label="Edit mapping"
                        onClick={() => handleEditGroupMapping(mapping)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete mapping & linked products">
                      <ActionIcon
                        variant="light"
                        color="red"
                        aria-label="Delete mapping"
                        onClick={() => deleteMapping(mapping)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={mappingModal}
        onClose={closeModal}
        title="Manage Group-Section Mapping"
        size="md"
      >
        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={submitting} overlayProps={{ blur: 2 }} />
          <Select
            label="Select Section"
            placeholder="Choose a section"
            data={sectionOptions}
            value={selectedSection}
            onChange={handleSectionChange}
            searchable
            required
            mb="md"
          />

          <MultiSelect
            label="Select Groups"
            placeholder="Choose groups to map"
            data={groupOptions}
            value={selectedGroups}
            onChange={setSelectedGroups}
            searchable
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleGroupMapping}
              disabled={!selectedSection || selectedGroups.length === 0}
            >
              Map Groups
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
};

export default StoreSectionMapping;
