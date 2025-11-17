// src/utils/adminWalletApi.js
const API_BASE = "https://ecommerce-8342.onrender.com/api/admin";

// Helper function to make authenticated API requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem("admin_token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Get all wallets (admin)
export const getAllWallets = async (
  page = 1,
  limit = 20,
  search = "",
  status = ""
) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
    });

    return await makeAuthenticatedRequest(`${API_BASE}/wallets?${queryParams}`);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    throw error;
  }
};

// Get specific user wallet details (admin)
export const getUserWalletDetails = async (userId) => {
  try {
    return await makeAuthenticatedRequest(`${API_BASE}/wallets/${userId}`);
  } catch (error) {
    console.error("Error fetching user wallet details:", error);
    throw error;
  }
};

// Manual credit to wallet (admin)
export const manualCreditWallet = async (
  userId,
  amount,
  reason,
  notifyUser = true
) => {
  try {
    return await makeAuthenticatedRequest(
      `${API_BASE}/wallets/${userId}/credit`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          reason,
          notify_user: notifyUser,
        }),
      }
    );
  } catch (error) {
    console.error("Error crediting wallet:", error);
    throw error;
  }
};

// Manual debit from wallet (admin)
export const manualDebitWallet = async (
  userId,
  amount,
  reason,
  notifyUser = true
) => {
  try {
    return await makeAuthenticatedRequest(
      `${API_BASE}/wallets/${userId}/debit`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          reason,
          notify_user: notifyUser,
        }),
      }
    );
  } catch (error) {
    console.error("Error debiting wallet:", error);
    throw error;
  }
};

// Freeze wallet (admin)
export const freezeWallet = async (userId, reason, notifyUser = true) => {
  try {
    return await makeAuthenticatedRequest(
      `${API_BASE}/wallets/${userId}/freeze`,
      {
        method: "POST",
        body: JSON.stringify({
          reason,
          notify_user: notifyUser,
        }),
      }
    );
  } catch (error) {
    console.error("Error freezing wallet:", error);
    throw error;
  }
};

// Unfreeze wallet (admin)
export const unfreezeWallet = async (userId, reason, notifyUser = true) => {
  try {
    return await makeAuthenticatedRequest(
      `${API_BASE}/wallets/${userId}/unfreeze`,
      {
        method: "POST",
        body: JSON.stringify({
          reason,
          notify_user: notifyUser,
        }),
      }
    );
  } catch (error) {
    console.error("Error unfreezing wallet:", error);
    throw error;
  }
};

// Get wallet transactions (admin)
export const getWalletTransactionsAdmin = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      transactionType,
      startDate,
      endDate,
    } = filters;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(userId && { user_id: userId }),
      ...(transactionType && { transaction_type: transactionType }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });

    return await makeAuthenticatedRequest(
      `${API_BASE}/wallets/transactions?${queryParams}`
    );
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    throw error;
  }
};

// Get wallet audit logs (admin)
export const getWalletAuditLogs = async (filters = {}) => {
  try {
    const { page = 1, limit = 50, walletId, adminId, action } = filters;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(walletId && { wallet_id: walletId }),
      ...(adminId && { admin_id: adminId }),
      ...(action && { action }),
    });

    return await makeAuthenticatedRequest(
      `${API_BASE}/wallets/audit-logs?${queryParams}`
    );
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

// Format currency for admin display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format transaction type for admin display
export const formatTransactionType = (type) => {
  const typeMap = {
    TOPUP: "Money Added",
    SPEND: "Payment",
    REFUND: "Refund",
    ADMIN_CREDIT: "Manual Credit",
    ADMIN_DEBIT: "Manual Debit",
    REVERSAL: "Reversal",
  };

  return typeMap[type] || type;
};

// Get status color for admin UI
export const getStatusColor = (status) => {
  const colorMap = {
    active: "text-green-600 bg-green-100",
    frozen: "text-red-600 bg-red-100",
    pending: "text-yellow-600 bg-yellow-100",
  };

  return colorMap[status] || "text-gray-600 bg-gray-100";
};

// Export transaction data to CSV
export const exportTransactionData = (
  transactions,
  filename = "wallet_transactions"
) => {
  try {
    const headers = [
      "Transaction ID",
      "User ID",
      "Type",
      "Amount",
      "Balance Before",
      "Balance After",
      "Description",
      "Status",
      "Created At",
    ];

    const csvData = transactions.map((transaction) => [
      transaction.id,
      transaction.user_id,
      transaction.transaction_type,
      transaction.amount,
      transaction.balance_before,
      transaction.balance_after,
      transaction.description || "",
      transaction.status,
      new Date(transaction.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting transaction data:", error);
    throw new Error("Failed to export transaction data");
  }
};
