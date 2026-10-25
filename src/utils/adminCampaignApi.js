const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/campaigns`;

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

export const listCampaigns = async (channel = "", status = "") => {
  const data = [];
  let total = 0;
  for (let page = 1; ; page++) {
    const p = new URLSearchParams({ page: String(page), limit: "100", ...(channel && { channel }), ...(status && { status }) });
    const result = await makeRequest(`${API_BASE}?${p}`);
    const rows = result.data || [];
    data.push(...rows); total = result.total ?? data.length;
    if (!rows.length || data.length >= total) break;
  }
  return { success: true, data, total };
};

export const createCampaign = (data) =>
  makeRequest(`${API_BASE}`, { method: "POST", body: JSON.stringify(data) });
export const updateCampaign = (id, data) =>
  makeRequest(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const toggleCampaign = (id) =>
  makeRequest(`${API_BASE}/${id}/toggle`, { method: "PUT" });
export const deleteCampaign = (id) =>
  makeRequest(`${API_BASE}/${id}`, { method: "DELETE" });

export const searchProducts = (search = "", categoryId = "") => {
  const p = new URLSearchParams({ ...(search && { search }), ...(categoryId && { category_id: categoryId }) });
  return makeRequest(`${API_BASE}/lookup/products?${p}`);
};
export const listCategoriesForLookup = () => makeRequest(`${API_BASE}/lookup/categories`);
