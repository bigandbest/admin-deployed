import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const SellerPincodeRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'PENDING', 'APPROVED', 'REJECTED'

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = `${API_BASE_URL}/admin/sellers/pincode-requests`;
            if (filterStatus !== 'all') {
                url += `?status=${filterStatus}`;
            }
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            if (response.data.success) {
                setRequests(response.data.data || []);
            } else {
                setError(response.data.error || "Failed to fetch requests");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const handleApprove = async (id) => {
        if (!window.confirm("Approve this pincode request?")) return;
        try {
            const resp = await axios.post(`${API_BASE_URL}/admin/sellers/pincode-requests/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (resp.data.success) {
                alert("Request approved.");
                fetchRequests();
            } else {
                alert(resp.data.error || "Failed to approve");
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error approving request");
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Reject this pincode request?")) return;
        try {
            const resp = await axios.post(`${API_BASE_URL}/admin/sellers/pincode-requests/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (resp.data.success) {
                alert("Request rejected.");
                fetchRequests();
            } else {
                alert(resp.data.error || "Failed to reject");
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error rejecting request");
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="p-6">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pincode Requests</h1>
                    <p className="text-sm text-gray-600">Review seller warehouse and pincode modifications</p>
                </div>
                <div className="flex bg-white rounded-lg shadow border overflow-hidden">
                    {["all", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 text-sm font-medium ${filterStatus === status
                                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {status.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {requests.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                    No matching pincode requests found.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Pincodes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(req.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{req.seller.business_name || req.seller.name || "N/A"}</div>
                                        <div className="text-xs text-gray-500">{req.seller.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                        {req.warehouse?.name || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {req.pincodes.split(',').length} Pincodes
                                        <div className="text-xs font-mono mt-1 w-48 truncate" title={req.pincodes}>{req.pincodes}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === "APPROVED"
                                                ? "bg-green-100 text-green-800"
                                                : req.status === "REJECTED"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status === "PENDING" && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SellerPincodeRequests;
