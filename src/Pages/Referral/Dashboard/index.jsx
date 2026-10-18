// src/Pages/Referral/Dashboard/index.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getAnalytics, formatCurrency, getStatusBadge } from "../../../utils/adminReferralApi";
import { Users, TrendingUp, Gift, Clock, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

export default function ReferralDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [dashRes, analyticsRes] = await Promise.allSettled([getDashboard(), getAnalytics()]);
      if (dashRes.status === "fulfilled") setData(dashRes.value.dashboard);
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.analytics);
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
    { label: "Total Enrolled Users", value: data?.total_users?.toLocaleString() || "0", icon: <Users className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", path: "/referral/users" },
    { label: "Total Referral Transactions", value: data?.total_transactions?.toLocaleString() || "0", icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50", path: "/referral/transactions" },
    { label: "Total Rewards Credited", value: formatCurrency(data?.total_rewards_credited || 0), icon: <Gift className="w-5 h-5" />, color: "text-violet-600 bg-violet-50", path: "/referral/rewards" },
    { label: "Pending Withdrawals", value: data?.pending_withdrawals || "0", icon: <Clock className="w-5 h-5" />, color: "text-orange-600 bg-orange-50", path: "/referral/withdrawals" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refer & Earn</h1>
          <p className="text-sm text-gray-500 mt-0.5">Program overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/referral/config")}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Settings
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <button key={i} onClick={() => navigate(s.path)}
            className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-gray-200 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              {s.label}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </button>
        ))}
      </div>

      {/* Month Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.completed_this_month}</p>
            <p className="text-sm text-gray-500 mt-1">Successful conversions</p>
            {data.growth_rate !== null && (
              <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-full ${parseFloat(data.growth_rate) >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {parseFloat(data.growth_rate) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(data.growth_rate))}% vs last month
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Withdrawn</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(data.total_withdrawn || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">of {formatCurrency(data.total_rewards_credited || 0)} credited</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.completed_last_month}</p>
            <p className="text-sm text-gray-500 mt-1">Successful conversions</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Breakdown */}
        {analytics?.status_breakdown?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Transaction Status</h2>
            <div className="space-y-2">
              {analytics.status_breakdown.map(item => (
                <div key={item.status} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(item.status)}`}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">{item._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Referrers */}
        {analytics?.top_referrers?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Top Referrers</h2>
              <button onClick={() => navigate("/referral/users")} className="text-xs text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {analytics.top_referrers.map((r, idx) => (
                <div key={r.user_id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-mono font-bold text-gray-900">{r.referral_code}</p>
                      <p className="text-xs text-gray-400">{r.successful_referrals} successful</p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-700 text-sm">{formatCurrency(r.total_earnings)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {data?.recent_transactions?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Referrals</h2>
            <button onClick={() => navigate("/referral/transactions")} className="text-xs text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Referee", "Code Used", "Status", "Reward", "Date"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{tx.referee_name || "—"}</td>
                    <td className="px-5 py-3 font-mono text-gray-700">{tx.referral_code_used}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(tx.status)}`}>
                        {tx.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-emerald-700 font-medium">
                      {tx.referrer_reward_amount ? formatCurrency(tx.referrer_reward_amount) : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Users", path: "/referral/users" },
          { label: "Transactions", path: "/referral/transactions" },
          { label: "Rewards", path: "/referral/rewards" },
          { label: "Withdrawals", path: "/referral/withdrawals" },
          { label: "Fraud Logs", path: "/referral/fraud-logs" },
          { label: "Settings", path: "/referral/config" },
        ].map(link => (
          <button key={link.path} onClick={() => navigate(link.path)}
            className="py-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
}
