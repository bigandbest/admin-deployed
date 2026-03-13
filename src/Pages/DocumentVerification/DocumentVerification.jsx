import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Button,
  Group,
  Badge,
  LoadingOverlay,
  Tabs,
  Image,
  Modal,
  Textarea,
  Stack,
  Avatar,
  Paper,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Table,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaMotorcycle,
  FaStore,
  FaEye,
  FaFilter,
} from "react-icons/fa";
import api from "../../utils/api";

const STATUS_COLORS = {
  PENDING: "yellow",
  APPROVED: "green",
  REJECTED: "red",
};

const VERIFICATION_STATUS_COLORS = {
  PENDING_VERIFICATION: "yellow",
  VERIFIED: "green",
  ACTION_REQUIRED: "red",
  SUSPENDED: "gray",
};

const DOC_TYPE_LABELS = {
  // Rider doc types
  DRIVERS_LICENSE: "Driver's License",
  ID_PROOF: "ID Proof",
  VEHICLE_REGISTRATION: "Vehicle Registration",
  PHOTO: "Profile Photo",
  // Seller doc types
  GSTIN_CERTIFICATE: "GSTIN Certificate",
  PAN_CARD: "PAN Card",
  BUSINESS_LICENSE: "Business License",
  ADDRESS_PROOF: "Address Proof",
};

const DocumentVerification = () => {
  const [activeTab, setActiveTab] = useState("riders");
  const [statusFilter, setStatusFilter] = useState("PENDING_VERIFICATION");
  const [riders, setRiders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, docId: null, docType: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ open: false, person: null, isSeller: false });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/riders/all-pending?status=${statusFilter}`);
      if (response.data.success) {
        setRiders(response.data.data.riders || []);
        setSellers(response.data.data.sellers || []);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch verification requests",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (docId, isSellerDoc = false) => {
    setActionLoading(docId);
    try {
      const endpoint = isSellerDoc
        ? `/admin/riders/sellers/documents/${docId}/review`
        : `/admin/riders/documents/${docId}/review`;
      const response = await api.put(endpoint, { action: "APPROVE" });
      if (response.data.success) {
        notifications.show({
          title: "Approved",
          message: "Document approved successfully",
          color: "green",
        });
        
        // Update person in modal if open
        if (detailsModal.open && detailsModal.person) {
           const updatedDocs = detailsModal.person.documents.map(d => 
              d.id === docId ? { ...d, status: 'APPROVED' } : d
           );
           setDetailsModal(prev => ({ ...prev, person: { ...prev.person, documents: updatedDocs } }));
        }
        fetchRequests();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to approve document",
        color: "red",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      notifications.show({
        title: "Required",
        message: "Please provide a rejection reason",
        color: "orange",
      });
      return;
    }
    setActionLoading(rejectModal.docId);
    try {
      const isSellerDoc = rejectModal.docType === "seller";
      const endpoint = isSellerDoc
        ? `/admin/riders/sellers/documents/${rejectModal.docId}/review`
        : `/admin/riders/documents/${rejectModal.docId}/review`;
      const response = await api.put(endpoint, {
        action: "REJECT",
        rejection_reason: rejectionReason,
      });
      if (response.data.success) {
        notifications.show({
          title: "Rejected",
          message: "Document rejected successfully",
          color: "orange",
        });
        
        // Update person in modal if open
        if (detailsModal.open && detailsModal.person) {
           const updatedDocs = detailsModal.person.documents.map(d => 
              d.id === rejectModal.docId ? { ...d, status: 'REJECTED', rejection_reason: rejectionReason } : d
           );
           setDetailsModal(prev => ({ ...prev, person: { ...prev.person, documents: updatedDocs } }));
        }

        setRejectModal({ open: false, docId: null, docType: null });
        setRejectionReason("");
        fetchRequests();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to reject document",
        color: "red",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const renderDocumentCard = (doc, isSellerDoc = false) => (
    <Paper
      key={doc.id}
      shadow="xs"
      p="md"
      radius="md"
      withBorder
      style={{
        borderLeftWidth: 4,
        borderLeftColor:
          doc.status === "APPROVED"
            ? "#40c057"
            : doc.status === "REJECTED"
            ? "#fa5252"
            : "#fab005",
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Text fw={600} size="sm">
            {DOC_TYPE_LABELS[doc.type] || doc.type}
          </Text>
          <Badge
            color={STATUS_COLORS[doc.status] || "gray"}
            size="sm"
            variant="light"
          >
            {doc.status}
          </Badge>
        </Group>
        <Group gap="xs">
          {doc.url && (
            <Tooltip label="View Full Image">
              <ActionIcon
                variant="light"
                color="blue"
                onClick={() => setSelectedImage(doc.url)}
              >
                <FaEye />
              </ActionIcon>
            </Tooltip>
          )}
          {doc.status !== "APPROVED" && (
            <>
              <Tooltip label="Approve">
                <ActionIcon
                  variant="filled"
                  color="green"
                  loading={actionLoading === doc.id}
                  onClick={() => handleApprove(doc.id, isSellerDoc)}
                >
                  <FaCheckCircle />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reject">
                <ActionIcon
                  variant="filled"
                  color="red"
                  onClick={() =>
                    setRejectModal({
                      open: true,
                      docId: doc.id,
                      docType: isSellerDoc ? "seller" : "rider",
                    })
                  }
                >
                  <FaTimesCircle />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Group>

      {doc.url && (
        <Image
          src={doc.url}
          radius="md"
          h={120}
          fit="contain"
          style={{ cursor: "pointer", backgroundColor: "#f8f9fa", marginTop: 8 }}
          onClick={() => setSelectedImage(doc.url)}
        />
      )}

      {doc.rejection_reason && (
        <Text size="xs" c="red" mt="xs" fs="italic">
          Reason: {doc.rejection_reason}
        </Text>
      )}
    </Paper>
  );

  const renderTable = (data, isSeller = false) => {
    if (data.length === 0) {
      return (
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Text ta="center" c="dimmed" size="lg">
            No {isSeller ? "seller" : "rider"} verification requests with status: {statusFilter.replace(/_/g, " ")}
          </Text>
        </Card>
      );
    }

    const rows = data.map((person) => (
      <Table.Tr key={person.rider_id || person.seller_id}>
        <Table.Td>
          <Group gap="sm">
            <Avatar color={isSeller ? "teal" : "blue"} radius="xl" size="sm">
              {isSeller ? <FaStore size={14} /> : <FaMotorcycle size={14} />}
            </Avatar>
            <Text size="sm" fw={500}>
              {person.name || "N/A"}
            </Text>
          </Group>
        </Table.Td>
        <Table.Td>{person.email}</Table.Td>
        <Table.Td>
          {isSeller ? (
            <Text size="sm">{person.business_name || "N/A"}</Text>
          ) : (
            <Text size="sm">{person.vehicle_number || "N/A"}</Text>
          )}
        </Table.Td>
        <Table.Td>
          <Badge color={VERIFICATION_STATUS_COLORS[person.verification_status] || "gray"} variant="light">
            {person.verification_status?.replace(/_/g, " ")}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{person.documents?.length || 0} docs</Text>
        </Table.Td>
        <Table.Td>
          <Tooltip label="View Verification Details">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => setDetailsModal({ open: true, person, isSeller })}
            >
              <FaEye />
            </ActionIcon>
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    ));

    return (
      <Card shadow="sm" p="md" radius="md" withBorder>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>{isSeller ? "Business Name" : "Vehicle Number"}</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Documents</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Card>
    );
  };

  const renderDetailsModalContent = () => {
    if (!detailsModal.person) return null;
    const { person, isSeller } = detailsModal;

    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Group>
            <Avatar color={isSeller ? "teal" : "blue"} radius="xl" size="lg">
              {isSeller ? <FaStore size={20} /> : <FaMotorcycle size={20} />}
            </Avatar>
            <div>
              <Text fw={700} size="xl">
                {person.name || "N/A"}
              </Text>
              <Text size="sm" c="dimmed">
                {person.email} • 📞 {person.phone || "N/A"}
              </Text>
            </div>
          </Group>
          <Badge
            color={VERIFICATION_STATUS_COLORS[person.verification_status] || "gray"}
            variant="filled"
            size="lg"
          >
            {person.verification_status?.replace(/_/g, " ")}
          </Badge>
        </Group>

        <Paper withBorder p="md" radius="md" bg="gray.0">
          <SimpleGrid cols={2} spacing="md">
            {isSeller ? (
              <>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Business Name</Text>
                  <Text>{person.business_name || "N/A"}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>GSTIN</Text>
                  <Text>{person.gstin || "N/A"}</Text>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Vehicle Details</Text>
                  <Text>{person.vehicle_type} - {person.vehicle_number || "N/A"}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>License Number</Text>
                  <Text>{person.license_number || "N/A"}</Text>
                </div>
              </>
            )}
          </SimpleGrid>
        </Paper>

        <div>
          <Text fw={600} size="lg" mb="sm">Uploaded Documents</Text>
          {person.documents && person.documents.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {person.documents.map((doc) => renderDocumentCard(doc, isSeller))}
            </SimpleGrid>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              No documents uploaded yet
            </Text>
          )}
        </div>
      </Stack>
    );
  };

  return (
    <div className="p-4 relative">
      <LoadingOverlay visible={loading} />

      <Group justify="space-between" mb="xl">
        <div>
          <Text size="xl" fw={700}>
            Document Verification
          </Text>
          <Text size="sm" c="dimmed">
            Review and verify documents submitted by riders and sellers
          </Text>
        </div>
        <Group>
          <Button
            variant={statusFilter === "PENDING_VERIFICATION" ? "filled" : "light"}
            color="yellow"
            size="sm"
            onClick={() => setStatusFilter("PENDING_VERIFICATION")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "ACTION_REQUIRED" ? "filled" : "light"}
            color="red"
            size="sm"
            onClick={() => setStatusFilter("ACTION_REQUIRED")}
          >
            Action Required
          </Button>
          <Button
            variant={statusFilter === "VERIFIED" ? "filled" : "light"}
            color="green"
            size="sm"
            onClick={() => setStatusFilter("VERIFIED")}
          >
            Verified
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
        <Tabs.List mb="md">
          <Tabs.Tab value="riders" leftSection={<FaMotorcycle />}>
            Riders ({riders.length})
          </Tabs.Tab>
          <Tabs.Tab value="sellers" leftSection={<FaStore />}>
            Sellers ({sellers.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="riders">
          {renderTable(riders, false)}
        </Tabs.Panel>

        <Tabs.Panel value="sellers">
          {renderTable(sellers, true)}
        </Tabs.Panel>
      </Tabs>

      {/* Details Verification Modal */}
      <Modal
        opened={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, person: null, isSeller: false })}
        title={
          <Text fw={700} size="lg">
            {detailsModal.isSeller ? "Seller Details" : "Rider Details"}
          </Text>
        }
        size="80%"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        {renderDetailsModalContent()}
      </Modal>

      {/* Image Preview Modal (on top of details modal) */}
      <Modal
        opened={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title="Document Preview"
        size="xl"
        centered
        zIndex={1000}
      >
        {selectedImage && (
          <Image src={selectedImage} fit="contain" radius="md" />
        )}
      </Modal>

      {/* Rejection Reason Modal (on top of details modal) */}
      <Modal
        opened={rejectModal.open}
        onClose={() => {
          setRejectModal({ open: false, docId: null, docType: null });
          setRejectionReason("");
        }}
        title="Reject Document"
        centered
        zIndex={1000}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Please provide a reason for rejecting this document. The user will
            see this reason and can re-upload.
          </Text>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            minRows={3}
            required
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setRejectModal({ open: false, docId: null, docType: null });
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleReject}
              loading={actionLoading === rejectModal.docId}
            >
              Reject Document
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default DocumentVerification;
