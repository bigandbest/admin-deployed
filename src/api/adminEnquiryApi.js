// admin-deployed/src/api/adminEnquiryApi.js
const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

/**
 * Get all enquiries (Admin view)
 */
export const getAllEnquiries = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters);

        const response = await fetch(
            `${API_BASE_URL}/api/enquiries/all?${queryParams}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch enquiries');
        }

        return data;
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        throw error;
    }
};

/**
 * Update enquiry status
 */
export const updateEnquiryStatus = async (enquiryId, status, notes = '') => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/enquiries/${enquiryId}/status`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, admin_notes: notes }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update status');
        }

        return data;
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

/**
 * Create a bid offer
 */
export const createBid = async (bidData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bids`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bidData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create bid');
        }

        return data;
    } catch (error) {
        console.error('Error creating bid:', error);
        throw error;
    }
};

/**
 * Update a bid
 */
export const updateBid = async (bidId, bidData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bids/${bidId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bidData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update bid');
        }

        return data;
    } catch (error) {
        console.error('Error updating bid:', error);
        throw error;
    }
};

/**
 * Lock a bid (finalize)
 */
export const lockBid = async (bidId, lockData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bids/${bidId}/lock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(lockData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to lock bid');
        }

        return data;
    } catch (error) {
        console.error('Error locking bid:', error);
        throw error;
    }
};

/**
 * Reject a bid
 */
export const rejectBid = async (bidId, reason) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bids/${bidId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to reject bid');
        }

        return data;
    } catch (error) {
        console.error('Error rejecting bid:', error);
        throw error;
    }
};

/**
 * Send admin message
 */
export const sendAdminMessage = async (messageData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/enquiry-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...messageData,
                sender_type: 'ADMIN',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send message');
        }

        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export default {
    getAllEnquiries,
    updateEnquiryStatus,
    createBid,
    updateBid,
    lockBid,
    rejectBid,
    sendAdminMessage,
};
