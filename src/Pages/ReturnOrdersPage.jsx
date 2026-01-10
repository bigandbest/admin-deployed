import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiRefreshCcw, FiCheck, FiX, FiEye } from "react-icons/fi";

const ReturnOrdersPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://big-best-backend.vercel.app/api";

      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        toast.error("Admin not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/return-orders/admin/all`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.return_requests || []);
      } else {
        toast.error("Failed to fetch return requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Error loading return requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this request as ${newStatus}?`
      )
    )
      return;

    try {
      setUpdating(true);
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://big-best-backend.vercel.app/api";
      const adminToken = localStorage.getItem("admin_token");

      const response = await fetch(
        `${API_BASE_URL}/return-orders/admin/status/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            status: newStatus,
            admin_notes: `Status updated to ${newStatus} by admin`,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success(`Request marked as ${newStatus}`);
        fetchRequests(); // Refresh list
        setIsModalOpen(false);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Returns & Refunds</h1>
        <button
          onClick={fetchRequests}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <FiRefreshCcw
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            No return or cancellation requests found.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{String(request.order_id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {request.return_type === "cancellation" ? (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-bold">
                          Cancellation
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-bold">
                          Return
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                      {request.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.bank_account_number ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold">
                            {request.bank_name}
                          </span>
                          <span>{request.bank_account_number}</span>
                          <span className="text-gray-400">
                            {request.bank_ifsc_code}
                          </span>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : request.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : request.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(request.id, "approved")
                              }
                              className="text-green-600 hover:text-green-900"
                              title="Approve & Refund"
                            >
                              <FiCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(request.id, "rejected")
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {request.status === "approved" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(request.id, "completed")
                            }
                            className="bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded text-xs"
                          >
                            Mark Refunded
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Request Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Reason
                </label>
                <p className="text-gray-900">{selectedRequest.reason}</p>
              </div>
              {selectedRequest.additional_details && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Additional Details
                  </label>
                  <p className="text-gray-700">
                    {selectedRequest.additional_details}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg border">
                <h4 className="font-semibold text-sm mb-2">Bank Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="block text-xs text-gray-500">
                      Account Holder
                    </span>
                    <span className="font-medium">
                      {selectedRequest.bank_account_holder_name}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">
                      Bank Name
                    </span>
                    <span className="font-medium">
                      {selectedRequest.bank_name}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">
                      Account No.
                    </span>
                    <span className="font-medium">
                      {selectedRequest.bank_account_number}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">IFSC</span>
                    <span className="font-medium">
                      {selectedRequest.bank_ifsc_code}
                    </span>
                  </div>
                </div>
              </div>

              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Items</h4>
                  <div className="bg-gray-50 rounded p-2 text-sm">
                    {selectedRequest.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between py-1 border-b last:border-0"
                      >
                        <span>
                          Item ID: ...{String(item.order_item_id).slice(-6)}
                        </span>
                        <span className="font-medium">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    disabled={updating}
                    onClick={() =>
                      handleUpdateStatus(selectedRequest.id, "rejected")
                    }
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    disabled={updating}
                    onClick={() =>
                      handleUpdateStatus(selectedRequest.id, "approved")
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve & Refund
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnOrdersPage;
