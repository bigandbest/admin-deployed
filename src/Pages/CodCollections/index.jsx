import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaEye, FaBoxOpen } from 'react-icons/fa';
import api from '../../utils/api';

const CodCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/cod-collections');
      if (response.data?.success) {
        setCollections(response.data.data);
      } else {
        setError(response.data?.error || 'Failed to fetch collections');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this deposit?')) return;
    try {
      const response = await api.post(`/admin/cod-collections/${id}/approve`);
      if (response.data?.success) {
        alert('Deposit Approved');
        fetchCollections();
      } else {
        alert(response.data?.error || 'Failed to approve');
      }
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      const response = await api.post(`/admin/cod-collections/${id}/reject`, { params: { reason } });
      if (response.data?.success) {
        alert('Deposit Rejected');
        fetchCollections();
      } else {
        alert(response.data?.error || 'Failed to reject');
      }
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
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
          <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>
        <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
          {selectedProof ? (
            <img src={selectedProof} alt="Proof" className="max-w-full max-h-[70vh] object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <FaEye size={48} className="mb-2 opacity-50" />
              <p>No proof image available</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => setShowModal(false)} className="bg-gray-200 px-4 py-2 rounded text-gray-700 font-semibold hover:bg-gray-300">Close</button>
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

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          <FaMoneyBillWave size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No pending COD deposits to review.</p>
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
                    <div className="font-semibold text-gray-900">{item.riders?.users?.name || 'Unknown Rider'}</div>
                    <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-indigo-600 font-medium">
                      <FaBoxOpen className="mr-2" /> #{item.order_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-700">
                    ₹{item.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => { setSelectedProof(item.payment_proof); setShowModal(true); }}
                      className="text-blue-500 hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1 rounded"
                    >
                      <FaEye className="mr-1" /> View
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(item.id)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded flex items-center">
                          <FaCheckCircle className="mr-1" /> Approve
                        </button>
                        <button onClick={() => handleReject(item.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded flex items-center">
                          <FaTimesCircle className="mr-1" /> Reject
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

      {showModal && <ProofModal />}
    </div>
  );
};

export default CodCollections;
