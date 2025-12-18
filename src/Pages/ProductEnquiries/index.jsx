// Pages/ProductEnquiries/index.jsx
import { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import EnquiryDashboard from '../../Components/Enquiries/EnquiryDashboard';
import CreateBidForm from '../../Components/Enquiries/CreateBidForm';
import AdminEnquiryChat from '../../Components/Enquiries/AdminEnquiryChat';

export default function ProductEnquiriesPage() {
    const { currentUser } = useAdminAuth();
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showBidForm, setShowBidForm] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const handleViewEnquiry = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowChat(true);
    };

    const handleCreateBid = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowBidForm(true);
    };

    const handleBidCreated = () => {
        setShowBidForm(false);
        setSelectedEnquiry(null);
        // Refresh dashboard
        window.location.reload();
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Product Enquiries & Bids</h1>
                <p className="text-gray-600 mt-2">
                    Manage customer product enquiries and create bid offers
                </p>
            </div>

            <EnquiryDashboard
                onViewEnquiry={handleViewEnquiry}
                onCreateBid={handleCreateBid}
            />

            {/* Bid Creation Modal */}
            {showBidForm && selectedEnquiry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Create Bid Offer</h2>
                                <button
                                    onClick={() => {
                                        setShowBidForm(false);
                                        setSelectedEnquiry(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <CreateBidForm
                                enquiry={selectedEnquiry}
                                onSuccess={handleBidCreated}
                                onCancel={() => {
                                    setShowBidForm(false);
                                    setSelectedEnquiry(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {showChat && selectedEnquiry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Enquiry Chat</h2>
                                <button
                                    onClick={() => {
                                        setShowChat(false);
                                        setSelectedEnquiry(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <AdminEnquiryChat
                                enquiryId={selectedEnquiry.id}
                                enquiry={selectedEnquiry}
                                adminId={currentUser?.id}
                                adminName={currentUser?.name || currentUser?.email || 'Admin'}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
