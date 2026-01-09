import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Text,
  Group,
  Button,
  TextInput,
  Textarea,
  Switch,
  Stack,
  Alert,
  Table,
  ActionIcon,
  Divider,
  Paper,
  Collapse,
  Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconInfoCircle, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { createZone, updateZone } from "../../utils/zoneApi";

const ZoneForm = ({ opened, onClose, zone, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [pincodes, setPincodes] = useState([]);
  const [showPincodeForm, setShowPincodeForm] = useState(false);
  const [editingPincodeIndex, setEditingPincodeIndex] = useState(null);
  const isEdit = Boolean(zone);

  const form = useForm({
    initialValues: {
      name: "",
      display_name: "",
      description: "",
      is_nationwide: false,
      is_active: true,
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return "Zone name is required";
        if (value.length > 100)
          return "Zone name must be less than 100 characters";
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(value))
          return "Zone name contains invalid characters";
        if (
          ["nationwide", "all", "global", "admin", "system"].includes(
            value.toLowerCase()
          )
        ) {
          return "This zone name is reserved";
        }
        return null;
      },
      display_name: (value) => {
        if (!value.trim()) return "Display name is required";
        if (value.length > 150)
          return "Display name must be less than 150 characters";
        return null;
      },
      description: (value) => {
        if (value && value.length > 500)
          return "Description must be less than 500 characters";
        return null;
      },
    },
  });

  const pincodeForm = useForm({
    initialValues: {
      pincode: "",
      city: "",
      state: "",
      district: "",
      location_name: "",
      village: "",
      others: "",
      is_active: true,
    },
    validate: {
      pincode: (value) => {
        if (!value.trim()) return "Pincode is required";
        if (!/^\d{6}$/.test(value)) return "Pincode must be 6 digits";
        return null;
      },
    },
  });

  // Update form when zone prop changes
  useEffect(() => {
    if (zone) {
      const newValues = {
        name: zone.name || "",
        display_name: zone.display_name || "",
        description: zone.description || "",
        is_nationwide: zone.is_nationwide || false,
        is_active: zone.is_active !== undefined ? zone.is_active : true,
      };

      const currentValues = form.getValues();
      if (JSON.stringify(newValues) !== JSON.stringify(currentValues)) {
        form.setValues(newValues);
      }

      // Load existing pincodes if editing
      if (zone.pincodes && Array.isArray(zone.pincodes)) {
        setPincodes(zone.pincodes.map(p => ({
          pincode: p.pincode || "",
          city: p.city || "",
          state: p.state || "",
          district: p.district || "",
          location_name: p.location_name || "",
          village: p.village || "",
          others: p.others || "",
          is_active: p.is_active !== undefined ? p.is_active : true,
        })));
      }
    } else {
      form.reset();
      setPincodes([]);
    }
  }, [zone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPincode = () => {
    const validation = pincodeForm.validate();
    if (validation.hasErrors) return;

    const newPincode = pincodeForm.values;

    // Check for duplicate pincode
    const isDuplicate = pincodes.some(
      (p, idx) => p.pincode === newPincode.pincode && idx !== editingPincodeIndex
    );

    if (isDuplicate) {
      notifications.show({
        title: "Duplicate Pincode",
        message: "This pincode already exists in the list",
        color: "orange",
        icon: <IconX />,
      });
      return;
    }

    if (editingPincodeIndex !== null) {
      // Update existing pincode
      const updatedPincodes = [...pincodes];
      updatedPincodes[editingPincodeIndex] = newPincode;
      setPincodes(updatedPincodes);
      setEditingPincodeIndex(null);
    } else {
      // Add new pincode
      setPincodes([...pincodes, newPincode]);
    }

    pincodeForm.reset();
    setShowPincodeForm(false);
  };

  const handleEditPincode = (index) => {
    setEditingPincodeIndex(index);
    pincodeForm.setValues(pincodes[index]);
    setShowPincodeForm(true);
  };

  const handleDeletePincode = (index) => {
    setPincodes(pincodes.filter((_, idx) => idx !== index));
  };

  const handleTogglePincodeActive = (index) => {
    const updatedPincodes = [...pincodes];
    updatedPincodes[index] = {
      ...updatedPincodes[index],
      is_active: !updatedPincodes[index].is_active,
    };
    setPincodes(updatedPincodes);
  };

  const handleCancelPincode = () => {
    pincodeForm.reset();
    setShowPincodeForm(false);
    setEditingPincodeIndex(null);
  };

  const handleSubmit = async (values) => {
    // Validate pincodes for non-nationwide zones
    if (!values.is_nationwide && pincodes.length === 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please add at least one pincode for zonal delivery",
        color: "orange",
        icon: <IconX />,
      });
      return;
    }

    setLoading(true);
    try {
      const zoneData = {
        ...values,
        pincodes: values.is_nationwide ? [] : pincodes,
      };

      let result;
      if (isEdit) {
        result = await updateZone(zone.id, zoneData);
      } else {
        result = await createZone(zoneData);
      }

      if (result.success) {
        notifications.show({
          title: "Success",
          message: `Zone ${isEdit ? "updated" : "created"} successfully`,
          color: "green",
          icon: <IconCheck />,
        });

        form.reset();
        setPincodes([]);
        onSuccess();
        onClose();
      } else {
        throw new Error(
          result.error || `Failed to ${isEdit ? "update" : "create"} zone`
        );
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.message || `Failed to ${isEdit ? "update" : "create"} zone`,
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setPincodes([]);
    pincodeForm.reset();
    setShowPincodeForm(false);
    setEditingPincodeIndex(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? "Edit Zone" : "Create New Zone"}
      size="xl"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          {/* Zone Name */}
          <TextInput
            label="Zone Name"
            placeholder="e.g., delhi_ncr, mumbai_metro"
            required
            autoFocus
            {...form.getInputProps("name")}
          />

          {/* Display Name */}
          <TextInput
            label="Display Name"
            placeholder="e.g., Delhi NCR, Mumbai Metropolitan"
            required
            {...form.getInputProps("display_name")}
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Describe the coverage area of this zone..."
            rows={3}
            {...form.getInputProps("description")}
          />

          {/* Nationwide Toggle */}
          <div>
            <Switch
              label="Nationwide Zone"
              description="Enable if this zone covers all pincodes nationwide"
              disabled={isEdit && zone?.name === "nationwide"}
              {...form.getInputProps("is_nationwide", { type: "checkbox" })}
              onChange={(event) => {
                form.setFieldValue("is_nationwide", event.currentTarget.checked);
                if (event.currentTarget.checked) {
                  setPincodes([]);
                  setShowPincodeForm(false);
                }
              }}
            />
          </div>

          {/* Nationwide Warning */}
          {form.values.is_nationwide && (
            <Alert
              icon={<IconInfoCircle />}
              title="Nationwide Zone"
              color="blue"
            >
              <Text size="sm">
                Nationwide zones don&apos;t require pincode entries. Products
                assigned to this zone will be available for delivery across all
                pincodes.
              </Text>
            </Alert>
          )}

          {/* Pincode Management */}
          {!form.values.is_nationwide && (
            <>
              <Divider label="Pincode Management" labelPosition="center" />

              <Group justify="space-between" align="center">
                <Text size="sm" weight={500}>
                  Pincodes ({pincodes.length})
                </Text>
                <Button
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setShowPincodeForm(!showPincodeForm)}
                  variant="light"
                >
                  {showPincodeForm ? "Cancel" : "Add Pincode"}
                </Button>
              </Group>

              {/* Pincode Entry Form */}
              <Collapse in={showPincodeForm}>
                <Paper withBorder p="md" bg="gray.0">
                  <Stack spacing="sm">
                    <Text size="sm" weight={500}>
                      {editingPincodeIndex !== null ? "Edit Pincode" : "Add New Pincode"}
                    </Text>

                    <Group grow>
                      <TextInput
                        label="Pincode"
                        placeholder="110001"
                        required
                        {...pincodeForm.getInputProps("pincode")}
                      />
                      <TextInput
                        label="City"
                        placeholder="New Delhi"
                        {...pincodeForm.getInputProps("city")}
                      />
                    </Group>

                    <Group grow>
                      <TextInput
                        label="State"
                        placeholder="Delhi"
                        {...pincodeForm.getInputProps("state")}
                      />
                      <TextInput
                        label="District"
                        placeholder="Central Delhi"
                        {...pincodeForm.getInputProps("district")}
                      />
                    </Group>

                    <Group grow>
                      <TextInput
                        label="Location Name"
                        placeholder="Connaught Place"
                        {...pincodeForm.getInputProps("location_name")}
                      />
                      <TextInput
                        label="Village"
                        placeholder="Village name"
                        {...pincodeForm.getInputProps("village")}
                      />
                    </Group>

                    <TextInput
                      label="Others"
                      placeholder="Additional information"
                      {...pincodeForm.getInputProps("others")}
                    />

                    <Switch
                      label="Active Pincode"
                      description="Enable or disable this pincode for delivery"
                      {...pincodeForm.getInputProps("is_active", { type: "checkbox" })}
                      color="green"
                    />

                    <Group justify="flex-end" spacing="sm">
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={handleCancelPincode}
                      >
                        Cancel
                      </Button>
                      <Button size="xs" onClick={handleAddPincode}>
                        {editingPincodeIndex !== null ? "Update" : "Add"} Pincode
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              </Collapse>

              {/* Pincode List */}
              {pincodes.length > 0 ? (
                <Paper withBorder>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Pincode</Table.Th>
                        <Table.Th>Location</Table.Th>
                        <Table.Th>Village</Table.Th>
                        <Table.Th>District</Table.Th>
                        <Table.Th>City</Table.Th>
                        <Table.Th>State</Table.Th>
                        <Table.Th>Others</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pincodes.map((pincode, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Text weight={500}>{pincode.pincode}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{pincode.location_name || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{pincode.village || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{pincode.district || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{pincode.city || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{pincode.state || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{pincode.others || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Switch
                              checked={pincode.is_active !== false}
                              onChange={() => handleTogglePincodeActive(index)}
                              color="green"
                              size="sm"
                              label={pincode.is_active !== false ? "Active" : "Inactive"}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="blue"
                                onClick={() => handleEditPincode(index)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="red"
                                onClick={() => handleDeletePincode(index)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              ) : (
                <Alert icon={<IconInfoCircle />} color="gray">
                  <Text size="sm">
                    No pincodes added yet. Click &quot;Add Pincode&quot; to add delivery areas.
                  </Text>
                </Alert>
              )}
            </>
          )}

          <Divider />

          {/* Active Toggle */}
          <div>
            <Switch
              label="Active Zone"
              description="Inactive zones won't be available for product assignment"
              disabled={isEdit && zone?.name === "nationwide"}
              {...form.getInputProps("is_active", { type: "checkbox" })}
            />
          </div>

          {/* Action Buttons */}
          <Group justify="flex-end" spacing="sm">
            <Button variant="subtle" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Update Zone" : "Create Zone"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

ZoneForm.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  zone: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    display_name: PropTypes.string,
    description: PropTypes.string,
    is_nationwide: PropTypes.bool,
    is_active: PropTypes.bool,
    pincodes: PropTypes.arrayOf(
      PropTypes.shape({
        pincode: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
        district: PropTypes.string,
        location_name: PropTypes.string,
        village: PropTypes.string,
        others: PropTypes.string,
      })
    ),
  }),
  onSuccess: PropTypes.func.isRequired,
};

export default ZoneForm;
