const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Exact value — for tables, breakdowns and anything financial.
export const formatINR = (n) => inr.format(Number(n) || 0);
export const formatINRExact = (n) => inrExact.format(Number(n) || 0);

// Abbreviated value — dashboard KPI cards only (₹1.24L, ₹12.4Cr).
export const formatINRCompact = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2).replace(/\.?0+$/, "")}Cr`;
  if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2).replace(/\.?0+$/, "")}L`;
  return inr.format(v);
};

export const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(Number(n) || 0);

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
