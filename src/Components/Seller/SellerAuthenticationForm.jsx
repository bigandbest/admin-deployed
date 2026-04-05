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
  Tabs,
  PinInput,
} from "@mantine/core";
import { FaStore, FaPhone, FaEnvelope } from "react-icons/fa";

export default function SellerAuthenticationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");

  const [error, setError] = useState("");
  const { login, logout, loginWithPhone } = useSellerAuth();

  // Email login handler
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

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

  // Send OTP handler
  const handleSendOTP = async () => {
    if (!phone.trim() || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setError("");
    setOtpLoading(true);

    try {
      const result = await loginWithPhone.sendOTP(phone);
      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        setOtpSent(true);
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOTP = async () => {
    if (!verificationId || !otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await loginWithPhone.verifyOTP(verificationId, otp);
      if (result.success) {
        navigate('/seller/dashboard');
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message || "OTP verification failed");
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

          <Tabs value={activeTab} onTabChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="email" icon={<FaEnvelope size={14} />}>
                Email
              </Tabs.Tab>
              <Tabs.Tab value="phone" icon={<FaPhone size={14} />}>
                Phone OTP
              </Tabs.Tab>
            </Tabs.List>

            {/* Email Tab */}
            <Tabs.Panel value="email" pt="xl">
              <form onSubmit={handleEmailSubmit}>
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
                    disabled={loading}
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
                    disabled={loading}
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
            </Tabs.Panel>

            {/* Phone OTP Tab */}
            <Tabs.Panel value="phone" pt="xl">
              <div id="recaptcha-container" style={{ display: 'none' }}></div>
              <Stack>
                <div>
                  <Text size="sm" weight={500} mb={8}>
                    Phone Number *
                  </Text>
                  <TextInput
                    placeholder="10-digit phone number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.currentTarget.value)}
                    disabled={otpSent || loading}
                    maxLength={10}
                    radius="md"
                    size="md"
                  />
                </div>

                {!otpSent && (
                  <Button
                    fullWidth
                    onClick={handleSendOTP}
                    loading={otpLoading}
                    disabled={!phone || phone.length !== 10}
                    radius="md"
                    size="md"
                    className="bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    Send OTP
                  </Button>
                )}

                {otpSent && (
                  <>
                    <Text size="sm" c="teal" weight={500}>
                      ✓ OTP sent to +91{phone}
                    </Text>

                    <div>
                      <Text size="sm" weight={500} mb={8}>
                        Enter OTP *
                      </Text>
                      <PinInput
                        length={6}
                        type="number"
                        value={otp}
                        onChange={setOtp}
                        placeholder="0"
                        disabled={loading}
                        size="lg"
                      />
                    </div>

                    <Button
                      fullWidth
                      onClick={handleVerifyOTP}
                      loading={loading}
                      disabled={otp.length !== 6}
                      radius="md"
                      size="md"
                      className="bg-blue-500 hover:bg-blue-600 transition-colors"
                    >
                      Verify & Sign in
                    </Button>

                    <Button
                      fullWidth
                      variant="default"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                      radius="md"
                      size="md"
                    >
                      ← Back to phone
                    </Button>
                  </>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
    </Box>
  );
}
