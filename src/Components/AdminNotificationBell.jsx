import { useState, useEffect } from "react";
import { ActionIcon, Group, Indicator } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { getAllNotifications } from "../utils/backendApi";

const AdminNotificationBell = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const notifications = await getAllNotifications();
      const unread = (notifications || []).filter((n) => !n.is_read);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error("Error fetching admin notification count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Group>
      <Indicator
        disabled={unreadCount === 0}
        label={unreadCount > 99 ? "99+" : unreadCount}
        color="red"
        size={16}
      >
        <ActionIcon variant="light" size="lg" onClick={onClick}>
          <IconBell size={20} />
        </ActionIcon>
      </Indicator>
    </Group>
  );
};

export default AdminNotificationBell;
