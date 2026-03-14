import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FaBoxOpen, FaBell, FaEnvelope, FaUser, FaPhone, FaAt, 
  FaCalendarAlt, FaRegClock
} from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';
import api from '../../utils/api';

const StatusBadge = ({ status }) => {
  const colors = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-100',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    RESOLVED: 'bg-green-50 text-green-700 border-green-100',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.OPEN}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'OPEN' ? 'bg-blue-500 animate-pulse' : status === 'RESOLVED' ? 'bg-green-500' : 'bg-yellow-500'}`} />
      {status || 'OPEN'}
    </span>
  );
};

const UserBadge = ({ user }) => {
  if (!user) return <span className="text-gray-400 text-sm italic">Guest / Unknown</span>;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <FaUser className="text-gray-400 text-xs shrink-0" />
        <span className="font-medium text-gray-900 text-sm">{user.name || 'N/A'}</span>
      </div>
      {user.email && (
        <div className="flex items-center gap-1.5">
          <FaAt className="text-gray-400 text-xs shrink-0" />
          <span className="text-gray-500 text-xs">{user.email}</span>
        </div>
      )}
      {user.phone && (
        <div className="flex items-center gap-1.5">
          <FaPhone className="text-gray-400 text-xs shrink-0" />
          <span className="text-gray-500 text-xs">{user.phone}</span>
        </div>
      )}
    </div>
  );
};

export default function OutOfStockEnquiries() {
  const [activeTab, setActiveTab] = useState('enquiries');
  const [enquiries, setEnquiries] = useState([]);
  const [notifyRequests, setNotifyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'enquiries') {
        const res = await api.get('/out-of-stock/enquiries', { withCredentials: true });
        if (res.data.success) setEnquiries(res.data.enquiries);
      } else {
        const res = await api.get('/out-of-stock/notify-requests', { withCredentials: true });
        if (res.data.success) setNotifyRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const safeDate = (d) => {
    try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return '-'; }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Out of Stock Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            View customer enquiries and notification requests for out-of-stock products
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <MdRefresh className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FaEnvelope className="text-orange-500 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enquiries.length}</p>
              <p className="text-sm text-gray-500">Total Enquiries</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FaBell className="text-blue-500 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{notifyRequests.length}</p>
              <p className="text-sm text-gray-500">Notify Requests</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'enquiries'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaEnvelope /> Product Enquiries
            <span className="ml-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {enquiries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notify')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'notify'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaBell /> Notify Requests
            <span className="ml-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {notifyRequests.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <span className="inline-block w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4 block mx-auto" />
              <p>Loading data...</p>
            </div>
          ) : activeTab === 'enquiries' ? (
            /* --- ENQUIRIES TABLE --- */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="p-4">Date</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Need By</th>
                    <th className="p-4 max-w-[260px]">Message</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-gray-400">
                        <FaBoxOpen className="mx-auto text-4xl text-gray-200 mb-3" />
                        <p className="font-medium">No enquiries found</p>
                        <p className="text-xs mt-1">Out-of-stock enquiries will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-orange-50/30 transition-colors">
                        {/* Date */}
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FaRegClock className="text-xs text-gray-400" />
                            {safeDate(enq.created_at)}
                          </div>
                        </td>

                        {/* Product */}
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 text-sm max-w-[160px] truncate">
                            {enq.products?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[140px]">
                            {enq.product_id?.slice(0, 8)}...
                          </p>
                        </td>

                        {/* Customer — NEW column */}
                        <td className="p-4">
                          <UserBadge user={enq.users} />
                        </td>

                        {/* Need By */}
                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                          {enq.delivery_timeline ? (
                            <div className="flex items-center gap-1.5">
                              <FaCalendarAlt className="text-xs text-orange-400" />
                              {safeDate(enq.delivery_timeline)}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Message */}
                        <td className="p-4 max-w-[260px]">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                            {enq.message || '—'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <StatusBadge status={enq.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* --- NOTIFY REQUESTS TABLE --- */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="p-4">Requested On</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Notification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {notifyRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-400">
                        <FaBell className="mx-auto text-4xl text-gray-200 mb-3" />
                        <p className="font-medium">No notify requests found</p>
                        <p className="text-xs mt-1">Requests will appear when users click "Notify Me"</p>
                      </td>
                    </tr>
                  ) : (
                    notifyRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FaRegClock className="text-xs text-gray-400" />
                            {safeDate(req.created_at)}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 text-sm max-w-[180px] truncate">
                            {req.products?.name || 'Unknown Product'}
                          </p>
                        </td>
                        <td className="p-4">
                          <UserBadge user={req.users} />
                        </td>
                        <td className="p-4">
                          {req.notified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Notified — {safeDate(req.notified_at)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Waiting for Restock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
