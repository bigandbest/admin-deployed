import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Text,
  Table,
  Badge,
  Button,
  Select,
  Modal,
  Textarea,
  Pagination,
  Group,
  Stack,
  Loader,
  TextInput,
} from "@mantine/core";
import { FaEye, FaSyncAlt, FaSearch } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { getAllBulkOrders, updateBulkOrderStatus } from "../../utils/backendApi";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Quoted", label: "Quoted" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Completed", label: "Completed" },
];

const STATUS_COLORS = {
  Pending: "yellow",
  "In Progress": "blue",
  Quoted: "violet",
  Approved: "green",
  Rejected: "red",
  Completed: "teal",
};

const BulkOrders = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail / update modal
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchEnquiries = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getAllBulkOrders();
      if (result.success) {
        let data = result.enquiries || [];
        if (statusFilter) data = data.filter((e) => e.status === statusFilter);
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(
            (e) =>
              e.company_name?.toLowerCase().includes(q) ||
              e.contact_person?.toLowerCase().includes(q) ||
              e.product_name?.toLowerCase().includes(q) ||
              e.phone?.includes(q)
          );
        }
        const pageSize = 20;
        setTotalPages(Math.ceil(data.length / pageSize));
        setEnquiries(data.slice((page - 1) * pageSize, page * pageSize));
      } else {
        notifications.show({ color: "red", message: "Failed to load bulk orders." });
      }
    } catch (err) {
      notifications.show({ color: "red", message: "Error loading bulk orders." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(currentPage);
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEnquiries(1);
  };

  const openDetail = (enquiry) => {
    setSelected(enquiry);
    setUpdateStatus(enquiry.status);
    setAdminNotes(enquiry.admin_notes || "");
    setModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      // updateBulkOrderStatus only sends status; extend with adminNotes via direct fetch
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_BASE_URL}/bulk-order/enquiry/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updateStatus, adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ color: "green", message: "Enquiry updated successfully." });
        setModalOpen(false);
        fetchEnquiries(currentPage);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      notifications.show({ color: "red", message: "Failed to update enquiry." });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Group position="apart" mb="lg">
        <Title order={2}>Bulk Order Enquiries</Title>
        <Button
          leftIcon={<FaSyncAlt />}
          variant="light"
          onClick={() => fetchEnquiries(currentPage)}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      {/* Filters */}
      <Card shadow="sm" p="md" mb="lg" radius="md">
        <Group>
          <TextInput
            placeholder="Search company, contact, product..."
            icon={<FaSearch size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            data={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v || ""); setCurrentPage(1); }}
            clearable
            style={{ minWidth: 180 }}
          />
          <Button onClick={handleSearch}>Search</Button>
        </Group>
      </Card>

      {/* Table */}
      <Card shadow="sm" radius="md" p={0}>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : enquiries.length === 0 ? (
          <Text color="dimmed" align="center" py="xl">
            No bulk order enquiries found.
          </Text>
        ) : (
          <div className="overflow-x-auto">
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Expected Price</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Text size="sm" weight={500}>{e.company_name}</Text>
                      {e.gst_number && <Text size="xs" color="dimmed">GST: {e.gst_number}</Text>}
                    </td>
                    <td>
                      <Text size="sm">{e.contact_person}</Text>
                      <Text size="xs" color="dimmed">{e.phone}</Text>
                      {e.email && <Text size="xs" color="dimmed">{e.email}</Text>}
                    </td>
                    <td>
                      <Text size="sm">{e.product_name}</Text>
                      {e.variant_details && <Text size="xs" color="dimmed">{e.variant_details}</Text>}
                    </td>
                    <td><Text size="sm">{e.quantity}</Text></td>
                    <td>
                      <Text size="sm">
                        {e.expected_price ? `₹${parseFloat(e.expected_price).toLocaleString()}` : "—"}
                      </Text>
                    </td>
                    <td>
                      <Badge color={STATUS_COLORS[e.status] || "gray"} variant="light">
                        {e.status}
                      </Badge>
                    </td>
                    <td>
                      <Text size="xs" color="dimmed">
                        {e.created_at ? new Date(e.created_at).toLocaleDateString("en-IN") : "—"}
                      </Text>
                    </td>
                    <td>
                      <Button
                        size="xs"
                        leftIcon={<FaEye />}
                        variant="light"
                        onClick={() => openDetail(e)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <Group position="center" mt="lg">
          <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
        </Group>
      )}

      {/* Detail / Update Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={<Text weight={600}>Bulk Order Enquiry — {selected?.company_name}</Text>}
        size="lg"
      >
        {selected && (
          <Stack spacing="sm">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Contact:</span> <strong>{selected.contact_person}</strong></div>
              <div><span className="text-gray-500">Phone:</span> {selected.phone}</div>
              <div><span className="text-gray-500">Email:</span> {selected.email || "—"}</div>
              <div><span className="text-gray-500">GST No:</span> {selected.gst_number || "—"}</div>
              <div><span className="text-gray-500">Product:</span> <strong>{selected.product_name}</strong></div>
              <div><span className="text-gray-500">Quantity:</span> {selected.quantity}</div>
              <div><span className="text-gray-500">Expected Price:</span> {selected.expected_price ? `₹${parseFloat(selected.expected_price).toLocaleString()}` : "—"}</div>
              <div><span className="text-gray-500">Delivery Timeline:</span> {selected.delivery_timeline || "—"}</div>
              {selected.variant_details && (
                <div className="col-span-2"><span className="text-gray-500">Variant:</span> {selected.variant_details}</div>
              )}
              {selected.address && (
                <div className="col-span-2"><span className="text-gray-500">Address:</span> {selected.address}</div>
              )}
              {selected.description && (
                <div className="col-span-2"><span className="text-gray-500">Description:</span> {selected.description}</div>
              )}
            </div>

            <div className="border-t pt-3 mt-2">
              <Text size="sm" weight={600} mb="xs">Update Status</Text>
              <Select
                data={STATUS_OPTIONS.slice(1)}
                value={updateStatus}
                onChange={setUpdateStatus}
                mb="sm"
              />
              <Textarea
                label="Admin Notes"
                placeholder="Add internal notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                minRows={3}
                mb="sm"
              />
              <Group position="right">
                <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdate} loading={updating}>Save</Button>
              </Group>
            </div>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default BulkOrders;
