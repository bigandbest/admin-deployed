import React from "react";
import { Group, Burger, Text, ActionIcon, Indicator, Box } from "@mantine/core";
import { FaBell, FaStore } from "react-icons/fa";
import ColorModeIconDropdown from "../../shared-theme/ColorModeIconDropdown";

export default function SellerHeader({ opened, setOpened }) {
  return (
    <Group h="100%" px="md" justify="space-between" className="border-b border-gray-200 dark:border-gray-800">
      {/* Left: Logo and Burger */}
      <Group>
        <Burger opened={opened} onClick={() => setOpened(!opened)} hiddenFrom="sm" size="sm" />
        <Group gap="xs">
          <div className="bg-blue-500 p-2 rounded-lg">
            <FaStore size={20} color="#fff" />
          </div>
          <Box>
            <Text size="lg" fw={700}>Seller Portal</Text>
          </Box>
        </Group>
      </Group>

      {/* Right: Notifications and Theme Toggle */}
      <Group gap="md">
        <Indicator inline processing color="red" size={8}>
          <ActionIcon variant="subtle" size="lg" radius="md">
            <FaBell size={18} />
          </ActionIcon>
        </Indicator>
        <ColorModeIconDropdown />
      </Group>
    </Group>
  );
}
