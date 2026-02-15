import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";

const BusinessPartnerInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/business-partner-inquiries`,
      );
      if (response.data.success) {
        setInquiries(response.data.inquiries);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      alert("Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/business-partner-inquiries/${id}/status`,
        { status: newStatus },
      );
      if (response.data.success) {
        // Update the local state
        setInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry,
          ),
        );
        alert("Status updated successfully");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/business-partner-inquiries/${id}`,
      );
      if (response.data.success) {
        setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== id));
        alert("Inquiry deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      alert("Failed to delete inquiry");
    }
  };

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesFilter =
      filter === "all" ||
      inquiry.status?.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      inquiry.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.phone?.includes(searchTerm) ||
      inquiry.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.state?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Partner Inquiries
          </h1>
          <p className="text-gray-600">
            Manage and respond to partnership inquiries
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone, city, or state..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partnership Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No inquiries found
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {inquiry.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {inquiry.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {inquiry.city}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {inquiry.partnership_type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {inquiry.message || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={inquiry.status || "Pending"}
                          onChange={(e) =>
                            handleStatusChange(inquiry.id, e.target.value)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            inquiry.status,
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayjs(inquiry.created_at).format("MMM DD, YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(inquiry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPartnerInquiries;
