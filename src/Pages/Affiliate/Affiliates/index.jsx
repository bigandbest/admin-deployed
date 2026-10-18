import { useState, useEffect } from "react";
import { listAffiliates, getAffiliate, updateAffiliate, formatCurrency, statusColor } from "../../../utils/adminAffiliateApi";
import { Eye, RefreshCw, ChevronLeft, ChevronRight, Shield, ShieldOff } from "lucide-react";

const STATUSES = ["", "ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"];
const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

export default function AffiliateList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTier, setEditTier] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAffiliates(page, limit, statusFilter);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openDetail = async (id) => {
    try {
      const res = await getAffiliate(id);
      setSelected(res.data);
      setEditTier(res.data.tier_name || "Bronze");
      setEditStatus(res.data.status || "ACTIVE");
      setModalOpen(true);
    } catch (e) { alert(e.message); }
  };

  const handleUpdate = async () => {
    setActionLoading(true);
    try {
      await updateAffiliate(selected.id, {
        tier_name: editTier,
        status: editStatus,
        is_blocked: editStatus === "BLOCKED",
        block_reason: editStatus === "BLOCKED" ? blockReason : null,
        tier_bonus: editTier === "Platinum" ? 2 : editTier === "Gold" ? 1 : editTier === "Silver" ? 0.5 : 0,
      });
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
          <h1 className="text-2xl font-bold text-gray-900">Affiliates</h1>
          <p className="text-sm text-gray-500">{total} total</p>
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
          <div className="text-center py-16 text-gray-400 text-sm">No affiliates found</div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Affiliate Code", "Name", "Email", "Tier", "Sales", "Balance", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{a.affiliate_code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.display_name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${a.tier_name === "Platinum" ? "bg-purple-100 text-purple-700"
                        : a.tier_name === "Gold" ? "bg-yellow-100 text-yellow-700"
                        : a.tier_name === "Silver" ? "bg-gray-200 text-gray-700"
                        : "bg-orange-100 text-orange-700"}`}>{a.tier_name}</span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(a.total_sales)}</td>
                  <td className="px-4 py-3">{formatCurrency(a.available_balance)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(a.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
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

      {/* Detail/Edit Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.display_name}</h2>
                <p className="text-xs font-mono text-gray-500">{selected.affiliate_code}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>
            <div className="p-6 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[["Total Sales", formatCurrency(selected.total_sales)], ["Available Balance", formatCurrency(selected.available_balance)], ["Total Orders", selected.total_orders]].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{v}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{k}</div>
                  </div>
                ))}
              </div>

              {/* Edit Tier */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Tier</label>
                <div className="flex gap-2">
                  {TIERS.map((t) => (
                    <button key={t} onClick={() => setEditTier(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors
                        ${editTier === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Status */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
                  {["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {editStatus === "BLOCKED" && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Block Reason</label>
                  <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Reason for blocking..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleUpdate} disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  Save Changes
                </button>
                <button onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
