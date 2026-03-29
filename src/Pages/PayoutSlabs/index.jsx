import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Button,
  Group,
  Table,
  ActionIcon,
  Modal,
  NumberInput,
  LoadingOverlay,
  Badge,
  Tabs,
  Select,
  TextInput,
  Pagination,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  FaBiking,
  FaRuler,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaEdit,
} from "react-icons/fa";
import api from "../../utils/api";

const PayoutSlabs = () => {
  // ── Distance Slabs state ─────────────────────────────────────────────────
  const [slabs, setSlabs] = useState([]);
  const [slabsLoading, setSlabsLoading] = useState(false);
  const [slabModalOpen, setSlabModalOpen] = useState(false);
  const [editingSlabId, setEditingSlabId] = useState(null);

  // Preview state
  const [previewKm, setPreviewKm] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Payouts state ────────────────────────────────────────────────────────
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutPagination, setPayoutPagination] = useState({ total: 0, pages: 1 });

  // ── Change History state ─────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Slab form ────────────────────────────────────────────────────────────
  const slabForm = useForm({
    initialValues: {
      min_km: 0,
      max_km: null,
      payout_amount: 0,
      effective_from: "",
      effective_to: "",
    },
    validate: {
      min_km: (value) => (value == null || value < 0 ? "Min KM must be >= 0" : null),
      payout_amount: (value) => (value == null || value <= 0 ? "Payout amount must be > 0" : null),
    },
  });

  // ── Fetch slabs ──────────────────────────────────────────────────────────
  const fetchSlabs = async () => {
    setSlabsLoading(true);
    try {
      const response = await api.get("/admin/payout/slabs");
      if (response.data.success) {
        setSlabs(response.data.data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch distance slabs",
        color: "red",
      });
    } finally {
      setSlabsLoading(false);
    }
  };

  // ── Fetch payouts ────────────────────────────────────────────────────────
  const fetchPayouts = async () => {
    setPayoutsLoading(true);
    try {
      const params = { page: payoutPage, limit: 20 };
      if (payoutStatusFilter) params.status = payoutStatusFilter;
      if (payoutSearch) params.rider_id = payoutSearch;
      const response = await api.get("/admin/payout/payouts", { params });
      if (response.data.success) {
        setPayouts(response.data.data);
        setPayoutPagination(response.data.pagination || { total: 0, pages: 1 });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch payouts",
        color: "red",
      });
    } finally {
      setPayoutsLoading(false);
    }
  };

  // ── Fetch history ────────────────────────────────────────────────────────
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get("/admin/payout/slabs/history");
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch change history",
        color: "red",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [payoutPage, payoutStatusFilter]);

  // ── Slab modal open/close ─────────────────────────────────────────────────
  const handleOpenSlabModal = (slab = null) => {
    if (slab) {
      slabForm.setValues({
        min_km: Number(slab.min_km),
        max_km: slab.max_km != null ? Number(slab.max_km) : null,
        payout_amount: Number(slab.payout_amount),
        effective_from: slab.effective_from
          ? new Date(slab.effective_from).toISOString().slice(0, 10)
          : "",
        effective_to: slab.effective_to
          ? new Date(slab.effective_to).toISOString().slice(0, 10)
          : "",
      });
      setEditingSlabId(slab.id);
    } else {
      slabForm.reset();
      setEditingSlabId(null);
    }
    setSlabModalOpen(true);
  };

  // ── Submit slab ──────────────────────────────────────────────────────────
  const handleSlabSubmit = async (values) => {
    setSlabsLoading(true);
    try {
      const payload = {
        min_km: values.min_km,
        payout_amount: values.payout_amount,
      };
      if (values.max_km != null && values.max_km !== "") {
        payload.max_km = values.max_km;
      }
      if (values.effective_from) payload.effective_from = values.effective_from;
      if (values.effective_to) payload.effective_to = values.effective_to;

      if (editingSlabId) {
        await api.patch(`/admin/payout/slabs/${editingSlabId}`, payload);
        notifications.show({
          title: "Success",
          message: "Slab updated successfully",
          color: "green",
        });
      } else {
        await api.post("/admin/payout/slabs", payload);
        notifications.show({
          title: "Success",
          message: "Slab created successfully",
          color: "green",
        });
      }
      setSlabModalOpen(false);
      fetchSlabs();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to save slab",
        color: "red",
      });
    } finally {
      setSlabsLoading(false);
    }
  };

  // ── Toggle slab active ────────────────────────────────────────────────────
  const handleToggleSlab = async (slab) => {
    setSlabsLoading(true);
    try {
      await api.patch(`/admin/payout/slabs/${slab.id}`, {
        is_active: !slab.is_active,
      });
      notifications.show({
        title: "Success",
        message: `Slab ${slab.is_active ? "deactivated" : "activated"}`,
        color: "green",
      });
      fetchSlabs();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to toggle slab status",
        color: "red",
      });
    } finally {
      setSlabsLoading(false);
    }
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (previewKm == null) return;
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const response = await api.get("/admin/payout/slabs/preview", {
        params: { km: previewKm },
      });
      if (response.data.success) {
        setPreviewResult(response.data.data);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to preview slab",
        color: "red",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Approve payout ────────────────────────────────────────────────────────
  const handleApprovePayout = async (id) => {
    setPayoutsLoading(true);
    try {
      await api.post(`/admin/payout/payouts/${id}/approve`);
      notifications.show({
        title: "Success",
        message: "Payout approved and credited to rider wallet",
        color: "green",
      });
      fetchPayouts();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to approve payout",
        color: "red",
      });
    } finally {
      setPayoutsLoading(false);
    }
  };

  // ── Status badge helpers ──────────────────────────────────────────────────
  const getPayoutStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "green";
      case "PENDING":
        return "blue";
      case "DISPUTED":
        return "orange";
      case "MANUAL_REVIEW":
        return "grape";
      case "APPROVED":
        return "teal";
      default:
        return "gray";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const truncate = (str, len = 24) => {
    if (!str) return "—";
    return str.length > len ? str.slice(0, len) + "…" : str;
  };

  const describeChange = (oldVal, newVal) => {
    try {
      const oldStr = typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal ?? "");
      const newStr = typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal ?? "");
      return truncate(`${oldStr} → ${newStr}`, 60);
    } catch {
      return "—";
    }
  };

  return (
    <div className="p-4 relative">
      <Group justify="space-between" mb="md">
        <div>
          <Text size="xl" fw={700}>
            Payout Slabs
          </Text>
          <Text size="sm" color="dimmed">
            Manage distance-based payout slabs for rider delivery fees
          </Text>
        </div>
      </Group>

      <Tabs defaultValue="slabs" onChange={(tab) => tab === "history" && fetchHistory()}>
        <Tabs.List mb="md">
          <Tabs.Tab value="slabs" leftSection={<FaRuler />}>
            Distance Slabs
          </Tabs.Tab>
          <Tabs.Tab value="payouts" leftSection={<FaBiking />}>
            All Payouts
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<FaCheck />}>
            Change History
          </Tabs.Tab>
        </Tabs.List>

        {/* ── TAB 1: Distance Slabs ─────────────────────────────────────── */}
        <Tabs.Panel value="slabs">
          <div className="relative">
            <LoadingOverlay visible={slabsLoading} />

            <Group justify="flex-end" mb="md">
              <Button leftSection={<FaPlus />} onClick={() => handleOpenSlabModal()}>
                Add Slab
              </Button>
            </Group>

            <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Distance Range (km)</Table.Th>
                    <Table.Th>Payout Amount (₹)</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Effective From</Table.Th>
                    <Table.Th>Effective To</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {slabs.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} className="text-center text-gray-500 py-4">
                        No distance slabs configured
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    slabs.map((slab) => (
                      <Table.Tr key={slab.id}>
                        <Table.Td>
                          {Number(slab.min_km)} km – {slab.max_km != null ? `${Number(slab.max_km)} km` : "∞"}
                        </Table.Td>
                        <Table.Td className="font-semibold text-blue-600">
                          ₹{Number(slab.payout_amount).toFixed(2)}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={slab.is_active ? "green" : "red"}>
                            {slab.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{formatDate(slab.effective_from)}</Table.Td>
                        <Table.Td>{formatDate(slab.effective_to)}</Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <ActionIcon
                              color="blue"
                              title="Edit slab"
                              onClick={() => handleOpenSlabModal(slab)}
                            >
                              <FaEdit />
                            </ActionIcon>
                            <ActionIcon
                              color={slab.is_active ? "orange" : "green"}
                              title={slab.is_active ? "Deactivate" : "Activate"}
                              onClick={() => handleToggleSlab(slab)}
                            >
                              {slab.is_active ? <FaToggleOn /> : <FaToggleOff />}
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Card>

            {/* Preview section */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Text fw={600} mb="sm">
                Preview Slab for Distance
              </Text>
              <Group align="flex-end" gap="sm">
                <NumberInput
                  label="Distance (km)"
                  placeholder="Enter km value"
                  min={0}
                  value={previewKm ?? ""}
                  onChange={(val) => setPreviewKm(val === "" ? null : val)}
                  style={{ width: 180 }}
                />
                <Button
                  leftSection={<FaCheck />}
                  onClick={handlePreview}
                  loading={previewLoading}
                  disabled={previewKm == null}
                >
                  Check
                </Button>
              </Group>
              {previewResult !== null && (
                <div className="mt-3">
                  {previewResult ? (
                    <Text size="sm" color="green">
                      Matched slab: {Number(previewResult.slab?.min_km)} km –{" "}
                      {previewResult.slab?.max_km != null
                        ? `${Number(previewResult.slab.max_km)} km`
                        : "∞"}{" "}
                      → Payout: <strong>₹{Number(previewResult.payout_amount).toFixed(2)}</strong>
                    </Text>
                  ) : (
                    <Text size="sm" color="red">
                      No matching slab found for {previewKm} km.
                    </Text>
                  )}
                </div>
              )}
            </Card>
          </div>
        </Tabs.Panel>

        {/* ── TAB 2: All Payouts ────────────────────────────────────────── */}
        <Tabs.Panel value="payouts">
          <div className="relative">
            <LoadingOverlay visible={payoutsLoading} />

            <Group mb="md" gap="sm">
              <Select
                placeholder="Filter by status"
                data={[
                  { value: "", label: "ALL" },
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "PAID", label: "Paid" },
                  { value: "DISPUTED", label: "Disputed" },
                  { value: "MANUAL_REVIEW", label: "Manual Review" },
                ]}
                value={payoutStatusFilter}
                onChange={(val) => {
                  setPayoutStatusFilter(val || "");
                  setPayoutPage(1);
                }}
                clearable
                style={{ width: 180 }}
              />
              <TextInput
                placeholder="Search rider name / phone"
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPayoutPage(1);
                    fetchPayouts();
                  }
                }}
                style={{ width: 240 }}
              />
              <Button variant="light" onClick={() => { setPayoutPage(1); fetchPayouts(); }}>
                Search
              </Button>
            </Group>

            <Card shadow="sm" p="lg" radius="md" withBorder mb="md">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Sub-Order ID</Table.Th>
                    <Table.Th>Rider</Table.Th>
                    <Table.Th>Route Type</Table.Th>
                    <Table.Th>Distance</Table.Th>
                    <Table.Th>Payout Amount</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {payouts.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={8} className="text-center text-gray-500 py-4">
                        No payouts found
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    payouts.map((payout) => (
                      <Table.Tr key={payout.id}>
                        <Table.Td title={payout.sub_order_id}>
                          {truncate(payout.sub_order_id, 12)}
                        </Table.Td>
                        <Table.Td>
                          <div>{payout.rider_name || "—"}</div>
                          <Text size="xs" color="dimmed">
                            {payout.rider_phone || ""}
                          </Text>
                        </Table.Td>
                        <Table.Td>{payout.route_type || "—"}</Table.Td>
                        <Table.Td>
                          {payout.total_km != null ? `${Number(payout.total_km).toFixed(2)} km` : "—"}
                        </Table.Td>
                        <Table.Td className="font-semibold">
                          ₹{Number(payout.payout_amount).toFixed(2)}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getPayoutStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {formatDate(payout.calculated_at)}
                        </Table.Td>
                        <Table.Td>
                          {(payout.status === "PENDING" || payout.status === "MANUAL_REVIEW") && (
                            <Button
                              size="xs"
                              color="green"
                              leftSection={<FaCheck />}
                              onClick={() => handleApprovePayout(payout.id)}
                            >
                              Approve
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Card>

            {payoutPagination.pages > 1 && (
              <Group justify="center">
                <Pagination
                  total={payoutPagination.pages}
                  value={payoutPage}
                  onChange={setPayoutPage}
                />
              </Group>
            )}
          </div>
        </Tabs.Panel>

        {/* ── TAB 3: Change History ─────────────────────────────────────── */}
        <Tabs.Panel value="history">
          <div className="relative">
            <LoadingOverlay visible={historyLoading} />

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>When</Table.Th>
                    <Table.Th>Changed By</Table.Th>
                    <Table.Th>Entity</Table.Th>
                    <Table.Th>Entity ID</Table.Th>
                    <Table.Th>Change Description</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {history.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5} className="text-center text-gray-500 py-4">
                        No change history available
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    history.map((entry) => (
                      <Table.Tr key={entry.id}>
                        <Table.Td>
                          {entry.changed_at
                            ? new Date(entry.changed_at).toLocaleString("en-IN")
                            : "—"}
                        </Table.Td>
                        <Table.Td>{entry.changed_by || "—"}</Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="blue">
                            {entry.entity_type || "—"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{truncate(entry.entity_id, 12)}</Table.Td>
                        <Table.Td title={`${JSON.stringify(entry.old_value)} → ${JSON.stringify(entry.new_value)}`}>
                          {describeChange(entry.old_value, entry.new_value)}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Card>
          </div>
        </Tabs.Panel>
      </Tabs>

      {/* ── Add / Edit Slab Modal ─────────────────────────────────────────── */}
      <Modal
        opened={slabModalOpen}
        onClose={() => setSlabModalOpen(false)}
        title={editingSlabId ? "Edit Distance Slab" : "Add Distance Slab"}
      >
        <form onSubmit={slabForm.onSubmit(handleSlabSubmit)}>
          <NumberInput
            label="Min Distance (km)"
            description="Lower bound of the distance range"
            required
            min={0}
            mb="sm"
            {...slabForm.getInputProps("min_km")}
          />
          <NumberInput
            label="Max Distance (km)"
            description="Upper bound — leave empty for open-ended (∞)"
            min={0}
            mb="sm"
            {...slabForm.getInputProps("max_km")}
          />
          <NumberInput
            label="Payout Amount (₹)"
            description="Fixed payout for deliveries in this distance range"
            required
            min={0}
            mb="sm"
            {...slabForm.getInputProps("payout_amount")}
          />
          <TextInput
            label="Effective From"
            description="Optional — date in YYYY-MM-DD format"
            placeholder="YYYY-MM-DD"
            mb="sm"
            {...slabForm.getInputProps("effective_from")}
          />
          <TextInput
            label="Effective To"
            description="Optional — date in YYYY-MM-DD format"
            placeholder="YYYY-MM-DD"
            mb="xl"
            {...slabForm.getInputProps("effective_to")}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSlabModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Slab</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};

export default PayoutSlabs;
