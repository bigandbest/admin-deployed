const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        return {
            success: false,
            error: data.error || data.message || 'Request failed',
        };
    }
    return { success: true, ...data };
};

// Time Slots Management
export const createTimeSlot = async (slotData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/slots`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(slotData)
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateTimeSlot = async (id, slotData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/slots/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(slotData)
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteTimeSlot = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/slots/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getAllTimeSlots = async (isActive) => {
    try {
        const url = isActive !== undefined
            ? `${API_BASE_URL}/scheduled-orders/admin/slots?is_active=${isActive}`
            : `${API_BASE_URL}/scheduled-orders/admin/slots`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Warehouse Slot Configuration
export const assignSlotToWarehouse = async (configData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/warehouse-slots`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(configData)
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateWarehouseSlotConfig = async (id, configData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/warehouse-slots/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(configData)
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const removeSlotFromWarehouse = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/warehouse-slots/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getWarehouseSlots = async (warehouseId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/scheduled-orders/admin/warehouse/${warehouseId}/slots`, {
            headers: getAuthHeaders(),
        });
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getSlotAvailability = async (warehouseId, slotId, date) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/scheduled-orders/slot-availability?warehouse_id=${warehouseId}&slot_id=${slotId}&date=${date}`,
            {
                headers: getAuthHeaders(),
            }
        );
        return await handleResponse(response);
    } catch (error) {
        return { success: false, error: error.message };
    }
};
