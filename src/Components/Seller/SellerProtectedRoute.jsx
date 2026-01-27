import React from "react";
import { Navigate } from "react-router-dom";
import { useSellerAuth } from "../../contexts/SellerAuthContext";
import { Box, Loader, Center } from "@mantine/core";

export default function SellerProtectedRoute({ children }) {
  const { currentUser, isSeller, loading } = useSellerAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Box>
          <Loader size="xl" />
        </Box>
      </Center>
    );
  }

  if (!currentUser || !isSeller) {
    return <Navigate to="/seller/login" replace />;
  }

  return children;
}
