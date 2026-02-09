import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Select,
  Switch,
  Table,
  Modal,
  TextInput,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Tabs,
  MultiSelect,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import api from "../../utils/api";

const StoreSectionMapping = () => {
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [sections, setSections] = useState([]);
  const [mappings, setMappings] = useState([]);

  // Modal states
  const [storeMappingModal, setStoreMappingModal] = useState(false);
  const [categoryMappingModal, setCategoryMappingModal] = useState(false);

  // Form states
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("store-mapping");
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
      const [storesRes, sectionsRes, mappingsRes] =
        await Promise.all([
          api.get("/recommended-stores/list"),
          api.get("/store-section-mappings/product-sections/list"),
          api.get("/store-section-mappings/list"),
        ]);

      setStores(storesRes.data.recommendedStores || []);
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

  // Store-Section Mapping Functions
  const handleStoreMapping = async () => {
    if (!selectedStore || selectedSections.length === 0) return;

    setSubmitting(true);
    try {
      await api.post("/store-section-mappings/store-sections", {
        store_id: selectedStore,
        section_ids: selectedSections,
      });

      setStoreMappingModal(false);
      setSelectedStore("");
      setSelectedSections([]);
      fetchInitialData(); // Just refresh mappings
    } catch (error) {
      console.error("Failed to create store-section mapping:", error);
    } finally {
      setSubmitting(false);
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
      fetchInitialData(); // Just refresh mappings
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

  // Delete mapping
  const deleteMapping = async (mappingId) => {
    if (window.confirm("Are you sure you want to delete this mapping?")) {
      try {
        await api.delete(`/store-section-mappings/${mappingId}`);
        fetchInitialData();
      } catch (error) {
        console.error("Failed to delete mapping:", error);
      }
    }
  };

  // Format options for selects
  const storeOptions = stores.map((store) => ({
    value: store.id.toString(),
    label: store.name,
  }));

  const sectionOptions = sections.map((section) => ({
    value: section.id.toString(),
    label: `${section.section_name} (${section.section_key})`,
  }));



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
    // Fetch groups if not already loaded (might be needed if modal wasn't opened before)
    if (groups.length === 0) {
      fetchGroups();
    }
  };

  // Table columns for store-section mappings
  const storeSectionColumns = [
    {
      accessor: "store_name",
      title: "Store Name",
    },
    {
      accessor: "sections",
      title: "Mapped Sections",
      render: (mapping) => (
        <div className="flex flex-wrap gap-1">
          {mapping.sections?.map((section) => (
            <Badge key={section.id} size="sm" variant="light">
              {section.section_name}
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
          <Tooltip label="Delete mapping">
            <ActionIcon color="red" onClick={() => deleteMapping(mapping.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];


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
            <Badge key={group.id} size="sm" variant="filled" color="blue">
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
          <Tooltip label="Delete mapping">
            <ActionIcon color="red" onClick={() => deleteMapping(mapping.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <div className="p-6">
      <LoadingOverlay visible={loading} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Store & Section Mapping
        </h1>
        <Text color="gray" size="sm">
          Manage store-section relationships and product assignments
        </Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} className="mb-6">
        <Tabs.List>
          <Tabs.Tab value="store-mapping" icon={<IconSettings size={16} />}>
            Store-Section Mapping
          </Tabs.Tab>
          <Tabs.Tab value="category-mapping" icon={<IconPlus size={16} />}>
            Group-Section Mapping
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="store-mapping" pt="lg">
          <Card shadow="sm" p="lg" radius="md" className="mb-6">
            <Group position="apart" className="mb-4">
              <Text weight={500}>Store-Section Mappings</Text>
              <Button
                leftIcon={<IconPlus size={16} />}
                onClick={() => setStoreMappingModal(true)}
              >
                Map Store to Sections
              </Button>
            </Group>

            <Table>
              <thead>
                <tr>
                  {storeSectionColumns.map((col) => (
                    <th key={col.accessor}>{col.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappings
                  .filter((m) => m.type === "store-section")
                  .map((mapping) => (
                    <tr key={mapping.id}>
                      {storeSectionColumns.map((col) => (
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
        </Tabs.Panel>


        <Tabs.Panel value="category-mapping" pt="lg">
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
                {mappings
                  .filter((m) => m.type === "section-group")
                  .map((mapping) => (
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
        </Tabs.Panel>
      </Tabs>

      {/* Store-Section Mapping Modal */}
      <Modal
        opened={storeMappingModal}
        onClose={() => setStoreMappingModal(false)}
        title="Map Store to Sections"
        size="md"
      >
        <div className="space-y-4" style={{ position: "relative" }}>
          <LoadingOverlay visible={submitting} overlayBlur={2} />
          <Select
            label="Select Store"
            placeholder="Choose a store"
            data={storeOptions}
            value={selectedStore}
            onChange={setSelectedStore}
            required
          />

          <MultiSelect
            label="Select Sections"
            placeholder="Choose sections to map"
            data={sectionOptions}
            value={selectedSections}
            onChange={setSelectedSections}
            required
          />

          <Group position="right" mt="md">
            <Button
              variant="subtle"
              onClick={() => setStoreMappingModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStoreMapping}>Create Mapping</Button>
          </Group>
        </div>
      </Modal>


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
