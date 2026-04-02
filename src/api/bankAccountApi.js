const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

/**
 * Get current active bank account settings
 */
export const getActiveBankAccount = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/admin/bank-account`, {
            method: 'GET',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch active bank account');
        }
        return data;
    } catch (error) {
        console.error('Error fetching active bank account:', error);
        throw error;
    }
};

/**
 * Save/Update bank account settings
 */
export const saveBankAccount = async (accountData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/admin/bank-account`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(accountData),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save bank account');
        }
        return data;
    } catch (error) {
        console.error('Error saving bank account:', error);
        throw error;
    }
};

/**
 * Get all bank account settings (audit history)
 */
export const getAllBankAccounts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/admin/bank-account/all`, {
            method: 'GET',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch bank account history');
        }
        return data;
    } catch (error) {
        console.error('Error fetching bank account history:', error);
        throw error;
    }
};
