// Admin product list, summary and filter options (server-side filtering, sorting and paging).
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/products`;

const makeRequest = async (url) => {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(url, { headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// Drops empty values so the URL only carries active filters.
export const listAdminProducts = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.append(k, String(v)); });
  return makeRequest(`${API_BASE}?${qs}`);
};
export const getAdminProduct = (id) => makeRequest(`${API_BASE}/${id}`);
export const getProductSummary = () => makeRequest(`${API_BASE}/summary`);
export const getProductFilterOptions = () => makeRequest(`${API_BASE}/filter-options`);
