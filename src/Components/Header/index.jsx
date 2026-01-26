import React, { useState } from "react";
import { useMantineColorScheme } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Link } from "react-router-dom";
import {

  ActionIcon,
  useMantineTheme,
  Menu,
  UnstyledButton,
  Group,
  Avatar,
  Text,
  Divider,
} from "@mantine/core";
import { spotlight } from "@mantine/spotlight";
import { motion } from "framer-motion";
import {
  FaCog,
  FaSearch,
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaMoon,
  FaSun,
  FaWallet,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { notifications } from "@mantine/notifications";

const userNotifications = [
  {
    id: 1,
    title: "New order received",
    message: "Order #12345 has been placed",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment successful",
    message: "Payment for order #12340 was successful",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 3,
    title: "New user registered",
    message: "Arjun Sharma has registered",
    time: "Yesterday",
    read: true,
  },
  {
    id: 4,
    title: "Inventory alert",
    message: "Product X is running low on stock",
    time: "2 days ago",
    read: true,
  },
];

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { currentUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const [walletBalance] = useState(12500.50); // Mock wallet balance


  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // const unreadNotifications = userNotifications.filter(n => !n.read).length;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="z-10 w-full py-3 px-3 sm:px-4 md:px-6 mantine-header flex items-center justify-between shadow-sm"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <ActionIcon
          size="lg"
          radius="md"
          variant="light"
          onClick={toggleSidebar}
          className="flex-shrink-0"
        >
          <FaBars size={18} />
        </ActionIcon>

        <div
          className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => spotlight.open()}
        >
          <FaSearch size={14} className="text-gray-500" />
          <Text size="sm" color="dimmed">
            Search (Ctrl+K)
          </Text>
        </div>

        {/* Mobile Search Icon */}
        <ActionIcon
          size="lg"
          radius="md"
          variant="light"
          onClick={() => spotlight.open()}
          className="sm:hidden flex-shrink-0"
        >
          <FaSearch size={16} />
        </ActionIcon>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Wallet Section - Premium Mobile Design */}
        <Menu
          width={280}
          position="bottom-end"
          transitionProps={{ transition: 'pop-top-right' }}
          shadow="xl"
        >
          <Menu.Target>
            <UnstyledButton className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95">
              <FaWallet size={16} className="sm:w-[18px] sm:h-[18px]" />
              <div className="hidden sm:block">
                <Text size="xs" className="opacity-90 leading-none">Wallet</Text>
                <Text size="sm" weight={700} className="leading-tight">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </div>
              <div className="sm:hidden">
                <Text size="xs" weight={700}>₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </div>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown className="p-0">
            {/* Wallet Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Text size="sm" className="opacity-90">Total Balance</Text>
                <FaWallet size={20} className="opacity-75" />
              </div>
              <Text size="xl" weight={700} className="mb-1">
                ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text size="xs" className="opacity-75">Available for transactions</Text>
            </div>

            {/* Quick Actions */}
            <div className="p-3 grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <FaPlus size={16} className="text-white" />
                </div>
                <Text size="xs" weight={600} className="text-green-700">Add Money</Text>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <FaArrowUp size={16} className="text-white" />
                </div>
                <Text size="xs" weight={600} className="text-blue-700">Withdraw</Text>
              </button>
            </div>

            <Divider />

            {/* Recent Transactions */}
            <div className="p-3">
              <Text size="sm" weight={600} className="mb-3">Recent Transactions</Text>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaArrowDown size={12} className="text-green-600" />
                    </div>
                    <div>
                      <Text size="sm" weight={500}>Payment Received</Text>
                      <Text size="xs" color="dimmed">Order #12345</Text>
                    </div>
                  </div>
                  <Text size="sm" weight={600} className="text-green-600">+₹2,500</Text>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <FaArrowUp size={12} className="text-red-600" />
                    </div>
                    <div>
                      <Text size="sm" weight={500}>Refund Issued</Text>
                      <Text size="xs" color="dimmed">Order #12340</Text>
                    </div>
                  </div>
                  <Text size="sm" weight={600} className="text-red-600">-₹1,200</Text>
                </div>
              </div>
            </div>

            <Divider />

            <Menu.Item className="text-center text-blue-600 font-semibold hover:bg-blue-50">
              View All Transactions
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {/* Theme Toggle - Responsive */}
        <div
          className="hidden md:flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={toggleColorScheme}
          title="Toggle color scheme"
        >
          <ActionIcon
            variant="light"
            radius="xl"
            size="lg"
            color={colorScheme === "dark" ? "yellow" : "blue"}
          >
            {colorScheme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
          </ActionIcon>
          <Text size="sm" className="ml-2">
            {colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
          </Text>
        </div>

        {/* Mobile Theme Toggle */}
        <ActionIcon
          variant="light"
          radius="xl"
          size="lg"
          color={colorScheme === "dark" ? "yellow" : "blue"}
          onClick={toggleColorScheme}
          className="md:hidden flex-shrink-0"
          title="Toggle color scheme"
        >
          {colorScheme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
        </ActionIcon>

        {/* User Menu */}
        <Menu
          width={260}
          position="bottom-end"
          transitionProps={{ transition: 'pop-top-right' }}
          shadow="md"
        >
          <Menu.Target>
            <UnstyledButton className="flex items-center hover:opacity-80 transition-opacity">
              <Group spacing={7}>
                <Avatar
                  src={currentUser?.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg"}
                  radius="xl"
                  size={36}
                  className="border-2 border-blue-500"
                />
                <div className="hidden lg:block">
                  <Text size="sm" weight={500}>
                    {currentUser?.user_metadata?.name || currentUser?.user_metadata?.displayName || currentUser?.email || 'Admin'}
                  </Text>
                  <Text color="dimmed" size="xs">
                    Administrator
                  </Text>
                </div>
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <div className="p-2 lg:hidden border-b">
              <Text size="sm" weight={500}>
                {currentUser?.user_metadata?.name || currentUser?.user_metadata?.displayName || currentUser?.email || 'Admin'}
              </Text>
              <Text color="dimmed" size="xs">
                Administrator
              </Text>
            </div>
            <Menu.Item icon={<FaUser size={14} />} onClick={() => navigate('/profile')}>Profile</Menu.Item>
            {/* <Menu.Item icon={<FaEnvelope size={14} />} onClick={() => navigate('/messages')}>Messages</Menu.Item> */}
            <Menu.Item icon={<FaCog size={14} />} onClick={() => navigate('/settings')}>Settings</Menu.Item>
            <Divider />
            <Menu.Item
              color="red"
              icon={<FaSignOutAlt size={14} />}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </motion.header>
  );
};

export default Header;
