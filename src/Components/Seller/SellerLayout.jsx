import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppShell } from "@mantine/core";
import SellerSidebar from "./SellerSidebar";
import SellerHeader from "./SellerHeader";

export default function SellerLayout() {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <SellerHeader opened={opened} setOpened={setOpened} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <SellerSidebar setOpened={setOpened} />
      </AppShell.Navbar>

      <AppShell.Main className="mantine-bg min-h-screen">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
