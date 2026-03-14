import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaBoxOpen, FaBell, FaEnvelope, FaExclamationCircle } from 'react-icons/fa';

// Use same config as other services
const RAW_API_BASE = import.meta.env.VITE_API_URL || 'https://big-best-backend.vercel.app/api';
const API_BASE_URL = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : RAW_API_BASE.replace(/\/+$/, '') + '/api';

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
        const res = await axios.get(`${API_BASE_URL}/out-of-stock/enquiries`, {
          withCredentials: true,
        });
        if (res.data.success) setEnquiries(res.data.enquiries);
      } else {
        const res = await axios.get(`${API_BASE_URL}/out-of-stock/notify-requests`, {
          withCredentials: true,
        });
        if (res.data.success) setNotifyRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Out of Stock Management</h1>
        <p className="text-gray-600 mt-2">
          View customer enquiries and notification requests for out-of-stock products
        </p>
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
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
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
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {notifyRequests.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <span className="inline-block w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4"></span>
              <p>Loading data...</p>
            </div>
          ) : activeTab === 'enquiries' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">Need By</th>
                    <th className="p-4 font-semibold max-w-[300px]">Enquiry Details</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        <FaBoxOpen className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p>No out-of-stock enquiries found.</p>
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                          {format(new Date(enq.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 line-clamp-2">
                            {enq.products?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">ID: {enq.product_id}</p>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {enq.delivery_timeline ? format(new Date(enq.delivery_timeline), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="p-4 max-w-[300px]">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                            {enq.message}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {enq.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                    <th className="p-4 font-semibold">Requested On</th>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">User Details</th>
                    <th className="p-4 font-semibold">Notification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifyRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">
                        <FaBell className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p>No notify requests found.</p>
                      </td>
                    </tr>
                  ) : (
                    notifyRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                          {format(new Date(req.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 line-clamp-2">
                            {req.products?.name || 'Unknown Product'}
                          </p>
                        </td>
                        <td className="p-4 text-sm">
                          <p className="font-medium text-gray-900">{req.users?.name || 'N/A'}</p>
                          <p className="text-gray-500">{req.users?.email}</p>
                          <p className="text-gray-400 text-xs">{req.users?.phone}</p>
                        </td>
                        <td className="p-4">
                          {req.notified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              Notified on {format(new Date(req.notified_at), 'MMM dd')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                              Waiting for Stock
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
