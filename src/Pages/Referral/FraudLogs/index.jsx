// src/Pages/Referral/FraudLogs/index.jsx
import { useState, useEffect, useCallback } from "react";
import { listFraudLogs, reviewFraudLog, getStatusBadge } from "../../../utils/adminReferralApi";
import { AlertTriangle, X } from "lucide-react";

export default function FraudLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("CONFIRMED_FRAUD");
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFraudLogs(page, 20, statusFilter, severityFilter);
      setLogs(res.logs || []);
      setPagination(res.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, severityFilter]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    setProcessing(true);
    try {
      await reviewFraudLog(modal.id, { status: reviewStatus, notes, action });
      setModal(null); load();
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  };

  const severityColor = (s) => ({
    LOW: "text-yellow-700 bg-yellow-50 border border-yellow-200",
    MEDIUM: "text-orange-700 bg-orange-50 border border-orange-200",
    HIGH: "text-red-700 bg-red-100 border border-red-200",
    CRITICAL: "text-red-900 bg-red-200 border border-red-300",
  }[s] || "text-gray-600 bg-gray-100");

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review suspicious referral activity</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          {["", "PENDING_REVIEW", "UNDER_INVESTIGATION", "CONFIRMED_FRAUD", "FALSE_POSITIVE", "RESOLVED"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ") || "All Status"}</option>
          ))}
        </select>
        <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          {["", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map(s => (
            <option key={s} value={s}>{s || "All Severity"}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Fraud Type", "Severity", "User", "Description", "IP Address", "Status", "Date", "Action"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />Loading...
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">No fraud logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900 text-xs whitespace-nowrap">{log.fraud_type}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityColor(log.severity)}`}>{log.severity}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{log.user_id?.slice(0, 8) || "—"}…</td>
                  <td className="px-5 py-4 text-xs text-gray-600 max-w-[180px] truncate">{log.description}</td>
                  <td className="px-5 py-4 text-xs text-gray-400 font-mono">{log.ip_address || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(log.status)}`}>
                      {log.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    {log.status === "PENDING_REVIEW" && (
                      <button onClick={() => { setModal(log); setReviewStatus("CONFIRMED_FRAUD"); setNotes(""); setAction(""); }}
                        className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium whitespace-nowrap">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Review Fraud Log</h3>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{modal.fraud_type}</p>
              <p className="text-sm text-gray-700">{modal.description}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">Decision</label>
              <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
                <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
                <option value="FALSE_POSITIVE">False Positive</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <textarea placeholder="Review notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
            <input placeholder="Action taken (optional)" value={action} onChange={e => setAction(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleReview} disabled={processing}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {processing ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
