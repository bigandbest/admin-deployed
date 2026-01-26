import React from "react";
import { Card, Title, Text, Center, Stack } from "@mantine/core";
import { FaBell } from "react-icons/fa";

export default function Notifications() {
  return (
    <div className="p-4 sm:p-6">
      <Card className="mantine-card" padding="lg" radius="md">
        <div className="mb-6">
          <Title order={2} className="mb-1">Notifications</Title>
          <Text c="dimmed" size="sm">Stay updated with important alerts</Text>
        </div>

        <Center h={300}>
          <Stack align="center">
            <FaBell size={48} className="text-gray-300" />
            <Text c="dimmed" size="lg">No notifications yet</Text>
            <Text c="dimmed" size="sm">You'll be notified about important updates</Text>
          </Stack>
        </Center>
      </Card>
    </div>
  );
}
