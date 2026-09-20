// Admin free-membership API (plans, members, summary).
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/membership`;

const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const getMembershipSummary = () => makeRequest(`${API_BASE}/summary`);
export const listMembershipPlans = () => makeRequest(`${API_BASE}/plans`);
export const updateMembershipPlan = (id, data) => makeRequest(`${API_BASE}/plans/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const getMembershipMember = (id) => makeRequest(`${API_BASE}/members/${id}`);
export const listMembershipMembers = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.append(k, String(v)); });
  return makeRequest(`${API_BASE}/members?${qs}`);
};
