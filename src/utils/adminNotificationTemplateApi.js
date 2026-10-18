const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/admin/notification-templates`;

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

export const listTemplates = () => makeRequest(`${API_BASE}`);
export const saveTemplate = (type, data) => makeRequest(`${API_BASE}/${type}`, { method: "PUT", body: JSON.stringify(data) });
export const resetTemplate = (type) => makeRequest(`${API_BASE}/${type}`, { method: "DELETE" });
