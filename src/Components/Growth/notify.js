import { notifications } from "@mantine/notifications";

// Toasts for completed actions (mounted once in App.jsx via Mantine <Notifications />).
export const notifySuccess = (message) => notifications.show({ message, color: "green", autoClose: 3000 });
export const notifyError = (message) =>
  notifications.show({ message: message || "Something went wrong. Please try again.", color: "red", autoClose: 5000 });
