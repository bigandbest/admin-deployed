import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { FaCalculator, FaPlus, FaRupeeSign, FaTrash } from "react-icons/fa";
import api from "../../utils/api";

const ENTITY_OPTIONS = [
  { value: "category", label: "Category Level" },
  { value: "subcategory", label: "Subcategory Level" },
  { value: "group", label: "Group Level" },
];

const SOURCE_LABELS = {
  category: "Category",
  subcategory: "Subcategory",
  group: "Group",
};

const PlatformFeeManager = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fees, setFees] = useState([]);
  const [feeGroups, setFeeGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [groups, setGroups] = useState([]);

  const [entityType, setEntityType] = useState("category");
  const [assignmentMode, setAssignmentMode] = useState("single");
  const [entityId, setEntityId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupEntityIds, setGroupEntityIds] = useState([]);
  const [feePercentage, setFeePercentage] = useState(0);

  const [resolveForm, setResolveForm] = useState({
    category_id: "",
    subcategory_id: "",
    group_id: "",
    price: "",
  });
  const [resolved, setResolved] = useState(null);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const subcategoryOptions = useMemo(
    () => subcategories.map((s) => ({ value: s.id, label: `${s.name}` })),
    [subcategories],
  );
  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: g.id, label: `${g.name}` })),
    [groups],
  );

  const entityOptions = useMemo(() => {
    if (entityType === "category") return categoryOptions;
    if (entityType === "subcategory") return subcategoryOptions;
    return groupOptions;
  }, [entityType, categoryOptions, subcategoryOptions, groupOptions]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [feesRes, feeGroupsRes, catRes, subRes, grpRes] = await Promise.allSettled([
        api.get("/platform-fees/admin/list"),
        api.get("/platform-fees/admin/groups"),
        api.get("/categories"),
        api.get("/categories/subcategories"),
        api.get("/categories/groups"),
      ]);

      setFees(
        feesRes.status === "fulfilled" ? feesRes.value?.data?.data || [] : [],
      );
      setCategories(
        catRes.status === "fulfilled" ? catRes.value?.data?.categories || [] : [],
      );
      setFeeGroups(
        feeGroupsRes.status === "fulfilled" ? feeGroupsRes.value?.data?.data || [] : [],
      );
      setSubcategories(
        subRes.status === "fulfilled"
          ? subRes.value?.data?.subcategories || []
          : [],
      );
      setGroups(
        grpRes.status === "fulfilled" ? grpRes.value?.data?.groups || [] : [],
      );

      if (feesRes.status === "rejected") {
        notifications.show({
          title: "Fee List Unavailable",
          message:
            feesRes.reason?.response?.data?.error ||
            feesRes.reason?.message ||
            "Could not fetch configured fee rules right now",
          color: "orange",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error?.response?.data?.error || error?.message || "Failed to load fee manager data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const getEntityName = (entityTypeValue, id) => {
    if (entityTypeValue === "category") {
      return categories.find((c) => c.id === id)?.name || id;
    }
    if (entityTypeValue === "subcategory") {
      return subcategories.find((s) => s.id === id)?.name || id;
    }
    return groups.find((g) => g.id === id)?.name || id;
  };

  const getEntityNames = (entityTypeValue, ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return "-";
    return ids.map((id) => getEntityName(entityTypeValue, id)).join(", ");
  };

  const handleAssign = async () => {
    if (feePercentage === null || feePercentage === undefined) {
      notifications.show({
        title: "Validation Error",
        message: "Fee percentage is required",
        color: "red",
      });
      return;
    }

    try {
      setSubmitting(true);
      if (assignmentMode === "single") {
        if (!entityType || !entityId) {
          notifications.show({
            title: "Validation Error",
            message: "Entity type and entity are required",
            color: "red",
          });
          return;
        }
        await api.post("/platform-fees/admin", {
          entity_type: entityType,
          entity_id: entityId,
          fee_percentage: feePercentage,
        });
      } else {
        if (!entityType || !groupEntityIds.length) {
          notifications.show({
            title: "Validation Error",
            message: "Entity type and at least one entity are required for group assignment",
            color: "red",
          });
          return;
        }
        await api.post("/platform-fees/admin/group", {
          group_name: groupName,
          entity_type: entityType,
          entity_ids: groupEntityIds,
          fee_percentage: feePercentage,
        });
      }

      notifications.show({
        title: "Success",
        message:
          assignmentMode === "single"
            ? "Platform fee assigned successfully"
            : "Platform fee group assigned successfully",
        color: "green",
      });

      setEntityId(null);
      setGroupName("");
      setGroupEntityIds([]);
      setFeePercentage(0);
      await loadAll();
    } catch (error) {
      notifications.show({
        title: "Assignment Failed",
        message: error?.response?.data?.error || error?.message || "Could not assign platform fee",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (row) => {
    modals.openConfirmModal({
      title: "Remove Platform Fee",
      children: (
        <Text size="sm">
          Remove fee rule for {SOURCE_LABELS[row.entity_type] || row.entity_type}{" "}
          <strong>{getEntityName(row.entity_type, row.entity_id)}</strong>?
        </Text>
      ),
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.delete(`/platform-fees/admin/${row.entity_type}/${row.entity_id}`);
          notifications.show({
            title: "Success",
            message: "Platform fee removed",
            color: "green",
          });
          await loadAll();
        } catch (error) {
          notifications.show({
            title: "Delete Failed",
            message:
              error?.response?.data?.error || error?.message || "Could not remove fee rule",
            color: "red",
          });
        }
      },
    });
  };

  const handleDeleteGroup = (row) => {
    modals.openConfirmModal({
      title: "Remove Platform Fee Group",
      children: (
        <Text size="sm">
          Remove fee group <strong>{row.name}</strong> with {row.entity_ids?.length || 0} entities?
        </Text>
      ),
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.delete(`/platform-fees/admin/group/${row.id}`);
          notifications.show({
            title: "Success",
            message: "Platform fee group removed",
            color: "green",
          });
          await loadAll();
        } catch (error) {
          notifications.show({
            title: "Delete Failed",
            message:
              error?.response?.data?.error || error?.message || "Could not remove fee group",
            color: "red",
          });
        }
      },
    });
  };

  const handleResolve = async () => {
    try {
      const params = new URLSearchParams();
      if (resolveForm.category_id) params.set("category_id", resolveForm.category_id);
      if (resolveForm.subcategory_id) params.set("subcategory_id", resolveForm.subcategory_id);
      if (resolveForm.group_id) params.set("group_id", resolveForm.group_id);
      if (resolveForm.price !== "") params.set("price", resolveForm.price);

      const response = await api.get(`/platform-fees/resolve?${params.toString()}`);
      setResolved(response?.data?.data || null);
    } catch (error) {
      notifications.show({
        title: "Resolve Failed",
        message: error?.response?.data?.error || error?.message || "Failed to resolve platform fee",
        color: "red",
      });
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center" mt="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Paper shadow="xs" p="md" mb="lg">
        <Title order={2}>Platform Fee Charges</Title>
        <Text size="sm" c="dimmed" mt={6}>
          Assign fee percentage at Category, Subcategory, or Group level with hierarchy validation.
        </Text>
      </Paper>

      <Paper shadow="xs" p="md" mb="lg">
        <Stack gap="md">
          <SegmentedControl
            value={assignmentMode}
            onChange={setAssignmentMode}
            data={[
              { label: "Single Entity Fee", value: "single" },
              { label: "Entity Group Fee", value: "group" },
            ]}
          />
          <Group grow align="end">
            <Select
              label="Entity Type"
              data={ENTITY_OPTIONS}
              value={entityType}
              onChange={(val) => {
                setEntityType(val || "category");
                setEntityId(null);
                setGroupEntityIds([]);
              }}
              allowDeselect={false}
            />
            {assignmentMode === "single" ? (
              <Select
                label="Entity"
                placeholder="Select entity"
                data={entityOptions}
                value={entityId}
                onChange={setEntityId}
                searchable
              />
            ) : (
              <MultiSelect
                label="Entities"
                placeholder="Select multiple entities"
                data={entityOptions}
                value={groupEntityIds}
                onChange={setGroupEntityIds}
                searchable
              />
            )}
            {assignmentMode === "group" && (
              <TextInput
                label="Group Name (Optional)"
                placeholder="e.g. Fresh Veg Categories"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            )}
            <NumberInput
              label="Fee Percentage (%)"
              value={feePercentage}
              onChange={setFeePercentage}
              min={0}
              max={100}
              decimalScale={2}
              fixedDecimalScale
            />
            <Button
              leftSection={<FaPlus />}
              onClick={handleAssign}
              loading={submitting}
            >
              Assign Fee
            </Button>
          </Group>

          <Alert color="blue" title="Rule Reminder">
            If a fee is configured at a higher level, lower-level structure/actions are restricted by backend validation.
          </Alert>
        </Stack>
      </Paper>

      <Paper shadow="xs" p="md" mb="lg">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Configured Fee Rules</Title>
          <Badge size="lg" color="blue">
            {fees.length} Rules
          </Badge>
        </Group>

        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Level</Table.Th>
              <Table.Th>Entity</Table.Th>
              <Table.Th>Fee %</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fees.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed">
                    No fee rules configured
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              fees.map((row) => (
                <Table.Tr key={`${row.entity_type}-${row.entity_id}`}>
                  <Table.Td>
                    <Badge color="grape" variant="light">
                      {SOURCE_LABELS[row.entity_type] || row.entity_type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{getEntityName(row.entity_type, row.entity_id)}</Table.Td>
                  <Table.Td>{Number(row.fee_percentage).toFixed(2)}%</Table.Td>
                  <Table.Td>
                    <Badge color={row.is_active ? "green" : "gray"}>
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="red" variant="light" onClick={() => handleDelete(row)}>
                      <FaTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper shadow="xs" p="md" mb="lg">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Configured Group Fee Rules</Title>
          <Badge size="lg" color="cyan">
            {feeGroups.length} Groups
          </Badge>
        </Group>

        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Group Name</Table.Th>
              <Table.Th>Level</Table.Th>
              <Table.Th>Fee %</Table.Th>
              <Table.Th>Entities</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {feeGroups.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed">
                    No fee groups configured
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              feeGroups.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.name}</Table.Td>
                  <Table.Td>
                    <Badge color="cyan" variant="light">
                      {SOURCE_LABELS[row.entity_type] || row.entity_type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{Number(row.fee_percentage).toFixed(2)}%</Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ whiteSpace: "normal" }}>
                      {getEntityNames(row.entity_type, row.entity_ids)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="red" variant="light" onClick={() => handleDeleteGroup(row)}>
                      <FaTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper shadow="xs" p="md">
        <Group mb="md">
          <FaCalculator />
          <Title order={4}>Fee Resolver Preview</Title>
        </Group>

        <Group grow align="end">
          <Select
            label="Category"
            data={categoryOptions}
            value={resolveForm.category_id}
            onChange={(val) =>
              setResolveForm((prev) => ({ ...prev, category_id: val || "" }))
            }
            searchable
            clearable
          />
          <Select
            label="Subcategory"
            data={subcategoryOptions}
            value={resolveForm.subcategory_id}
            onChange={(val) =>
              setResolveForm((prev) => ({ ...prev, subcategory_id: val || "" }))
            }
            searchable
            clearable
          />
          <Select
            label="Group"
            data={groupOptions}
            value={resolveForm.group_id}
            onChange={(val) =>
              setResolveForm((prev) => ({ ...prev, group_id: val || "" }))
            }
            searchable
            clearable
          />
          <TextInput
            label="Price (Optional)"
            placeholder="e.g. 499"
            value={resolveForm.price}
            onChange={(e) =>
              setResolveForm((prev) => ({ ...prev, price: e.target.value }))
            }
            leftSection={<FaRupeeSign size={12} />}
          />
          <Button onClick={handleResolve}>Resolve Fee</Button>
        </Group>

        {resolved && (
          <Alert color="teal" mt="md" title="Resolved Result">
            <Text size="sm">
              Applicable Fee: <strong>{Number(resolved.fee_percentage || 0).toFixed(2)}%</strong>
            </Text>
            <Text size="sm">
              Source: <strong>{resolved.source_level || "none"}</strong>
            </Text>
            {resolved.base_price !== undefined && (
              <>
                <Text size="sm">
                  Platform Fee: <strong>₹{Number(resolved.platform_fee_amount || 0).toFixed(2)}</strong>
                </Text>
                <Text size="sm">
                  Seller Earnings: <strong>₹{Number(resolved.seller_earnings || 0).toFixed(2)}</strong>
                </Text>
              </>
            )}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default PlatformFeeManager;
