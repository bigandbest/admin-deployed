// src/Pages/Referral/Transactions/index.jsx
import { useState, useEffect, useCallback } from "react";
import { listTransactions, formatCurrency, getStatusBadge } from "../../../utils/adminReferralApi";
import { Search } from "lucide-react";

const STATUSES = ["", "PENDING", "SIGNUP_COMPLETED", "ORDER_PLACED", "ORDER_DELIVERED",
  "RETURN_WINDOW_ACTIVE", "COMPLETED", "FAILED", "CANCELLED", "FRAUD_REJECTED"];

export default function ReferralTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTransactions(page, 20, statusFilter, search);
      setTransactions(res.transactions || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Referral Transactions</h1>
        <p className="text-sm text-gray-500">{pagination?.total || 0} total</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search referee, code, order..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s || "All Status"}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Referee", "Referral Code", "Order", "Rewards", "Status", "Date"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No transactions found</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{tx.referee_name || "—"}</p>
                    <p className="text-xs text-gray-400">{tx.referee_email}</p>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-gray-700">{tx.referral_code_used}</td>
                  <td className="px-5 py-4">
                    {tx.order_number ? (
                      <>
                        <p className="text-gray-900">#{tx.order_number}</p>
                        {tx.order_amount && <p className="text-xs text-gray-400">{formatCurrency(tx.order_amount)}</p>}
                      </>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    {tx.referrer_reward_amount ? (
                      <p className="text-green-700 font-medium">+{formatCurrency(tx.referrer_reward_amount)}</p>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(tx.status)}`}>
                      {tx.status}
                    </span>
                    {tx.failure_reason && (
                      <p className="text-xs text-red-500 mt-1">{tx.failure_reason}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
            <span className="text-sm text-gray-500">{page} / {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
