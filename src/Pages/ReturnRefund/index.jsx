import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import {
  FiRefreshCw, FiSearch, FiChevronDown, FiChevronUp,
  FiCheck, FiX, FiAlertCircle, FiCheckCircle, FiXCircle,
  FiClock, FiTrendingUp, FiPercent, FiSettings, FiSave,
} from "react-icons/fi";
import { MdOutlineAssignmentReturn, MdOutlineCancel } from "react-icons/md";
import { RiBankLine } from "react-icons/ri";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtCurrency = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

const STATUS_META = {
  pending:    { label: "Pending",    bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400"  },
  approved:   { label: "Approved",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  processing: { label: "Processing", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
  completed:  { label: "Completed",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500"  },
  rejected:   { label: "Rejected",   bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500"    },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status?.toLowerCase()] || { label: status, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

const VALID_STATUSES = ["pending", "approved", "rejected", "processing", "completed"];

const NEXT_STATUS = {
  pending:    ["approved", "rejected"],
  approved:   ["processing", "rejected"],
  processing: ["completed"],
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className={`rounded-xl border p-4 ${color.bg} ${color.border}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-xs font-medium uppercase tracking-wide ${color.text}`}>{label}</span>
      <Icon className={`w-4 h-4 ${color.text} opacity-70`} />
    </div>
    <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Status update modal
// ---------------------------------------------------------------------------
const UpdateModal = ({ item, type, onClose, onSuccess }) => {
  const isLocked = item.status === "completed" || item.status === "rejected";
  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const endpoint = type === "return"
    ? `/return-orders/admin/status/${item.id}`
    : `/refund/admin/update-status/${item.id}`;

  const bodyKey = type === "return" ? "admin_notes" : "adminNotes";

  const handleSave = async () => {
    if (!status) { setError("Please select a status"); return; }
    setSaving(true);
    setError("");
    try {
      await api.put(endpoint, { status, [bodyKey]: notes });
      onSuccess("Status updated successfully");
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || "Failed to update status");
    } finally { setSaving(false); }
  };

  const user = type === "return"
    ? item.users_return_orders_user_idTousers
    : item.users_refund_requests_user_idTousers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Update Request Status</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><FiX className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Request ID</span>
              <span className="font-mono text-gray-700">#{item.id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="text-gray-700">{user?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Refund Amount</span>
              <span className="font-semibold text-green-700">{fmtCurrency(item.refund_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Status</span>
              <StatusBadge status={item.status} />
            </div>
          </div>

          {/* Locked notice */}
          {isLocked && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 font-medium
              ${item.status === "completed" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              <FiCheckCircle className="w-4 h-4 shrink-0" />
              This request is <strong className="ml-1">{item.status}</strong> — status cannot be changed.
            </div>
          )}

          {/* Status select */}
          {!isLocked && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Status *</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-orange-400 focus:outline-none">
                {VALID_STATUSES.filter((s) => s !== "completed" || item.status !== "completed").map((s) => (
                  <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              disabled={isLocked}
              placeholder={isLocked ? "No further changes allowed" : "Add a note for this status update…"}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-orange-400 focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-400" />
          </div>

          {/* Bank details (reminder) */}
          {item.bank_account_number && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-0.5">
              <p className="font-medium text-blue-800 mb-1">Bank Transfer Details</p>
              <p className="text-blue-700">Holder: <strong>{item.bank_account_holder_name}</strong></p>
              <p className="text-blue-700">Account: <strong>{item.bank_account_number}</strong>  ·  IFSC: <strong>{item.bank_ifsc_code}</strong></p>
              <p className="text-blue-700">Bank: <strong>{item.bank_name}</strong></p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <FiAlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            {isLocked ? "Close" : "Cancel"}
          </button>
          {!isLocked && (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : "Update Status"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Return orders row
// ---------------------------------------------------------------------------
const ReturnRow = ({ item, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const user = item.users_return_orders_user_idTousers;

  const quickUpdate = async (status) => {
    try {
      await api.put(`/return-orders/admin/status/${item.id}`, { status });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this return request? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/return-orders/admin/delete/${item.id}`);
      onUpdate();
    } catch { setDeleting(false); }
  };

  const showSuccess = (msg) => {
    setToast(msg);
    setTimeout(() => { setToast(null); onUpdate(); }, 1500);
  };

  return (
    <>
      {showModal && <UpdateModal item={item} type="return" onClose={() => setShowModal(false)} onSuccess={showSuccess} />}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {toast && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-sm text-green-700">
            <FiCheckCircle className="w-3.5 h-3.5" /> {toast}
          </div>
        )}

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Type icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
            ${item.return_type === "cancellation" ? "bg-orange-100" : "bg-purple-100"}`}>
            {item.return_type === "cancellation"
              ? <MdOutlineCancel className="w-4 h-4 text-orange-600" />
              : <MdOutlineAssignmentReturn className="w-4 h-4 text-purple-600" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800 capitalize">{item.return_type}</span>
              <span className="text-xs text-gray-400 font-mono">#{item.id?.slice(-8).toUpperCase()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.name || "Unknown"} · Order #{item.order_id?.slice(0, 8).toUpperCase()} · {fmt(item.created_at)}
            </p>
          </div>

          {/* Amount + status */}
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={item.status} />
            <span className="text-sm font-bold text-gray-800">{fmtCurrency(item.refund_amount)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {item.status === "completed" || item.status === "rejected" ? (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                ${item.status === "completed" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {item.status === "completed" ? "Completed" : "Rejected"}
              </span>
            ) : (
              <>
                {NEXT_STATUS[item.status]?.map((s) => (
                  <button key={s} onClick={() => quickUpdate(s)} title={`Mark as ${s}`}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                      ${s === "rejected" ? "bg-red-50 text-red-600 hover:bg-red-100" :
                        s === "approved" ? "bg-green-50 text-green-700 hover:bg-green-100" :
                        s === "processing" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" :
                        "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                    {s === "approved" ? "Approve" : s === "rejected" ? "Reject" : s === "processing" ? "Process" : "Complete"}
                  </button>
                ))}
                <button onClick={() => setShowModal(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  Edit
                </button>
              </>
            )}
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Customer</p>
                <p className="text-gray-800">{user?.name || "—"}</p>
                <p className="text-gray-500 text-xs">{user?.email || "—"}</p>
                <p className="text-gray-500 text-xs">{user?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Reason</p>
                <p className="text-gray-800">{item.reason}</p>
                {item.additional_details && <p className="text-gray-500 text-xs mt-1">{item.additional_details}</p>}
              </div>
              {item.bank_account_number && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Bank Details</p>
                  <p className="text-gray-800">{item.bank_account_holder_name}</p>
                  <p className="text-gray-600 text-xs font-mono">{item.bank_account_number} · {item.bank_ifsc_code}</p>
                  <p className="text-gray-500 text-xs">{item.bank_name}</p>
                </div>
              )}
            </div>
            {item.admin_notes && (
              <div className="mt-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <p className="font-medium text-blue-800 mb-0.5">Admin Note</p>
                <p className="text-blue-700">{item.admin_notes}</p>
              </div>
            )}
            <div className="flex justify-end mt-3">
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 transition-colors">
                {deleting ? "Deleting…" : "Delete Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Refund row
// ---------------------------------------------------------------------------
const RefundRow = ({ item, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const user = item.users_refund_requests_user_idTousers;

  const showSuccess = (msg) => {
    setToast(msg);
    setTimeout(() => { setToast(null); onUpdate(); }, 1500);
  };

  return (
    <>
      {showModal && <UpdateModal item={item} type="refund" onClose={() => setShowModal(false)} onSuccess={showSuccess} />}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {toast && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-sm text-green-700">
            <FiCheckCircle className="w-3.5 h-3.5" /> {toast}
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <RiBankLine className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">Refund Request</span>
              <span className="text-xs text-gray-400 font-mono">#{item.id?.slice(-8).toUpperCase()}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {item.refund_type?.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.name || "Unknown"} · Order #{item.order_id?.slice(0, 8).toUpperCase()} · {fmt(item.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={item.status} />
            <span className="text-sm font-bold text-gray-800">{fmtCurrency(item.refund_amount)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {item.status === "completed" || item.status === "rejected" ? (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                ${item.status === "completed" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {item.status === "completed" ? "Completed" : "Rejected"}
              </span>
            ) : (
              <button onClick={() => setShowModal(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Update
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Customer</p>
                <p className="text-gray-800">{user?.name || "—"}</p>
                <p className="text-gray-500 text-xs">{user?.email || "—"}</p>
                <p className="text-gray-500 text-xs">{user?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Refund Info</p>
                <p className="text-gray-700 text-xs">Mode: <span className="font-medium capitalize">{item.refund_mode?.replace(/_/g, " ")}</span></p>
                <p className="text-gray-700 text-xs">Payment: <span className="font-medium uppercase">{item.payment_method}</span></p>
                {item.processed_at && <p className="text-gray-700 text-xs">Processed: {fmt(item.processed_at)}</p>}
              </div>
              {item.bank_account_number && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Bank Details</p>
                  <p className="text-gray-800">{item.bank_account_holder_name}</p>
                  <p className="text-gray-600 text-xs font-mono">{item.bank_account_number} · {item.bank_ifsc_code}</p>
                  <p className="text-gray-500 text-xs">{item.bank_name}</p>
                </div>
              )}
            </div>
            {item.admin_notes && (
              <div className="mt-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <p className="font-medium text-blue-800 mb-0.5">Admin Note</p>
                <p className="text-blue-700">{item.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const ReturnRefundAdmin = () => {
  const [activeTab, setActiveTab] = useState("returns");
  const [returnOrders, setReturnOrders] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [globalToast, setGlobalToast] = useState(null);

  // Refund policy config
  const [refundPct, setRefundPct] = useState(0);
  const [refundPctInput, setRefundPctInput] = useState("0");
  const [pctLoading, setPctLoading] = useState(true);
  const [pctSaving, setPctSaving] = useState(false);
  const [pctError, setPctError] = useState("");

  const showGlobalToast = (msg, type = "success") => {
    setGlobalToast({ msg, type });
    setTimeout(() => setGlobalToast(null), 3500);
  };

  // Load refund percentage from charge settings
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/charge-settings");
        const pct = Number(res.data?.data?.refund_percentage ?? 0);
        setRefundPct(pct);
        setRefundPctInput(String(pct));
      } catch { /* keep default 0 */ }
      finally { setPctLoading(false); }
    })();
  }, []);

  const saveRefundPct = async () => {
    const val = parseFloat(refundPctInput);
    if (isNaN(val) || val < 0 || val > 100) {
      setPctError("Enter a value between 0 and 100");
      return;
    }
    setPctError("");
    setPctSaving(true);
    try {
      await api.put("/charge-settings", { refund_percentage: val });
      setRefundPct(val);
      showGlobalToast("Refund policy saved successfully");
    } catch (e) {
      setPctError(e.response?.data?.error || "Failed to save");
    } finally { setPctSaving(false); }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, fRes] = await Promise.all([
        api.get("/return-orders/admin/all", { params: { limit: 100, ...(statusFilter && { status: statusFilter }) } }),
        api.get("/refund/admin/all",        { params: { limit: 100, ...(statusFilter && { status: statusFilter }), ...(typeFilter && { refundType: typeFilter }) } }),
      ]);
      setReturnOrders(rRes.data.return_requests || []);
      setRefundRequests(fRes.data.refundRequests || []);
    } catch (e) {
      console.error("Fetch error:", e);
      showGlobalToast("Failed to load data", "error");
    } finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filtered lists
  const filterReturns = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((r) =>
      r.id?.toLowerCase().includes(q) ||
      r.order_id?.toLowerCase().includes(q) ||
      r.users_return_orders_user_idTousers?.name?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  };
  const filterRefunds = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((r) =>
      r.id?.toLowerCase().includes(q) ||
      r.order_id?.toLowerCase().includes(q) ||
      r.users_refund_requests_user_idTousers?.name?.toLowerCase().includes(q)
    );
  };

  const filteredReturns = filterReturns(returnOrders);
  const filteredRefunds = filterRefunds(refundRequests);

  // Stats across all data
  const stats = [
    { label: "Pending",    value: [...returnOrders, ...refundRequests].filter(r => r.status === "pending").length,    color: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },  icon: FiClock       },
    { label: "Approved",   value: [...returnOrders, ...refundRequests].filter(r => r.status === "approved").length,   color: { bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200"  },  icon: FiCheckCircle },
    { label: "Processing", value: [...returnOrders, ...refundRequests].filter(r => r.status === "processing").length, color: { bg: "bg-violet-50",text: "text-violet-700",border: "border-violet-200"},  icon: FiRefreshCw   },
    { label: "Completed",  value: [...returnOrders, ...refundRequests].filter(r => r.status === "completed").length,  color: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },  icon: FiCheck       },
    {
      label: "Total Refunds",
      value: fmtCurrency([...returnOrders, ...refundRequests].filter(r => ["approved","processing","completed"].includes(r.status)).reduce((s,r) => s + Number(r.refund_amount||0), 0)),
      color: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      icon: FiTrendingUp,
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Global toast */}
      {globalToast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
          ${globalToast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {globalToast.type === "success" ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
          {globalToast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage customer return, cancellation and refund requests</p>
          </div>
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Refund Policy Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
            <FiSettings className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Refund Policy</h2>
            <p className="text-xs text-gray-500">Set what percentage is deducted from the product subtotal — shipping &amp; other charges are never refunded</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48 max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Deduction Percentage (% deducted from product subtotal)
            </label>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.01"
                value={refundPctInput}
                onChange={(e) => { setRefundPctInput(e.target.value); setPctError(""); }}
                disabled={pctLoading}
                placeholder="0"
                className="w-full pl-3 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              />
              <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            {pctError && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {pctError}
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 min-w-52 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm">
            <p className="text-xs text-orange-700 font-medium mb-1">Preview</p>
            <p className="text-orange-800">
              For a ₹1,000 product order, customer receives{" "}
              <strong>
                ₹{(1000 * (1 - (parseFloat(refundPctInput) || 0) / 100)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </strong>
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {parseFloat(refundPctInput) === 0
                ? "0% deduction — full product price refunded"
                : `${parseFloat(refundPctInput) || 0}% deducted from product price`}
            </p>
          </div>

          <button
            onClick={saveRefundPct}
            disabled={pctSaving || pctLoading || refundPctInput === String(refundPct)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            {pctSaving
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
              : <><FiSave className="w-4 h-4" />Save Policy</>}
          </button>
        </div>

        {!pctLoading && (
          <p className="text-xs text-gray-400 mt-3">
            Current policy: <strong>{refundPct}%</strong> is deducted from the product subtotal before refunding
            {refundPct === 0 ? " (full product price refunded, no deduction)" : ""}.
            Shipping, handling, platform and surge charges are never refunded.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <FiSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input type="text" placeholder="Search by ID, customer, order…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
          {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600"><FiX className="w-3.5 h-3.5" /></button>}
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 text-gray-700">
          <option value="">All Statuses</option>
          {VALID_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
        </select>

        {activeTab === "refunds" && (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 text-gray-700">
            <option value="">All Types</option>
            <option value="order_cancellation">Order Cancellation</option>
            <option value="order_return">Order Return</option>
            <option value="partial_refund">Partial Refund</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
        {[
          { id: "returns", label: `Returns & Cancellations (${returnOrders.length})` },
          { id: "refunds", label: `Refund Requests (${refundRequests.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === t.id ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "returns" ? (
        <div className="space-y-2">
          {filteredReturns.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
              <MdOutlineAssignmentReturn className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">{search || statusFilter ? "No matching requests" : "No return requests yet"}</p>
            </div>
          ) : filteredReturns.map((r) => (
            <ReturnRow key={r.id} item={r} onUpdate={fetchAll} onDelete={fetchAll} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRefunds.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
              <RiBankLine className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">{search || statusFilter ? "No matching requests" : "No refund requests yet"}</p>
            </div>
          ) : filteredRefunds.map((r) => (
            <RefundRow key={r.id} item={r} onUpdate={fetchAll} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnRefundAdmin;
