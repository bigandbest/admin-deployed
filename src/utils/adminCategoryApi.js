// Product / child counts for every category, subcategory and group, plus headline numbers.
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/categories`;

export const getCategoryStats = async () => {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`${API_BASE}/stats`, { headers: { ...(token && { Authorization: `Bearer ${token}` }) } });
  if (!res.ok) throw new Error("Unable to load category statistics");
  return res.json();
};
