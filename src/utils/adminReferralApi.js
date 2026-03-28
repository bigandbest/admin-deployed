// src/utils/adminReferralApi.js
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/referral`;

const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// Dashboard & Analytics
export const getDashboard = () => makeRequest(`${API_BASE}/dashboard`);
export const getAnalytics = (period = 30) => makeRequest(`${API_BASE}/analytics?period=${period}`);

// Config
export const getConfig = () => makeRequest(`${API_BASE}/config`);
export const updateConfig = (data) => makeRequest(`${API_BASE}/config`, { method: "PUT", body: JSON.stringify(data) });

// Users
export const listUsers = (page = 1, limit = 20, search = "", status = "") => {
  const params = new URLSearchParams({ page, limit, ...(search && { search }), ...(status && { status }) });
  return makeRequest(`${API_BASE}/users?${params}`);
};
export const getUserDetail = (id) => makeRequest(`${API_BASE}/users/${id}`);
export const blockUser = (id, reason) => makeRequest(`${API_BASE}/users/${id}/block`, { method: "PUT", body: JSON.stringify({ reason }) });
export const unblockUser = (id) => makeRequest(`${API_BASE}/users/${id}/unblock`, { method: "PUT" });
export const deactivateCode = (id) => makeRequest(`${API_BASE}/users/${id}/deactivate-code`, { method: "PUT" });
export const reactivateCode = (id) => makeRequest(`${API_BASE}/users/${id}/reactivate-code`, { method: "PUT" });

// Transactions
export const listTransactions = (page = 1, limit = 20, status = "", search = "") => {
  const params = new URLSearchParams({ page, limit, ...(status && { status }), ...(search && { search }) });
  return makeRequest(`${API_BASE}/transactions?${params}`);
};
export const getTransactionDetail = (id) => makeRequest(`${API_BASE}/transactions/${id}`);

// Rewards
export const listRewards = (page = 1, limit = 20, status = "", userId = "") => {
  const params = new URLSearchParams({ page, limit, ...(status && { status }), ...(userId && { user_id: userId }) });
  return makeRequest(`${API_BASE}/rewards?${params}`);
};
export const manualCreditReward = (data) => makeRequest(`${API_BASE}/rewards/credit`, { method: "POST", body: JSON.stringify(data) });
export const extendRewardExpiry = (id, days, reason) => makeRequest(`${API_BASE}/rewards/${id}/extend`, { method: "PUT", body: JSON.stringify({ days, reason }) });
export const cancelReward = (id, reason) => makeRequest(`${API_BASE}/rewards/${id}/cancel`, { method: "PUT", body: JSON.stringify({ reason }) });

// Withdrawals
export const listWithdrawals = (page = 1, limit = 20, status = "") => {
  const params = new URLSearchParams({ page, limit, ...(status && { status }) });
  return makeRequest(`${API_BASE}/withdrawals?${params}`);
};
export const approveWithdrawal = (id, notes = "") => makeRequest(`${API_BASE}/withdrawals/${id}/approve`, { method: "PUT", body: JSON.stringify({ notes }) });
export const rejectWithdrawal = (id, reason) => makeRequest(`${API_BASE}/withdrawals/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) });
export const processWithdrawal = (id, data) => makeRequest(`${API_BASE}/withdrawals/${id}/process`, { method: "PUT", body: JSON.stringify(data) });

// Fraud Logs
export const listFraudLogs = (page = 1, limit = 20, status = "", severity = "") => {
  const params = new URLSearchParams({ page, limit, ...(status && { status }), ...(severity && { severity }) });
  return makeRequest(`${API_BASE}/fraud-logs?${params}`);
};
export const reviewFraudLog = (id, data) => makeRequest(`${API_BASE}/fraud-logs/${id}/review`, { method: "PUT", body: JSON.stringify(data) });

// Activity Logs
export const listActivityLogs = (page = 1, limit = 20) => {
  const params = new URLSearchParams({ page, limit });
  return makeRequest(`${API_BASE}/activity-logs?${params}`);
};

// Reports
export const exportReport = (type, from, to) => {
  const params = new URLSearchParams({ type, ...(from && { from }), ...(to && { to }) });
  return makeRequest(`${API_BASE}/reports/export?${params}`);
};

// Campaigns
export const listCampaigns = (page = 1, limit = 20) => {
  const params = new URLSearchParams({ page, limit });
  return makeRequest(`${API_BASE}/campaigns?${params}`);
};
export const createCampaign = (data) => makeRequest(`${API_BASE}/campaigns`, { method: "POST", body: JSON.stringify(data) });
export const updateCampaign = (id, data) => makeRequest(`${API_BASE}/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCampaign = (id) => makeRequest(`${API_BASE}/campaigns/${id}`, { method: "DELETE" });

// Helpers
export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export const getStatusBadge = (status) => {
  const map = {
    COMPLETED: "text-green-700 bg-green-100",
    ACTIVE: "text-green-700 bg-green-100",
    PENDING: "text-yellow-700 bg-yellow-100",
    APPROVED: "text-blue-700 bg-blue-100",
    PROCESSING: "text-blue-700 bg-blue-100",
    FAILED: "text-red-700 bg-red-100",
    REJECTED: "text-red-700 bg-red-100",
    EXPIRED: "text-gray-600 bg-gray-100",
    CANCELLED: "text-gray-600 bg-gray-100",
    BLOCKED: "text-red-700 bg-red-100",
    SIGNUP_COMPLETED: "text-indigo-700 bg-indigo-100",
    ORDER_PLACED: "text-blue-700 bg-blue-100",
    RETURN_WINDOW_ACTIVE: "text-orange-700 bg-orange-100",
    HIGH: "text-red-700 bg-red-100",
    MEDIUM: "text-orange-700 bg-orange-100",
    LOW: "text-yellow-700 bg-yellow-100",
    CRITICAL: "text-red-900 bg-red-200",
  };
  return map[status] || "text-gray-600 bg-gray-100";
};
