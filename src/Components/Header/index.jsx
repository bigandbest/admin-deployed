import { useState } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

import {
  Menu,
  UnstyledButton,
  Group,
  Avatar,
  Text,
  Divider,
} from "@mantine/core";
import { spotlight } from "@mantine/spotlight";
import {
  Search,
  Menu as MenuIcon,
  Wallet,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import PropTypes from "prop-types";

const iconProps = { className: "size-4", strokeWidth: 1.5 };

const Header = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const [walletBalance] = useState(12500);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const name =
    currentUser?.user_metadata?.name ||
    currentUser?.user_metadata?.displayName ||
    currentUser?.email ||
    "Admin";
  const rupees = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <header className="z-10 flex h-16 w-full items-center justify-between px-6 mantine-header">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Menu"
          className="desk-chip flex size-9 items-center justify-center rounded-lg transition-colors duration-150 ease-desk hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MenuIcon {...iconProps} />
        </button>

        <button
          type="button"
          onClick={() => spotlight.open()}
          className="desk-chip hidden h-9 items-center gap-2 rounded-lg px-3 text-sm text-neutral-500 transition-colors duration-150 ease-desk hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <Search {...iconProps} />
          <span>Search</span>
          <kbd className="ml-4 rounded-sm border border-black/10 px-1 font-mono text-xs text-neutral-500">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => spotlight.open()}
          aria-label="Search"
          className="desk-chip flex size-9 items-center justify-center rounded-lg sm:hidden"
        >
          <Search {...iconProps} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Menu width={280} position="bottom-end" shadow="sm">
          <Menu.Target>
            <UnstyledButton className="desk-chip flex h-9 items-center gap-2 rounded-lg px-3 transition-colors duration-150 ease-desk">
              <Wallet {...iconProps} />
              <span className="hidden text-xs text-neutral-500 sm:block">Wallet</span>
              <span className="font-mono text-sm tabular-nums">{rupees(walletBalance)}</span>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown className="p-0">
            <div className="border-b border-black/8 px-4 py-4">
              <Text size="xs" c="dimmed">Balance</Text>
              <p className="mt-1 font-mono text-[28px] font-medium leading-none tabular-nums">
                {rupees(walletBalance)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              <button type="button" className="desk-chip h-9 rounded-lg text-sm">
                Add money
              </button>
              <button type="button" className="desk-chip h-9 rounded-lg text-sm">
                Withdraw
              </button>
            </div>

            <Divider />

            <div className="p-3">
              <Text size="xs" c="dimmed" className="mb-2">Recent transactions</Text>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <Text size="sm">Payment received</Text>
                    <Text size="xs" c="dimmed" className="font-mono">Order 48291</Text>
                  </div>
                  <Text size="sm" className="font-mono tabular-nums text-[#16a34a]">+₹2,500</Text>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <Text size="sm">Refund issued</Text>
                    <Text size="xs" c="dimmed" className="font-mono">Order 47106</Text>
                  </div>
                  <Text size="sm" className="font-mono tabular-nums text-[#dc2626]">−₹1,200</Text>
                </div>
              </div>
            </div>

            <Divider />

            <Menu.Item className="text-center text-sm">
              View all transactions
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <button
          type="button"
          onClick={toggleColorScheme}
          className="desk-chip hidden h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150 ease-desk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
        >
          {colorScheme === "dark" ? <Sun {...iconProps} /> : <Moon {...iconProps} />}
          <span>{colorScheme === "dark" ? "Light" : "Dark"}</span>
        </button>

        <button
          type="button"
          onClick={toggleColorScheme}
          aria-label={colorScheme === "dark" ? "Light" : "Dark"}
          className="desk-chip flex size-9 items-center justify-center rounded-lg md:hidden"
        >
          {colorScheme === "dark" ? <Sun {...iconProps} /> : <Moon {...iconProps} />}
        </button>

        <Menu width={240} position="bottom-end" shadow="sm">
          <Menu.Target>
            <UnstyledButton className="flex h-9 items-center rounded-lg px-1 transition-colors duration-150 ease-desk hover:bg-black/5">
              <Group gap={8}>
                <Avatar
                  src={currentUser?.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg"}
                  radius="md"
                  size={32}
                />
                <div className="hidden lg:block">
                  <Text size="sm">{name}</Text>
                  <Text c="dimmed" size="xs">Administrator</Text>
                </div>
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <div className="border-b p-2 lg:hidden">
              <Text size="sm">{name}</Text>
              <Text c="dimmed" size="xs">Administrator</Text>
            </div>
            <Menu.Item leftSection={<User {...iconProps} />} onClick={() => navigate("/profile")}>Profile</Menu.Item>
            <Menu.Item leftSection={<Settings {...iconProps} />} onClick={() => navigate("/settings")}>Settings</Menu.Item>
            <Divider />
            <Menu.Item color="red" leftSection={<LogOut {...iconProps} />} onClick={handleLogout}>
              Log out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </header>
  );
};

Header.propTypes = {
  toggleSidebar: PropTypes.func,
};

export default Header;
