// src/Pages/Referral/Users/index.jsx
import { useState, useEffect, useCallback } from "react";
import { formatEmail } from "../../../utils/formatEmail";
import { listUsers, blockUser, unblockUser, deactivateCode, reactivateCode, manualCreditReward, formatCurrency, getStatusBadge } from "../../../utils/adminReferralApi";
import { Search, Ban, CheckCircle, Gift, ToggleLeft, ToggleRight, X } from "lucide-react";

export default function ReferralUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type, user }
  const [input, setInput] = useState("");
  const [input2, setInput2] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers(page, 20, search, statusFilter);
      setUsers(res.users || []);
      setPagination(res.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, user) => { setModal({ type, user }); setInput(""); setInput2(""); setMsg(""); };

  const handleAction = async () => {
    if (!modal) return;
    setProcessing(true); setMsg("");
    try {
      const { type, user } = modal;
      if (type === "block") await blockUser(user.user_id, input);
      else if (type === "unblock") await unblockUser(user.user_id);
      else if (type === "deactivate") await deactivateCode(user.user_id);
      else if (type === "reactivate") await reactivateCode(user.user_id);
      else if (type === "credit") await manualCreditReward({ user_id: user.user_id, amount: parseFloat(input), reason: input2, validity_days: 7 });
      setModal(null);
      load();
    } catch (err) { setMsg(err.message); }
    finally { setProcessing(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage referral profiles and actions</p>
        </div>
        <p className="text-sm text-gray-400">{pagination?.total || 0} users</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by code or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-64"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Referral Code", "Referrals", "Earnings", "Balance", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    Loading...
                  </div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[140px]">{u.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{formatEmail(u.user?.email) || u.user?.phone || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded-lg">{u.referral_code}</span>
                    {!u.referral_code_active && <span className="ml-2 text-xs text-red-500">(inactive)</span>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{u.successful_referrals}</p>
                    <p className="text-xs text-gray-400">{u.pending_referrals} pending</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-emerald-700">{formatCurrency(u.total_earnings)}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{formatCurrency(u.available_balance)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(u.status)}`}>{u.status}</span>
                    {u.is_blocked && <p className="text-xs text-red-400 mt-1">Blocked</p>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <ActionBtn title="Manual Credit" onClick={() => openModal("credit", u)} className="hover:bg-green-50">
                        <Gift className="w-4 h-4 text-green-600" />
                      </ActionBtn>
                      {u.is_blocked ? (
                        <ActionBtn title="Unblock" onClick={() => openModal("unblock", u)} className="hover:bg-green-50">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </ActionBtn>
                      ) : (
                        <ActionBtn title="Block" onClick={() => openModal("block", u)} className="hover:bg-red-50">
                          <Ban className="w-4 h-4 text-red-500" />
                        </ActionBtn>
                      )}
                      {u.referral_code_active ? (
                        <ActionBtn title="Deactivate Code" onClick={() => openModal("deactivate", u)} className="hover:bg-orange-50">
                          <ToggleRight className="w-4 h-4 text-orange-500" />
                        </ActionBtn>
                      ) : (
                        <ActionBtn title="Reactivate Code" onClick={() => openModal("reactivate", u)} className="hover:bg-blue-50">
                          <ToggleLeft className="w-4 h-4 text-blue-500" />
                        </ActionBtn>
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
              <h3 className="font-semibold text-gray-900 capitalize">
                {modal.type === "credit" ? "Manual Credit" : modal.type === "deactivate" ? "Deactivate Code" : modal.type === "reactivate" ? "Reactivate Code" : `${modal.type} User`}
              </h3>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
              {modal.user.user?.name || "Unknown"} &middot; <span className="font-mono">{modal.user.referral_code}</span>
            </p>
            {modal.type === "block" && (
              <input placeholder="Reason for blocking (required)" value={input} onChange={e => setInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            )}
            {modal.type === "credit" && (
              <>
                <input type="number" placeholder="Amount (₹)" value={input} onChange={e => setInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                <input placeholder="Reason for credit" value={input2} onChange={e => setInput2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </>
            )}
            {["unblock", "deactivate", "reactivate"].includes(modal.type) && (
              <p className="text-sm text-gray-600">Are you sure you want to {modal.type} this user's referral access?</p>
            )}
            {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{msg}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleAction} disabled={processing}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {processing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ title, onClick, className, children }) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${className}`}>
      {children}
    </button>
  );
}
