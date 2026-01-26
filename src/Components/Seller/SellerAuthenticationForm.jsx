import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Box,
  Stack,
} from "@mantine/core";
import { FaStore } from "react-icons/fa";

export default function SellerAuthenticationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, logout } = useSellerAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const loginResult = await login(email, password);
      if (loginResult.success) {
        if (loginResult.isSeller) {
          navigate('/seller/dashboard');
        } else {
          setError("You do not have seller privileges");
          await logout();
        }
      } else {
        setError(loginResult.error || "Invalid credentials");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-body)" }}>
      <Container size="xs">
        <Paper radius="lg" p="xl" withBorder className="mantine-card">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-full">
              <FaStore size={30} color="#fff" />
            </div>
          </div>
          <Title order={2} align="center" mt="sm" mb={10}>
            Seller Portal
          </Title>
          <Text size="sm" c="dimmed" align="center" mb={30}>
            Sign in to manage your products and orders
          </Text>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-center text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                required
                label="Email"
                placeholder="seller@example.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                error={error && !email ? "Email is required" : null}
                radius="md"
                size="md"
              />

              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                error={error && !password ? "Password is required" : null}
                radius="md"
                size="md"
              />

              <Button
                fullWidth
                mt="xl"
                size="md"
                type="submit"
                loading={loading}
                radius="md"
                className="bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Sign in
              </Button>

              <Text size="sm" c="dimmed" align="center" mt="md">
                Need help? Contact support
              </Text>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
