import { useState, useEffect } from "react";
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
import {
  IconEdit,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import api from "../../utils/api";

const StoreSectionMapping = () => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [mappings, setMappings] = useState([]);

  // Modal state
  const [categoryMappingModal, setCategoryMappingModal] = useState(false);

  // Form states
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch groups only when modal opens
  useEffect(() => {
    if (categoryMappingModal && groups.length === 0) {
      fetchGroups();
    }
  }, [categoryMappingModal]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, mappingsRes] = await Promise.all([
        api.get("/store-section-mappings/product-sections/list"),
        api.get("/store-section-mappings/list"),
      ]);

      setSections(sectionsRes.data.sections || []);
      setMappings(mappingsRes.data.mappings || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/categories/groups");
      setGroups(res.data.groups || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  // Group-Section Mapping Functions
  const handleGroupMapping = async () => {
    if (!selectedSection || selectedGroups.length === 0) return;

    setSubmitting(true);
    try {
      await api.post("/store-section-mappings/section-group", {
        section_id: selectedSection,
        group_ids: selectedGroups,
      });

      setCategoryMappingModal(false);
      setSelectedSection("");
      setSelectedGroups([]);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to create group-section mapping:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle mapping status
  const toggleMappingStatus = async (mappingId, currentStatus) => {
    try {
      await api.put(`/store-section-mappings/${mappingId}/status`, {
        is_active: !currentStatus,
      });
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update mapping status:", error);
    }
  };

  // Delete mapping — also removes linked products on backend
  const deleteMapping = async (mappingId) => {
    if (window.confirm("Are you sure? This will also remove all linked products from this section.")) {
      try {
        await api.delete(`/store-section-mappings/${mappingId}`);
        fetchInitialData();
      } catch (error) {
        console.error("Failed to delete mapping:", error);
      }
    }
  };

  // Delete individual group from section
  const deleteIndividualGroup = async (mapping, groupId) => {
    if (window.confirm("Are you sure you want to remove this group from the section?")) {
      try {
        // Find the specific group mapping ID
        // The backend expects psg_{id} format for individual group deletions
        const groupMapping = mappings.find(m =>
          m.section_id === mapping.section_id &&
          m.groups?.some(g => g.id === groupId)
        );

        if (groupMapping && groupMapping.groups) {
          const group = groupMapping.groups.find(g => g.id === groupId);
          if (group && group._mapping_id) {
            await api.delete(`/store-section-mappings/${group._mapping_id}`);
            fetchInitialData();
          } else {
            console.error("Group mapping ID not found");
          }
        }
      } catch (error) {
        console.error("Failed to delete individual group:", error);
      }
    }
  };

  // Filter options for group mapping based on allow_group_mapping flag
  const groupMappingSectionOptions = sections
    .filter(s => s.allow_group_mapping)
    .map((section) => ({
      value: section.id.toString(),
      label: `${section.section_name} (${section.section_key})`,
    }));

  const groupOptions = groups.map((group) => ({
    value: group.id.toString(),
    label: group.name,
  }));

  // Handle opening edit modal for group mapping
  const handleEditGroupMapping = (mapping) => {
    setSelectedSection(mapping.section_id.toString());
    const mappedGroupIds = mapping.groups.map(g => g.id.toString());
    setSelectedGroups(mappedGroupIds);
    setCategoryMappingModal(true);
    if (groups.length === 0) {
      fetchGroups();
    }
  };

  // Table columns for section-group mappings
  const sectionGroupColumns = [
    {
      accessor: "section_name",
      title: "Section Name",
    },
    {
      accessor: "groups",
      title: "Mapped Groups",
      render: (mapping) => (
        <div className="flex flex-wrap gap-1">
          {mapping.groups?.map((group) => (
            <Badge
              key={group.id}
              size="sm"
              variant="filled"
              color="blue"
              rightSection={
                <ActionIcon
                  size="xs"
                  color="red"
                  radius="xl"
                  variant="transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteIndividualGroup(mapping, group.id);
                  }}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              }
            >
              {group.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessor: "is_active",
      title: "Status",
      render: (mapping) => (
        <Switch
          checked={mapping.is_active}
          onChange={() => toggleMappingStatus(mapping.id, mapping.is_active)}
        />
      ),
    },
    {
      accessor: "actions",
      title: "Actions",
      render: (mapping) => (
        <Group spacing="xs">
          <Tooltip label="Edit mapping">
            <ActionIcon color="blue" onClick={() => handleEditGroupMapping(mapping)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete mapping & linked products">
            <ActionIcon color="red" onClick={() => deleteMapping(mapping.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  // Filter only section-group mappings
  const sectionGroupMappings = mappings.filter((m) => m.type === "section-group");

  return (
    <div className="p-6">
      <LoadingOverlay visible={loading} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Group-Section Mapping
        </h1>
        <Text color="gray" size="sm">
          Manage group-section relationships and product assignments
        </Text>
      </div>

      <Card shadow="sm" p="lg" radius="md" className="mb-6">
        <Group position="apart" className="mb-4">
          <Text weight={500}>Group-Section Mappings</Text>
          <Button
            leftIcon={<IconPlus size={16} />}
            onClick={() => setCategoryMappingModal(true)}
          >
            Map Group to Section
          </Button>
        </Group>

        <Table>
          <thead>
            <tr>
              {sectionGroupColumns.map((col) => (
                <th key={col.accessor}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionGroupMappings.map((mapping) => (
              <tr key={mapping.id}>
                {sectionGroupColumns.map((col) => (
                  <td key={col.accessor}>
                    {col.render
                      ? col.render(mapping)
                      : mapping[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Group-Section Mapping Modal */}
      <Modal
        opened={categoryMappingModal}
        onClose={() => setCategoryMappingModal(false)}
        title="Manage Group-Section Mapping"
        size="md"
      >
        <div className="space-y-4" style={{ position: "relative" }}>
          <LoadingOverlay visible={submitting} overlayBlur={2} />
          <Select
            label="Select Section"
            placeholder="Choose a section"
            data={groupMappingSectionOptions}
            value={selectedSection}
            onChange={setSelectedSection}
            required
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

          <Group position="right" mt="md">
            <Button
              variant="subtle"
              onClick={() => setCategoryMappingModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGroupMapping}>Map Groups</Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
};

export default StoreSectionMapping;
