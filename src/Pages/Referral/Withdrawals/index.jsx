// src/Pages/Referral/Withdrawals/index.jsx
import { useState, useEffect, useCallback } from "react";
import { listWithdrawals, approveWithdrawal, rejectWithdrawal, processWithdrawal, formatCurrency, getStatusBadge } from "../../../utils/adminReferralApi";
import { CheckCircle, XCircle, Zap, X } from "lucide-react";

export default function ReferralWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [input, setInput] = useState("");
  const [input2, setInput2] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWithdrawals(page, 20, statusFilter);
      setWithdrawals(res.withdrawals || []);
      setPagination(res.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, w) => { setModal({ type, w }); setInput(""); setInput2(""); setMsg(""); };

  const handleAction = async () => {
    setProcessing(true); setMsg("");
    try {
      if (modal.type === "approve") await approveWithdrawal(modal.w.id, input);
      else if (modal.type === "reject") await rejectWithdrawal(modal.w.id, input);
      else if (modal.type === "process") await processWithdrawal(modal.w.id, { transaction_id: input, payment_gateway_ref: input2 });
      setModal(null); load();
    } catch (err) { setMsg(err.message); }
    finally { setProcessing(false); }
  };

  const pendingCount = withdrawals.filter(w => w.status === "PENDING").length;
  const statuses = ["", "PENDING", "APPROVED", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600 mt-0.5 font-medium">{pendingCount} pending approval</p>
          )}
        </div>
        <p className="text-sm text-gray-400">{pagination?.total || 0} total</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}
            {s === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Amount", "Payment Method", "Status", "Requested", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />Loading...
                  </div>
                </td></tr>
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">No withdrawals found</td></tr>
              ) : withdrawals.map(w => (
                <tr key={w.id} className={`hover:bg-gray-50/60 transition-colors ${w.status === "PENDING" ? "bg-orange-50/30" : ""}`}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[130px]">{w.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[130px]">{w.user?.email}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 text-base">{formatCurrency(w.requested_amount)}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium">{w.payment_method === "UPI" ? "UPI" : "Bank Transfer"}</p>
                    <p className="text-xs text-gray-400">{w.upi_id || w.account_holder_name || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(w.status)}`}>{w.status}</span>
                    {(w.failure_reason || w.rejection_reason) && (
                      <p className="text-xs text-red-500 mt-1 max-w-[140px] truncate">{w.failure_reason || w.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(w.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {w.status === "PENDING" && (
                        <>
                          <button title="Approve" onClick={() => openModal("approve", w)}
                            className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"><CheckCircle className="w-4 h-4 text-green-600" /></button>
                          <button title="Reject" onClick={() => openModal("reject", w)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="w-4 h-4 text-red-500" /></button>
                        </>
                      )}
                      {w.status === "APPROVED" && (
                        <button title="Mark as Processed" onClick={() => openModal("process", w)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"><Zap className="w-4 h-4 text-blue-500" /></button>
                      )}
                    </div>
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 capitalize">{modal.type} Withdrawal</h3>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm bg-gray-50 px-3 py-2 rounded-xl">
              <span className="font-bold">{formatCurrency(modal.w.requested_amount)}</span>
              <span className="text-gray-500 ml-2">— {modal.w.user?.name || "Unknown"}</span>
            </p>
            {modal.type === "approve" && (
              <input placeholder="Notes (optional)" value={input} onChange={e => setInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            )}
            {modal.type === "reject" && (
              <input placeholder="Rejection reason (required)" value={input} onChange={e => setInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            )}
            {modal.type === "process" && (
              <>
                <input placeholder="Transaction ID" value={input} onChange={e => setInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                <input placeholder="Payment Gateway Ref (optional)" value={input2} onChange={e => setInput2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </>
            )}
            {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{msg}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleAction} disabled={processing}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors ${modal.type === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-700"}`}>
                {processing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
