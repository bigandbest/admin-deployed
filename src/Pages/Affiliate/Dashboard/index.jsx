import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, formatCurrency, statusColor } from "../../../utils/adminAffiliateApi";
import { Users, ShoppingBag, DollarSign, Clock, TrendingUp, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-2xl border border-red-100 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-red-700 font-medium">{error}</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700">Retry</button>
      </div>
    </div>
  );

  const stats = [
    { label: "Total Affiliates", value: data?.totalAffiliates || 0, icon: <Users className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", path: "/affiliate/affiliates" },
    { label: "Active Affiliates", value: data?.activeAffiliates || 0, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50", path: "/affiliate/affiliates?status=ACTIVE" },
    { label: "Pending Applications", value: data?.pendingApplications || 0, icon: <Clock className="w-5 h-5" />, color: "text-orange-600 bg-orange-50", path: "/affiliate/applications?status=PENDING" },
    { label: "Total Orders", value: data?.totalOrders || 0, icon: <ShoppingBag className="w-5 h-5" />, color: "text-violet-600 bg-violet-50", path: "/affiliate/orders" },
    { label: "Pending Commission", value: formatCurrency(data?.pendingCommissionAmount || 0), icon: <DollarSign className="w-5 h-5" />, color: "text-yellow-600 bg-yellow-50", path: "/affiliate/payouts?status=PENDING" },
    { label: "Pending Payouts", value: data?.pendingPayouts || 0, icon: <DollarSign className="w-5 h-5" />, color: "text-pink-600 bg-pink-50", path: "/affiliate/payouts?status=PENDING" },
  ];

  const quickLinks = [
    { label: "Review Applications", path: "/affiliate/applications", badge: data?.pendingApplications, color: "bg-orange-500" },
    { label: "Manage Commission Rates", path: "/affiliate/commission-rates" },
    { label: "Process Payouts", path: "/affiliate/payouts", badge: data?.pendingPayouts, color: "bg-red-500" },
    { label: "Program Settings", path: "/affiliate/config" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview and management</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-xl mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="space-y-2">
          {quickLinks.map((q) => (
            <button key={q.label} onClick={() => navigate(q.path)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <span className="text-sm font-medium text-gray-700">{q.label}</span>
              <div className="flex items-center gap-2">
                {q.badge > 0 && (
                  <span className={`${q.color} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{q.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
