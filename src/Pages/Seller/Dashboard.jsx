import React, { useState, useEffect } from "react";
import { Card, Grid, Title, Text, Group, Stack, Badge, Box, Loader, Center } from "@mantine/core";
import { FaBox, FaShoppingCart, FaWallet, FaHandshake, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { getSellerDashboard } from "../../utils/sellerApi";

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getSellerDashboard();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="80vh">
        <Loader size="xl" />
      </Center>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: FaBox,
      color: "blue",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Active Orders",
      value: stats?.activeOrders || 0,
      icon: FaShoppingCart,
      color: "green",
      change: "+8%",
      trend: "up"
    },
    {
      title: "Total Earnings",
      value: `₹${stats?.totalEarnings?.toLocaleString() || 0}`,
      icon: FaWallet,
      color: "violet",
      change: "+23%",
      trend: "up"
    },
    {
      title: "Pending Negotiations",
      value: stats?.pendingNegotiations || 0,
      icon: FaHandshake,
      color: "orange",
      change: "-5%",
      trend: "down"
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Title order={2} className="mb-2">Dashboard</Title>
        <Text c="dimmed">Welcome back! Here's your business overview</Text>
      </div>

      {/* Stats Grid */}
      <Grid gutter="md" className="mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? FaArrowUp : FaArrowDown;
          
          return (
            <Grid.Col key={stat.title} span={{ base: 12, xs: 6, md: 3 }}>
              <Card 
                className="mantine-card h-full hover:shadow-md transition-shadow cursor-pointer"
                padding="lg"
                radius="md"
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Box className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-lg`}>
                      <Icon size={24} className={`text-${stat.color}-500`} />
                    </Box>
                    <Badge 
                      variant="light" 
                      color={stat.trend === "up" ? "green" : "red"}
                      leftSection={<TrendIcon size={10} />}
                      size="sm"
                    >
                      {stat.change}
                    </Badge>
                  </Group>
                  <div>
                    <Text size="xl" fw={700}>{stat.value}</Text>
                    <Text size="sm" c="dimmed">{stat.title}</Text>
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>

      {/* Quick Stats */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card className="mantine-card" padding="lg" radius="md">
            <Title order={4} className="mb-4">Recent Activity</Title>
            <Stack gap="md">
              {[
                { text: "New order received for Red T-Shirt", time: "5 minutes ago", color: "green" },
                { text: "Admin counter-offered ₹350 for Blue Jeans", time: "2 hours ago", color: "orange" },
                { text: "Product approved: Cotton Fabric", time: "1 day ago", color: "blue" },
                { text: "Payment received: ₹15,000", time: "2 days ago", color: "violet" },
              ].map((activity, index) => (
                <Group key={index} justify="space-between" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Box className={`w-2 h-2 bg-${activity.color}-500 rounded-full`} />
                    <Text size="sm">{activity.text}</Text>
                  </div>
                  <Text size="xs" c="dimmed">{activity.time}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card className="mantine-card" padding="lg" radius="md">
            <Title order={4} className="mb-4">Quick Stats</Title>
            <Stack gap="md">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Text size="sm" fw={500}>Approved Products</Text>
                <Badge color="blue" variant="filled" size="lg">{stats?.approvedProducts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Text size="sm" fw={500}>Pending Approval</Text>
                <Badge color="orange" variant="filled" size="lg">{stats?.pendingProducts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Text size="sm" fw={500}>Completed Orders</Text>
                <Badge color="green" variant="filled" size="lg">{stats?.completedOrders || 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <Text size="sm" fw={500}>This Month Earnings</Text>
                <Text size="sm" fw={700}>₹{stats?.monthlyEarnings?.toLocaleString() || 0}</Text>
              </div>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}
