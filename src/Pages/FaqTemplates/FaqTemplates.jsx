import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  ActionIcon,
  Modal,
  Box,
  LoadingOverlay,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconQuestionMark,
} from "@tabler/icons-react";
import axios from "axios";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const FaqTemplates = () => {
  const { token } = useAdminAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    faqs: [{ question: "", answer: "" }],
  });

  useEffect(() => {
    fetchTemplates();
  }, [token]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/faq-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch FAQ templates",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        faqs:
          template.faqs && template.faqs.length > 0
            ? template.faqs
            : [{ question: "", answer: "" }],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        title: "",
        faqs: [{ question: "", answer: "" }],
      });
    }
    open();
  };

  const handleAddFaq = () => {
    setFormData({
      ...formData,
      faqs: [...formData.faqs, { question: "", answer: "" }],
    });
  };

  const handleRemoveFaq = (index) => {
    const newFaqs = formData.faqs.filter((_, i) => i !== index);
    setFormData({ ...formData, faqs: newFaqs });
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData({ ...formData, faqs: newFaqs });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      notifications.show({
        title: "Error",
        message: "Template title is required",
        color: "red",
      });
      return;
    }

    // Filter out empty FAQs
    const validFaqs = formData.faqs.filter(
      (f) => f.question.trim() || f.answer.trim(),
    );

    if (validFaqs.length === 0) {
      notifications.show({
        title: "Error",
        message: "At least one FAQ is required",
        color: "red",
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title,
        faqs: validFaqs,
      };

      if (editingTemplate) {
        await axios.put(
          `${API_URL}/api/faq-templates/${editingTemplate.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        notifications.show({
          title: "Success",
          message: "Template updated successfully",
          color: "green",
        });
      } else {
        await axios.post(`${API_URL}/api/faq-templates`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        notifications.show({
          title: "Success",
          message: "Template created successfully",
          color: "green",
        });
      }

      close();
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save template",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?"))
      return;

    try {
      await axios.delete(`${API_URL}/api/faq-templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifications.show({
        title: "Success",
        message: "Template deleted successfully",
        color: "green",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete template",
        color: "red",
      });
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box p="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Text size="xl" fw={700}>
            FAQ Templates
          </Text>
          <Text c="dimmed" size="sm">
            Manage reusable FAQ templates for products
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={20} />}
          onClick={() => handleOpenModal()}
        >
          Add Template
        </Button>
      </Group>

      <Card withBorder shadow="sm" radius="md">
        <Group mb="md">
          <TextInput
            placeholder="Search templates..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 300 }}
          />
        </Group>

        <Box pos="relative">
          <LoadingOverlay visible={loading} />
          {filteredTemplates.length === 0 && !loading ? (
            <Text ta="center" py="xl" c="dimmed">
              No templates found
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>FAQs Count</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTemplates.map((template) => (
                  <Table.Tr key={template.id}>
                    <Table.Td fw={500}>{template.title}</Table.Td>
                    <Table.Td>{template.faqs?.length || 0}</Table.Td>
                    <Table.Td>
                      <Badge color={template.is_active ? "green" : "gray"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleOpenModal(template)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(template.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Box>
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Text fw={700} size="lg">
            {editingTemplate ? "Edit Template" : "New FAQ Template"}
          </Text>
        }
        size="lg"
      >
        <Box>
          <TextInput
            label="Template Title"
            placeholder="e.g., Electronics FAQ"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            mb="md"
            required
          />

          <Text fw={500} size="sm" mb="xs">
            Questions & Answers
          </Text>

          <Box className="space-y-4 mb-4">
            {formData.faqs.map((faq, index) => (
              <Card key={index} withBorder p="sm" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    FAQ #{index + 1}
                  </Text>
                  {formData.faqs.length > 1 && (
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleRemoveFaq(index)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  )}
                </Group>
                <TextInput
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) =>
                    handleFaqChange(index, "question", e.target.value)
                  }
                  mb="xs"
                />
                <TextInput
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) =>
                    handleFaqChange(index, "answer", e.target.value)
                  }
                />
              </Card>
            ))}
          </Box>

          <Button
            variant="outline"
            size="xs"
            fullWidth
            onClick={handleAddFaq}
            mb="xl"
            leftSection={<IconPlus size={14} />}
          >
            Add Another Question
          </Button>

          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Save Template
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};

export default FaqTemplates;
