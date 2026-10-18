import { useState, useEffect } from "react";
import { listApplications, getApplication, approveApplication, rejectApplication, statusColor } from "../../../utils/adminAffiliateApi";
import { Eye, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const STATUSES = ["", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];

export default function AffiliateApplications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listApplications(page, limit, statusFilter);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openDetail = async (id) => {
    try {
      const res = await getApplication(id);
      setSelectedApp(res.data);
      setModalOpen(true);
    } catch (e) { alert(e.message); }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveApplication(id);
      setModalOpen(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { alert("Please enter a rejection reason"); return; }
    setActionLoading(true);
    try {
      await rejectApplication(id, { rejection_reason: rejectReason });
      setRejectModal(false);
      setModalOpen(false);
      setRejectReason("");
      load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Applications</h1>
          <p className="text-sm text-gray-500">{total} total applications</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No applications found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Platform", "Audience", "Status", "Submitted", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{app.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{app.email}</td>
                  <td className="px-4 py-3 text-gray-600">{app.primary_platform}</td>
                  <td className="px-4 py-3 text-gray-600">{app.estimated_audience?.toLocaleString() || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(app.status)}`}>{app.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(app.submitted_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(app.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

      {/* Detail Modal */}
      {modalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">Application Detail</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selectedApp.status)}`}>{selectedApp.status}</span>
            </div>
            <div className="p-6 space-y-5">
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Personal Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[["Name", selectedApp.full_name], ["Email", selectedApp.email], ["Phone", selectedApp.phone],
                    ["PAN", selectedApp.pan_number || "—"]].map(([k, v]) => (
                    <div key={k}><span className="text-gray-500">{k}: </span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Platform</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[["Primary", selectedApp.primary_platform], ["Audience", selectedApp.estimated_audience?.toLocaleString() || "—"],
                    ["Website", selectedApp.website_url || "—"], ["Instagram", selectedApp.instagram_handle || "—"],
                    ["YouTube", selectedApp.youtube_channel || "—"]].map(([k, v]) => (
                    <div key={k}><span className="text-gray-500">{k}: </span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Promotion Strategy</h3>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selectedApp.promotion_strategy}</p>
              </section>
              {selectedApp.payment_method === "BANK_TRANSFER" ? (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[["Bank", selectedApp.bank_name || "—"], ["Account", selectedApp.bank_account_number || "—"],
                      ["IFSC", selectedApp.bank_ifsc_code || "—"], ["Holder", selectedApp.account_holder_name || "—"]].map(([k, v]) => (
                      <div key={k}><span className="text-gray-500">{k}: </span><span className="font-medium">{v}</span></div>
                    ))}
                  </div>
                </section>
              ) : (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">UPI</h3>
                  <p className="text-sm font-medium">{selectedApp.upi_id || "—"}</p>
                </section>
              )}
              {selectedApp.rejection_reason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
                  <strong>Rejection Reason:</strong> {selectedApp.rejection_reason}
                </div>
              )}
            </div>
            {selectedApp.status === "PENDING" && (
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => handleApprove(selectedApp.id)} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setRejectModal(true)} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => setModalOpen(false)} className="ml-auto text-sm text-gray-500 hover:text-gray-700">Close</button>
              </div>
            )}
            {selectedApp.status !== "PENDING" && (
              <div className="p-6 border-t border-gray-100">
                <button onClick={() => setModalOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Reject Application</h2>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (will be shown to applicant)..."
              className="w-full h-28 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
            <div className="flex gap-3">
              <button onClick={() => handleReject(selectedApp.id)} disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                Confirm Reject
              </button>
              <button onClick={() => { setRejectModal(false); setRejectReason(""); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
