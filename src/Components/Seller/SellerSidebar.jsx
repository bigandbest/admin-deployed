import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Stack, NavLink, Box, Text, Divider } from "@mantine/core";
import { 
  FaHome, 
  FaBox, 
  FaShoppingCart, 
  FaWallet,
  FaHandshake,
  FaBell,
  FaSignOutAlt
} from "react-icons/fa";
import { useSellerAuth } from "../../contexts/SellerAuthContext";

const menuItems = [
  { path: "/seller/dashboard", label: "Dashboard", icon: FaHome },
  { path: "/seller/products", label: "My Products", icon: FaBox },
  { path: "/seller/add-product", label: "Add Product", icon: FaBox },
  { path: "/seller/orders", label: "Orders", icon: FaShoppingCart },
  { path: "/seller/negotiations", label: "Negotiations", icon: FaHandshake },
  { path: "/seller/earnings", label: "Earnings", icon: FaWallet },
  { path: "/seller/notifications", label: "Notifications", icon: FaBell },
];

export default function SellerSidebar({ setOpened }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useSellerAuth();

  const handleNavigation = (path) => {
    navigate(path);
    setOpened?.(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/seller/login");
  };

  return (
    <Box className="flex flex-col h-full">
      {/* Logo and User Info */}
      <Box className="mb-4">
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="bg-blue-500 p-2 rounded-lg">
            <FaBox size={24} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <Text size="sm" fw={600} className="truncate">
              {currentUser?.name || "Seller"}
            </Text>
            <Text size="xs" c="dimmed" className="truncate">
              {currentUser?.role || "Seller"}
            </Text>
          </div>
        </div>
      </Box>

      <Divider mb="md" />

      {/* Navigation Menu */}
      <Stack gap="xs" className="flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={<Icon size={18} />}
              active={isActive}
              onClick={() => handleNavigation(item.path)}
              className={`rounded-lg transition-all ${
                isActive 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              styles={(theme) => ({
                root: {
                  borderRadius: theme.radius.md,
                  fontWeight: isActive ? 600 : 500,
                },
              })}
            />
          );
        })}
      </Stack>

      <Divider my="md" />

      {/* Logout Button */}
      <NavLink
        label="Logout"
        leftSection={<FaSignOutAlt size={18} />}
        onClick={handleLogout}
        className="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
        styles={(theme) => ({
          root: {
            borderRadius: theme.radius.md,
          },
        })}
      />
    </Box>
  );
}
