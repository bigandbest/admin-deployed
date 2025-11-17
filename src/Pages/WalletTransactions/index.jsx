// src/Pages/WalletTransactions/index.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getWalletTransactionsAdmin,
  getWalletAuditLogs,
  formatCurrency,
  getTransactionTypeColor,
  exportWalletTransactions,
} from "../../utils/adminWalletApi";

const WalletTransactions = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: "",
    type: "",
    status: "",
    startDate: "",
    endDate: "",
    searchTerm: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, currentPage, filters, fetchTransactions, fetchAuditLogs]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWalletTransactionsAdmin(
        currentPage,
        20,
        filters.userId,
        filters.type,
        filters.status,
        filters.startDate,
        filters.endDate
      );

      if (response.success) {
        setTransactions(response.transactions);
        setPagination(response.pagination);
      } else {
        setError(response.error || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWalletAuditLogs(
        currentPage,
        20,
        filters.userId,
        filters.searchTerm
      );

      if (response.success) {
        setAuditLogs(response.logs);
        setPagination(response.pagination);
      } else {
        setError(response.error || "Failed to fetch audit logs");
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      type: "",
      status: "",
      startDate: "",
      endDate: "",
      searchTerm: "",
    });
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await exportWalletTransactions(
        filters.userId,
        filters.type,
        filters.status,
        filters.startDate,
        filters.endDate
      );

      if (response.success) {
        // Create and download CSV file
        const blob = new Blob([response.csvData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wallet-transactions-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error || "Export failed");
      }
    } catch (err) {
      console.error("Error exporting transactions:", err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const renderTransactionType = (transaction) => {
    const typeIcons = {
      topup: "💰",
      spend: "🛒",
      refund: "↩️",
      admin_credit: "➕",
      admin_debit: "➖",
    };

    const typeLabels = {
      topup: "Top-up",
      spend: "Purchase",
      refund: "Refund",
      admin_credit: "Admin Credit",
      admin_debit: "Admin Debit",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(
          transaction.type
        )}`}
      >
        {typeIcons[transaction.type] || "💳"}{" "}
        {typeLabels[transaction.type] || transaction.type}
      </span>
    );
  };

  const renderAmount = (transaction) => {
    const isCredit = ["topup", "refund", "admin_credit"].includes(
      transaction.type
    );
    return (
      <span
        className={
          isCredit
            ? "text-green-600 font-semibold"
            : "text-red-600 font-semibold"
        }
      >
        {isCredit ? "+" : "-"}
        {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
      </span>
    );
  };

  if (loading && transactions.length === 0 && auditLogs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          📊 Wallet Transactions
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage wallet transactions and audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "audit"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Audit Logs
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === "transactions" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="topup">Top-up</option>
                  <option value="spend">Purchase</option>
                  <option value="refund">Refund</option>
                  <option value="admin_credit">Admin Credit</option>
                  <option value="admin_debit">Admin Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) =>
                    handleFilterChange("searchTerm", e.target.value)
                  }
                  placeholder="Search audit logs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {activeTab === "transactions" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Clear Filters
          </button>
          {activeTab === "transactions" && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {exporting ? "Exporting..." : "📥 Export CSV"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "transactions" ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {transaction.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.wallets?.users?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.wallets?.users?.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderTransactionType(transaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderAmount(transaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : transaction.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description && (
                        <div
                          className="max-w-xs truncate"
                          title={transaction.description}
                        >
                          {transaction.description}
                        </div>
                      )}
                      {transaction.metadata && (
                        <div className="text-xs text-gray-400 mt-1">
                          {transaction.type === "topup" &&
                            transaction.metadata.payment_id && (
                              <span>
                                Payment: {transaction.metadata.payment_id}
                              </span>
                            )}
                          {transaction.type === "spend" &&
                            transaction.metadata.order_id && (
                              <span>
                                Order: {transaction.metadata.order_id}
                              </span>
                            )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Log ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {log.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.wallets?.users?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.wallets?.users?.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.admin_user_id || "System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details && (
                        <div className="max-w-xs">
                          <div className="font-medium">
                            {log.details.reason}
                          </div>
                          {log.details.old_values && (
                            <div className="text-xs text-gray-400 mt-1">
                              Old: {JSON.stringify(log.details.old_values)}
                            </div>
                          )}
                          {log.details.new_values && (
                            <div className="text-xs text-gray-400 mt-1">
                              New: {JSON.stringify(log.details.new_values)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages}(
                {pagination.total} total records)
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

      {/* Empty State */}
      {!loading &&
        ((activeTab === "transactions" && transactions.length === 0) ||
          (activeTab === "audit" && auditLogs.length === 0)) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === "transactions" ? "transactions" : "audit logs"}{" "}
              found
            </h3>
            <p className="text-gray-500">
              {activeTab === "transactions"
                ? "No wallet transactions match your current filters."
                : "No audit logs match your current filters."}
            </p>
          </div>
        )}
    </div>
  );
};

export default WalletTransactions;
