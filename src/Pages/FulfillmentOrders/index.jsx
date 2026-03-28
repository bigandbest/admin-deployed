import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTruck, FaWarehouse, FaBox, FaCheckCircle, FaClock,
  FaTimesCircle, FaEye, FaChevronDown, FaChevronUp,
  FaSync, FaFilter, FaSearch, FaMotorcycle,
} from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:                    { label: "Pending",             color: "bg-yellow-100 text-yellow-800",  dot: "bg-yellow-400" },
  confirmed:                  { label: "Confirmed",           color: "bg-blue-100 text-blue-800",      dot: "bg-blue-500"   },
  picked:                     { label: "Picked",              color: "bg-indigo-100 text-indigo-800",  dot: "bg-indigo-500" },
  in_transit:                 { label: "In Transit",          color: "bg-purple-100 text-purple-800",  dot: "bg-purple-500" },
  delivered:                  { label: "Delivered",           color: "bg-green-100 text-green-800",    dot: "bg-green-500"  },
  rider_pending:              { label: "Rider Pending",       color: "bg-orange-100 text-orange-800",  dot: "bg-orange-400" },
  dispatched_to_zonal_delivery:{ label: "Sent to Zonal",     color: "bg-teal-100 text-teal-800",      dot: "bg-teal-500"   },
  cancelled:                  { label: "Cancelled",           color: "bg-red-100 text-red-800",        dot: "bg-red-400"    },
  return_to_source:           { label: "Return to Source",   color: "bg-gray-100 text-gray-700",      dot: "bg-gray-400"   },
};

const SOURCE_CONFIG = {
  division: { label: "Division Warehouse", color: "bg-blue-50 text-blue-700 border border-blue-200",  icon: <FaWarehouse className="inline mr-1" /> },
  zonal:    { label: "Zonal Warehouse",    color: "bg-teal-50 text-teal-700 border border-teal-200",  icon: <MdLocalShipping className="inline mr-1" /> },
};

const NEXT_STATUS = {
  pending:     ["confirmed", "cancelled"],
  confirmed:   ["picked", "cancelled"],
  picked:      ["in_transit"],
  in_transit:  ["delivered", "return_to_source"],
  rider_pending: ["confirmed", "cancelled"],
  dispatched_to_zonal_delivery: ["delivered", "cancelled"],
};

const STATUS_LABELS = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, count, color, icon }) => (
  <div className={`rounded-xl p-4 flex items-center gap-3 ${color} shadow-sm`}>
    <div className="text-2xl opacity-70">{icon}</div>
    <div>
      <p className="text-2xl font-bold leading-none">{count}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  </div>
);

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────

const DetailModal = ({ subOrder, onClose, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);

  // Fetch full detail (includes events) on mount — list items don't carry events
  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    axios
      .get(`${API_BASE_URL}/admin/fulfillment/sub-orders/${subOrder.id}`, { headers: authHeaders() })
      .then((res) => { if (!cancelled && res.data.success) setDetail(res.data.data); })
      .catch(() => {/* fall back to list-item data */})
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [subOrder.id]);

  const data = detail || subOrder;
  const nextStatuses = NEXT_STATUS[data.fulfillment_status] || [];

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Update status to "${STATUS_CONFIG[newStatus]?.label}"?`)) return;
    setUpdating(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/fulfillment/sub-orders/${data.id}/status`,
        { status: newStatus, note },
        { headers: authHeaders() }
      );
      onStatusUpdate();
      onClose();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const srcCfg = SOURCE_CONFIG[data.source_type] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Sub-Order Detail</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{data.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={data.fulfillment_status} />
            {detailLoading && <span className="text-xs text-gray-400 animate-pulse">Loading…</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Source + Warehouse */}
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${srcCfg.color}`}>
              {srcCfg.icon}{srcCfg.label}
            </span>
            {data.warehouse && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                <FaWarehouse className="text-xs" />
                {data.warehouse.name}
                {data.warehouse.location && <span className="text-gray-400 ml-1">· {data.warehouse.location}</span>}
              </span>
            )}
          </div>

          {/* Two columns: Customer + Order Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
              <p className="font-semibold text-gray-800">{data.customer.name}</p>
              <p className="text-sm text-gray-600">{data.customer.phone}</p>
              <p className="text-sm text-gray-500">{data.customer.email}</p>
              <p className="text-sm text-gray-600 mt-1">{data.customer.address}</p>
              <p className="text-sm font-medium text-blue-600 mt-1">Pincode: {data.customer.pincode}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Master Order</span>
                  <span className="font-mono text-xs text-gray-700">{data.parent_order_id?.slice(0, 8)}…</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-medium uppercase">{data.order_summary.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Master Status</span>
                  <span className="font-medium">{data.order_summary.master_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sub-Order Total</span>
                  <span className="font-bold text-green-700">₹{data.order_total.toFixed(2)}</span>
                </div>
                {data.estimated_delivery_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. Delivery</span>
                    <span>{new Date(data.estimated_delivery_at).toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items ({data.items.length})</p>
            <div className="divide-y border rounded-xl overflow-hidden">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white">
                  {item.product_image
                    ? <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover border" />
                    : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><FaBox /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.variant_name} · SKU: {item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800">₹{item.unit_price} × {item.quantity}</p>
                    <p className="text-xs text-green-700 font-medium">₹{item.line_total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events timeline — only available after detail fetch */}
          {(data.events?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fulfillment Timeline</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {data.events.map((ev, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                    <div>
                      <span className="font-medium text-gray-700">{ev.event_type.replace(/_/g, " ")}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {new Date(ev.created_at).toLocaleString("en-IN")}
                      </span>
                      {ev.payload?.note && <p className="text-gray-500 text-xs">{ev.payload.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          {nextStatuses.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Optional note..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(s)}
                    disabled={updating}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${s === 'cancelled' || s === 'return_to_source'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                  >
                    {updating ? "…" : `→ ${STATUS_CONFIG[s]?.label || s}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const FulfillmentOrders = () => {
  const [subOrders, setSubOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filters
  const [sourceType, setSourceType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/fulfillment/stats`, { headers: authHeaders() });
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error("Stats fetch failed:", err.message);
    }
  }, []);

  const fetchSubOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15, source_type: sourceType };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await axios.get(`${API_BASE_URL}/admin/fulfillment/sub-orders`, { params, headers: authHeaders() });
      if (res.data.success) {
        setSubOrders(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sourceType, statusFilter, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchSubOrders(); }, [fetchSubOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusUpdate = () => {
    fetchSubOrders();
    fetchStats();
  };

  const s = stats?.by_status || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fulfillment Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Division & Zonal warehouse sub-orders</p>
        </div>
        <button
          onClick={() => { fetchSubOrders(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm"
        >
          <FaSync className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Pending"      count={s.pending || 0}       color="bg-yellow-50 text-yellow-900" icon={<FaClock />} />
        <StatCard label="Confirmed"    count={s.confirmed || 0}     color="bg-blue-50 text-blue-900"    icon={<FaCheckCircle />} />
        <StatCard label="Picked"       count={s.picked || 0}        color="bg-indigo-50 text-indigo-900" icon={<FaBox />} />
        <StatCard label="In Transit"   count={s.in_transit || 0}    color="bg-purple-50 text-purple-900" icon={<FaTruck />} />
        <StatCard label="Delivered"    count={s.delivered || 0}     color="bg-green-50 text-green-900"  icon={<FaCheckCircle />} />
        <StatCard label="Rider Pending" count={s.rider_pending || 0} color="bg-orange-50 text-orange-900" icon={<FaMotorcycle />} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <FaFilter className="text-gray-400 shrink-0" />

        {/* Source type */}
        <select
          value={sourceType}
          onChange={e => { setSourceType(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="all">All Sources</option>
          <option value="division">Division Only</option>
          <option value="zonal">Zonal Only</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Statuses</option>
          {STATUS_LABELS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Search order ID or name…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700">
            <FaSearch />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {error && (
          <div className="p-4 text-red-600 text-sm bg-red-50 border-b">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Sub-Order</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Warehouse</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Pincode</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : subOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    <FaBox className="text-3xl mx-auto mb-2 opacity-30" />
                    No sub-orders found
                  </td>
                </tr>
              ) : (
                subOrders.map(so => {
                  const srcCfg = SOURCE_CONFIG[so.source_type] || {};
                  return (
                    <tr key={so.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {so.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${srcCfg.color}`}>
                          {srcCfg.icon}{srcCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {so.warehouse?.name || `#${so.source_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{so.customer.name}</p>
                        <p className="text-xs text-gray-400">{so.customer.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{so.customer.pincode}</td>
                      <td className="px-4 py-3 text-gray-700">{so.items.length} item{so.items.length !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">₹{so.order_total.toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={so.fulfillment_status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(so.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(so)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-white"
              >← Prev</button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">{page}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-white"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <DetailModal
          subOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default FulfillmentOrders;
