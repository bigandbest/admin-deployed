const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/affiliate`;

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

// Dashboard
export const getDashboard = () => makeRequest(`${API_BASE}/dashboard`);

// Config
export const getConfig = () => makeRequest(`${API_BASE}/config`);
export const updateConfig = (data) =>
  makeRequest(`${API_BASE}/config`, { method: "PUT", body: JSON.stringify(data) });

// Commission Rates
export const getCommissionRates = () => makeRequest(`${API_BASE}/commission-rates`);
export const upsertCommissionRate = (data) =>
  makeRequest(`${API_BASE}/commission-rates`, { method: "POST", body: JSON.stringify(data) });
export const deleteCommissionRate = (id) =>
  makeRequest(`${API_BASE}/commission-rates/${id}`, { method: "DELETE" });

// Applications
export const listApplications = (page = 1, limit = 20, status = "") => {
  const p = new URLSearchParams({ page, limit, ...(status && { status }) });
  return makeRequest(`${API_BASE}/applications?${p}`);
};
export const getApplication = (id) => makeRequest(`${API_BASE}/applications/${id}`);
export const approveApplication = (id, data = {}) =>
  makeRequest(`${API_BASE}/applications/${id}/approve`, { method: "POST", body: JSON.stringify(data) });
export const rejectApplication = (id, data) =>
  makeRequest(`${API_BASE}/applications/${id}/reject`, { method: "POST", body: JSON.stringify(data) });

// Affiliates
export const listAffiliates = (page = 1, limit = 20, status = "") => {
  const p = new URLSearchParams({ page, limit, ...(status && { status }) });
  return makeRequest(`${API_BASE}/affiliates?${p}`);
};
export const getAffiliate = (id) => makeRequest(`${API_BASE}/affiliates/${id}`);
export const updateAffiliate = (id, data) =>
  makeRequest(`${API_BASE}/affiliates/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Orders
export const listOrders = (page = 1, limit = 20, status = "") => {
  const p = new URLSearchParams({ page, limit, ...(status && { status }) });
  return makeRequest(`${API_BASE}/orders?${p}`);
};
export const approveOrderCommission = (id) =>
  makeRequest(`${API_BASE}/orders/${id}/approve-commission`, { method: "POST" });
export const cancelOrderCommission = (id, reason) =>
  makeRequest(`${API_BASE}/orders/${id}/cancel-commission`, { method: "POST", body: JSON.stringify({ reason }) });

// Commissions
export const listCommissions = (page = 1, limit = 20, status = "") => {
  const p = new URLSearchParams({ page, limit, ...(status && { status }) });
  return makeRequest(`${API_BASE}/commissions?${p}`);
};

// Payouts
export const listPayouts = (page = 1, limit = 20, status = "") => {
  const p = new URLSearchParams({ page, limit, ...(status && { status }) });
  return makeRequest(`${API_BASE}/payouts?${p}`);
};
export const updatePayout = (id, data) =>
  makeRequest(`${API_BASE}/payouts/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Helpers
export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

export const statusColor = (status) => {
  const map = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-red-100 text-red-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    SUSPENDED: "bg-orange-100 text-orange-700",
    BLOCKED: "bg-red-100 text-red-700",
    IN_PAYOUT: "bg-purple-100 text-purple-700",
    PAID: "bg-blue-100 text-blue-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
};
