// src/Pages/WalletManagement/index.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getAllWallets,
  formatCurrency,
  getStatusColor,
  manualCreditWallet,
  manualDebitWallet,
  freezeWallet,
  unfreezeWallet,
  getUserWalletDetails,
} from "../../utils/adminWalletApi";

const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, [currentPage, searchTerm, statusFilter, fetchWallets]);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllWallets(
        currentPage,
        20,
        searchTerm,
        statusFilter
      );

      if (response.success) {
        setWallets(response.wallets);
        setPagination(response.pagination);
      } else {
        setError(response.error || "Failed to fetch wallets");
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError(err.message || "Failed to fetch wallets");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const openDetailsModal = async (wallet) => {
    try {
      setSelectedWallet(wallet);
      setShowDetailsModal(true);

      // Fetch detailed wallet information
      const response = await getUserWalletDetails(wallet.users.id);
      if (response.success) {
        setSelectedWallet(response.wallet);
      }
    } catch (err) {
      console.error("Error fetching wallet details:", err);
    }
  };

  const openActionModal = (wallet, action) => {
    setSelectedWallet(wallet);
    setActionType(action);
    setActionAmount("");
    setActionReason("");
    setNotifyUser(true);
    setShowActionModal(true);
  };

  const handleWalletAction = async () => {
    if (!selectedWallet || !actionReason.trim()) {
      alert("Please provide a reason for this action");
      return;
    }

    if (
      (actionType === "credit" || actionType === "debit") &&
      (!actionAmount || parseFloat(actionAmount) <= 0)
    ) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setProcessing(true);
      let response;

      switch (actionType) {
        case "credit":
          response = await manualCreditWallet(
            selectedWallet.users.id,
            actionAmount,
            actionReason,
            notifyUser
          );
          break;
        case "debit":
          response = await manualDebitWallet(
            selectedWallet.users.id,
            actionAmount,
            actionReason,
            notifyUser
          );
          break;
        case "freeze":
          response = await freezeWallet(
            selectedWallet.users.id,
            actionReason,
            notifyUser
          );
          break;
        case "unfreeze":
          response = await unfreezeWallet(
            selectedWallet.users.id,
            actionReason,
            notifyUser
          );
          break;
        default:
          throw new Error("Invalid action type");
      }

      if (response.success) {
        alert(`Wallet ${actionType} successful!`);
        setShowActionModal(false);
        fetchWallets(); // Refresh the list
      } else {
        throw new Error(response.error || "Action failed");
      }
    } catch (err) {
      console.error(`Error performing wallet ${actionType}:`, err);
      alert(`Failed to ${actionType} wallet: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      credit: "Credit Wallet",
      debit: "Debit Wallet",
      freeze: "Freeze Wallet",
      unfreeze: "Unfreeze Wallet",
    };
    return labels[action] || action;
  };

  if (loading && wallets.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && wallets.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">
                Error Loading Wallets
              </h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={fetchWallets}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          💳 Wallet Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage user wallets, balances, and transactions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, email, or phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Wallets</option>
              <option value="active">Active Wallets</option>
              <option value="frozen">Frozen Wallets</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchWallets}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {wallet.users?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {wallet.users?.email || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {wallet.users?.phone || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(parseFloat(wallet.balance || 0))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        wallet.is_frozen
                          ? getStatusColor("frozen")
                          : getStatusColor("active")
                      }`}
                    >
                      {wallet.is_frozen ? "Frozen" : "Active"}
                    </span>
                    {wallet.is_frozen && wallet.frozen_reason && (
                      <div className="text-xs text-gray-500 mt-1">
                        {wallet.frozen_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(wallet.updated_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailsModal(wallet)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openActionModal(wallet, "credit")}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Credit
                      </button>
                      <button
                        onClick={() => openActionModal(wallet, "debit")}
                        className="text-orange-600 hover:text-orange-800 text-sm"
                      >
                        Debit
                      </button>
                      {wallet.is_frozen ? (
                        <button
                          onClick={() => openActionModal(wallet, "unfreeze")}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Unfreeze
                        </button>
                      ) : (
                        <button
                          onClick={() => openActionModal(wallet, "freeze")}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Freeze
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages}(
                {pagination.total} total wallets)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                  }
                  disabled={currentPage >= pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Details Modal */}
      {showDetailsModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Wallet Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedWallet.users?.name || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedWallet.users?.email || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedWallet.users?.phone || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span>{" "}
                    {selectedWallet.users?.created_at
                      ? new Date(
                          selectedWallet.users.created_at
                        ).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Wallet Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Balance:</span>{" "}
                    {formatCurrency(parseFloat(selectedWallet.balance || 0))}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span
                      className={`ml-1 px-2 py-1 text-xs rounded-full ${
                        selectedWallet.is_frozen
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedWallet.is_frozen ? "Frozen" : "Active"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(selectedWallet.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(selectedWallet.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {selectedWallet.is_frozen && (
                  <div className="mt-3 p-3 bg-red-50 rounded border">
                    <span className="font-medium text-red-800">
                      Frozen Reason:
                    </span>
                    <p className="text-red-700 text-sm mt-1">
                      {selectedWallet.frozen_reason}
                    </p>
                    {selectedWallet.frozen_at && (
                      <p className="text-red-600 text-xs mt-1">
                        Frozen on:{" "}
                        {new Date(
                          selectedWallet.frozen_at
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {getActionLabel(actionType)}
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    User: <strong>{selectedWallet.users?.name}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Current Balance:{" "}
                    <strong>
                      {formatCurrency(parseFloat(selectedWallet.balance || 0))}
                    </strong>
                  </p>
                </div>

                {(actionType === "credit" || actionType === "debit") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Provide a reason for this action..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="notify-user"
                    type="checkbox"
                    checked={notifyUser}
                    onChange={(e) => setNotifyUser(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="notify-user"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Notify user about this action
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowActionModal(false)}
                  disabled={processing}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWalletAction}
                  disabled={
                    processing ||
                    !actionReason.trim() ||
                    ((actionType === "credit" || actionType === "debit") &&
                      !actionAmount)
                  }
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? "Processing..." : getActionLabel(actionType)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;
