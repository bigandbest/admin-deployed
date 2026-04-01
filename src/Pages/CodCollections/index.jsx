import { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaEye, FaBoxOpen } from 'react-icons/fa';
import api from '../../utils/api';

const CodCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('PENDING_DEPOSIT');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCollections();
  }, [filter, page]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/cod-collections', {
        params: { status: filter, page, limit: 10 }
      });
      if (response.data?.success) {
        setCollections(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setError(response.data?.error || 'Failed to fetch collections');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCollection) return;
    setProcessing(true);
    try {
      const response = await api.post(`/admin/cod-collections/${selectedCollection.id}/approve`, {
        notes: approvalNotes
      });
      if (response.data?.success) {
        alert('Deposit Approved\n' + response.data.message);
        setShowActionModal(false);
        setApprovalNotes('');
        fetchCollections();
      } else {
        alert(response.data?.error || 'Failed to approve');
      }
    } catch (err) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCollection || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      const response = await api.post(`/admin/cod-collections/${selectedCollection.id}/reject`, {
        reason: rejectionReason
      });
      if (response.data?.success) {
        alert('Deposit Rejected\n' + response.data.message);
        setShowActionModal(false);
        setRejectionReason('');
        fetchCollections();
      } else {
        alert(response.data?.error || 'Failed to reject');
      }
    } catch (err) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (collection, type) => {
    setSelectedCollection(collection);
    setActionType(type);
    setRejectionReason('');
    setApprovalNotes('');
    setShowActionModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_DEPOSIT': return 'bg-yellow-100 text-yellow-800';
      case 'DEPOSIT_CLAIMED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Proof Viewer Modal
  const ProofModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment Proof</h2>
          <button onClick={() => setShowProofModal(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>
        <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
          {selectedProof && selectedProof.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <img src={selectedProof} alt="Proof" className="max-w-full max-h-[70vh] object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <FaEye size={48} className="mb-2 opacity-50" />
              <p>{selectedProof ? 'View Proof →' : 'No proof available'}</p>
              {selectedProof && !selectedProof.match(/\.(jpg|jpeg|png|gif)$/i) && (
                <a href={selectedProof} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2">
                  Open Link
                </a>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => setShowProofModal(false)} className="bg-gray-200 px-4 py-2 rounded text-gray-700 font-semibold hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );

  // Action Modal
  const ActionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">
          {actionType === 'approve' ? 'Approve COD Deposit' : 'Reject COD Deposit'}
        </h2>

        {selectedCollection && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Rider</p>
            <p className="font-semibold text-gray-900">{selectedCollection.rider_name}</p>
            <p className="text-sm text-gray-600 mt-2">Amount</p>
            <p className="font-bold text-green-700">₹{Number(selectedCollection.amount_collected).toFixed(2)}</p>
          </div>
        )}

        {actionType === 'approve' && (
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add approval notes (optional)..."
            className="w-full p-3 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
          />
        )}

        {actionType === 'reject' && (
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain rejection reason (required)..."
            className="w-full p-3 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows="3"
            required
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowActionModal(false)}
            disabled={processing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={actionType === 'approve' ? handleApprove : handleReject}
            disabled={processing || (actionType === 'reject' && !rejectionReason.trim())}
            className={`flex-1 px-4 py-2 text-white rounded flex items-center justify-center gap-2 disabled:opacity-50 ${
              actionType === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {processing ? '...' : actionType === 'approve' ? '✓ Approve' : '✕ Reject'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💸 COD Deposits</h1>
        <p className="text-gray-600">Review and approve rider COD cash submissions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['PENDING_DEPOSIT', 'DEPOSIT_CLAIMED', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status === 'PENDING_DEPOSIT' ? 'Pending Proof' : status === 'DEPOSIT_CLAIMED' ? 'Proof Submitted' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          <FaMoneyBillWave size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No COD deposits in this category.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider / Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collections.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{item.rider_name}</div>
                    <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-indigo-600 font-medium">
                      <FaBoxOpen className="mr-2" /> #{item.order_id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-700">
                    ₹{Number(item.amount_collected).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.payment_proof ? (
                      <button
                        onClick={() => { setSelectedProof(item.payment_proof); setShowProofModal(true); }}
                        className="text-blue-500 hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1 rounded"
                      >
                        <FaEye className="mr-1" /> View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No proof</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {['PENDING_DEPOSIT', 'DEPOSIT_CLAIMED'].includes(item.status) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openActionModal(item, 'approve')}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded flex items-center"
                        >
                          <FaCheckCircle className="mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => openActionModal(item, 'reject')}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded flex items-center"
                        >
                          <FaTimesCircle className="mr-1" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showProofModal && <ProofModal />}
      {showActionModal && <ActionModal />}
    </div>
  );
};

export default CodCollections;
