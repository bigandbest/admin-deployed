// src/Pages/Referral/Rewards/index.jsx
import { useState, useEffect, useCallback } from "react";
import { listRewards, extendRewardExpiry, cancelReward, manualCreditReward, formatCurrency, getStatusBadge } from "../../../utils/adminReferralApi";
import { Plus, Calendar, XCircle } from "lucide-react";

export default function ReferralRewards() {
  const [rewards, setRewards] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type, reward }
  const [input, setInput] = useState("");
  const [input2, setInput2] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRewards(page, 20, statusFilter);
      setRewards(res.rewards || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, reward = null) => {
    setModal({ type, reward });
    setInput(""); setInput2(""); setMsg("");
  };

  const handleModalAction = async () => {
    setProcessing(true); setMsg("");
    try {
      if (modal.type === "extend") await extendRewardExpiry(modal.reward.id, parseInt(input), input2);
      else if (modal.type === "cancel") await cancelReward(modal.reward.id, input);
      else if (modal.type === "credit") {
        await manualCreditReward({ user_id: modal.userId, amount: parseFloat(input), reason: input2, validity_days: 7 });
      }
      setMsg("Done!");
      setModal(null);
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Referral Rewards</h1>
        <button
          onClick={() => openModal("credit")}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Manual Credit
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "ACTIVE", "PARTIALLY_USED", "FULLY_USED", "EXPIRED", "CANCELLED"].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === s ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Type", "Amount", "Remaining", "Expires", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : rewards.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No rewards found</td></tr>
              ) : rewards.map(r => {
                const expiringSoon = new Date(r.expires_at) - new Date() < 48 * 3600000 && ["ACTIVE", "PARTIALLY_USED"].includes(r.status);
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 ${expiringSoon ? "bg-orange-50" : ""}`}>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{r.user_id?.slice(0, 8)}…</td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{r.reward_type}</span>
                    </td>
                    <td className="px-5 py-4 font-medium">{formatCurrency(r.original_amount)}</td>
                    <td className="px-5 py-4 font-medium text-green-700">{formatCurrency(r.remaining_amount)}</td>
                    <td className={`px-5 py-4 text-xs ${expiringSoon ? "text-orange-600 font-medium" : "text-gray-500"}`}>
                      {new Date(r.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {expiringSoon && " ⚠️"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      {["ACTIVE", "PARTIALLY_USED"].includes(r.status) && (
                        <div className="flex gap-2">
                          <button title="Extend" onClick={() => openModal("extend", r)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg"><Calendar className="w-4 h-4 text-blue-500" /></button>
                          <button title="Cancel" onClick={() => openModal("cancel", r)}
                            className="p-1.5 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4 text-red-500" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="text-sm text-gray-500">{page} / {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">
              {modal.type === "extend" ? "Extend Expiry" : modal.type === "cancel" ? "Cancel Reward" : "Manual Credit"}
            </h3>
            {modal.type === "extend" && (
              <>
                <input type="number" placeholder="Days to extend" value={input} onChange={e => setInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                <input placeholder="Reason" value={input2} onChange={e => setInput2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </>
            )}
            {modal.type === "cancel" && (
              <input placeholder="Reason for cancellation" value={input} onChange={e => setInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            )}
            {modal.type === "credit" && (
              <>
                <input placeholder="User ID" value={modal.userId || ""} onChange={e => setModal(m => ({ ...m, userId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                <input type="number" placeholder="Amount (₹)" value={input} onChange={e => setInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                <input placeholder="Reason" value={input2} onChange={e => setInput2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </>
            )}
            {msg && <p className={`text-sm ${msg === "Done!" ? "text-green-600" : "text-red-600"}`}>{msg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleModalAction} disabled={processing}
                className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {processing ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
