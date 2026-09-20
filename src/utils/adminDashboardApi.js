// Main admin dashboard: KPIs with previous-period comparison, work queue, trend and recent orders.
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/dashboard`;

export const getAdminDashboard = async (days = 30) => {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`${API_BASE}?days=${days}`, { headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};
