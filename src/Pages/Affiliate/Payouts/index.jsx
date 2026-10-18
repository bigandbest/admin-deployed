import { useState, useEffect } from "react";
import { listPayouts, updatePayout, formatCurrency, statusColor } from "../../../utils/adminAffiliateApi";
import { Eye, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";

const STATUSES = ["", "PENDING", "APPROVED", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"];

export default function AffiliatePayouts() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [failReason, setFailReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPayouts(page, limit, statusFilter);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = (payout) => {
    setSelected(payout);
    setTxnId(payout.transaction_id || "");
    setAdminNotes(payout.admin_notes || "");
    setFailReason("");
    setModalOpen(true);
  };

  const handleAction = async (status) => {
    setActionLoading(true);
    try {
      const data = { status, admin_notes: adminNotes };
      if (status === "COMPLETED") data.transaction_id = txnId;
      if (status === "FAILED") data.failure_reason = failReason;
      await updatePayout(selected.id, data);
      setModalOpen(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Payouts</h1>
          <p className="text-sm text-gray-500">{total} total payouts</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No payouts found</div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Payout #", "Affiliate", "Gross", "TDS", "Net", "Method", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.payout_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.affiliate_profile?.display_name}</div>
                    <div className="text-xs text-gray-500">{p.affiliate_profile?.affiliate_code}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.gross_amount)}</td>
                  <td className="px-4 py-3 text-red-600">-{formatCurrency(p.tds_amount)}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(p.net_amount)}</td>
                  <td className="px-4 py-3 text-xs">{p.payment_method === "UPI" ? `UPI: ${p.upi_id}` : `Bank`}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openModal(p)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Process Payout Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Process Payout</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Payout #</span><span className="font-mono">{selected.payout_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Affiliate</span><span className="font-medium">{selected.affiliate_profile?.display_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Gross Amount</span><span>{formatCurrency(selected.gross_amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">TDS Deduction</span><span className="text-red-600">-{formatCurrency(selected.tds_amount)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2"><span className="font-semibold">Net Payable</span><span className="font-bold text-green-700 text-base">{formatCurrency(selected.net_amount)}</span></div>
              </div>

              {/* Payment Info */}
              <div className="text-sm space-y-1">
                <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
                {selected.payment_method === "UPI" ? (
                  <div><span className="text-gray-500">UPI ID: </span><span className="font-medium">{selected.upi_id}</span></div>
                ) : (
                  <>
                    <div><span className="text-gray-500">Bank: </span><span>{selected.bank_name}</span></div>
                    <div><span className="text-gray-500">Account: </span><span className="font-mono">{selected.bank_account_number}</span></div>
                    <div><span className="text-gray-500">IFSC: </span><span className="font-mono">{selected.bank_ifsc_code}</span></div>
                    <div><span className="text-gray-500">Name: </span><span>{selected.account_holder_name}</span></div>
                  </>
                )}
              </div>

              {selected.status === "PENDING" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Transaction ID (after payment)</label>
                    <input value={txnId} onChange={(e) => setTxnId(e.target.value)}
                      placeholder="UTR / Transaction reference..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Admin Notes</label>
                    <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleAction("COMPLETED")} disabled={actionLoading || !txnId}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Mark Completed
                    </button>
                    <button onClick={() => handleAction("FAILED")} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Failed
                    </button>
                  </div>
                </>
              )}

              {selected.status !== "PENDING" && (
                <button onClick={() => setModalOpen(false)} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
