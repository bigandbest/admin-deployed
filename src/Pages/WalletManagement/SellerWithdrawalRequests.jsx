import React, { useState, useEffect } from 'react';
import { formatCurrency, getStatusColor } from "../../utils/adminWalletApi";
import { formatEmail } from "../../utils/formatEmail";

const SellerWithdrawalRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const url = statusFilter
                ? `${import.meta.env.VITE_API_BASE_URL}/admin/sellers/withdrawals?status=${statusFilter}`
                : `${import.meta.env.VITE_API_BASE_URL}/admin/sellers/withdrawals`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setRequests(data.data);
            } else {
                setError(data.error || "Failed to fetch requests");
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError(err.message || "Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handleAction = async (id, status) => {
        try {
            if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;

            setProcessing(true);
            const token = localStorage.getItem('admin_token');
            const adminNotes = prompt("Enter any admin notes (optional):", "");

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/sellers/withdrawals/${id}/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, adminNotes })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Withdrawal marked as ${status}`);
                fetchRequests();
            } else {
                alert(data.error || "Action failed");
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">💳 Seller Withdrawal Requests</h1>
                <p className="text-gray-600 mt-1">Review and process seller wallet withdrawals</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 flex space-x-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && requests.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">No requests found.</td></tr>
                        ) : (
                            requests.map((req) => {
                                const seller = req.user?.sellers?.[0] || {};
                                return (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{seller.business_name || req.user?.name}</div>
                                            <div className="text-sm text-gray-500">{formatEmail(req.user?.email) || req.user?.phone || "—"}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {formatCurrency(parseFloat(req.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {seller.bank_name ? (
                                                <>
                                                    <div><span className="font-semibold">Bank:</span> {seller.bank_name}</div>
                                                    <div><span className="font-semibold">Acct:</span> {seller.bank_account_no}</div>
                                                    <div><span className="font-semibold">IFSC:</span> {seller.bank_ifsc}</div>
                                                </>
                                            ) : (
                                                <span className="text-red-500">Not Provided</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                req.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'PENDING' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        disabled={processing}
                                                        onClick={() => handleAction(req.id, 'COMPLETED')}
                                                        className="text-green-600 hover:text-green-800 font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        disabled={processing}
                                                        onClick={() => handleAction(req.id, 'FAILED')}
                                                        className="text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SellerWithdrawalRequests;
