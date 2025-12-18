// admin-deployed/src/Components/Enquiries/EnquiryDashboard.jsx
import { useState, useEffect } from 'react';
import { getAllEnquiries } from '../../api/adminEnquiryApi';
import { toast } from 'react-toastify';

const STATUS_COLORS = {
    OPEN: 'bg-blue-100 text-blue-800',
    NEGOTIATING: 'bg-yellow-100 text-yellow-800',
    LOCKED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    CLOSED: 'bg-red-100 text-red-800',
};

export default function EnquiryDashboard({ onViewEnquiry, onCreateBid }) {
    // Removed navigate - using callbacks instead
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        negotiating: 0,
        locked: 0,
        completed: 0,
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        fetchEnquiries();
    }, [filter, pagination.page]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const filters = {
                page: pagination.page,
                limit: pagination.limit,
            };

            if (filter !== 'all') {
                filters.status = filter;
            }

            const response = await getAllEnquiries(filters);

            if (response.success) {
                setEnquiries(response.enquiries || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages,
                }));

                // Calculate stats
                if (response.stats) {
                    setStats(response.stats);
                }
            }
        } catch (error) {
            toast.error('Failed to load enquiries');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleEnquiryClick = (enquiryId) => {
        const enquiry = enquiries.find(e => e.id === enquiryId);
        if (enquiry && onViewEnquiry) {
            onViewEnquiry(enquiry);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiry Management</h1>
                <p className="text-gray-600">Manage product enquiries and negotiate with customers</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Enquiries</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.total || 0}</div>
                </div>
                <div className="bg-blue-50 rounded-lg shadow p-6">
                    <div className="text-sm text-blue-600 mb-1">Open</div>
                    <div className="text-3xl font-bold text-blue-700">{stats.open || 0}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg shadow p-6">
                    <div className="text-sm text-yellow-600 mb-1">Negotiating</div>
                    <div className="text-3xl font-bold text-yellow-700">{stats.negotiating || 0}</div>
                </div>
                <div className="bg-purple-50 rounded-lg shadow p-6">
                    <div className="text-sm text-purple-600 mb-1">Locked</div>
                    <div className="text-3xl font-bold text-purple-700">{stats.locked || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow p-6">
                    <div className="text-sm text-green-600 mb-1">Completed</div>
                    <div className="text-3xl font-bold text-green-700">{stats.completed || 0}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-2">
                {['all', 'OPEN', 'NEGOTIATING', 'LOCKED', 'COMPLETED', 'EXPIRED', 'CLOSED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            setFilter(status);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status === 'all' ? 'All' : status}
                    </button>
                ))}
            </div>

            {/* Enquiries Table */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : enquiries.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries found</h3>
                    <p className="text-gray-600">
                        {filter === 'all'
                            ? 'No enquiries have been submitted yet'
                            : `No enquiries with status: ${filter}`}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Enquiry
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expected Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {enquiries.map((enquiry) => (
                                <tr
                                    key={enquiry.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleEnquiryClick(enquiry.id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">#{enquiry.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {enquiry.products?.image && (
                                                <img
                                                    src={enquiry.products.image}
                                                    alt={enquiry.products.name}
                                                    className="w-10 h-10 rounded object-cover mr-3"
                                                />
                                            )}
                                            <div className="text-sm text-gray-900">
                                                {enquiry.products?.name || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {enquiry.users?.name || enquiry.users?.email || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{enquiry.quantity}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {enquiry.expected_price ? `₹${enquiry.expected_price}` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[enquiry.status]}`}>
                                            {enquiry.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{formatDate(enquiry.created_at)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnquiryClick(enquiry.id);
                                            }}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
