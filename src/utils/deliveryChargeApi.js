const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Get all delivery charge milestones
 */
export const getAllMilestones = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch milestones");
        }

        return result;
    } catch (error) {
        console.error("Error fetching milestones:", error);
        throw error;
    }
};

/**
 * Get milestone by ID
 */
export const getMilestoneById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch milestone");
        }

        return result;
    } catch (error) {
        console.error("Error fetching milestone:", error);
        throw error;
    }
};

/**
 * Create new milestone
 */
export const createMilestone = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to create milestone");
        }

        return result;
    } catch (error) {
        console.error("Error creating milestone:", error);
        throw error;
    }
};

/**
 * Update milestone
 */
export const updateMilestone = async (id, data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to update milestone");
        }

        return result;
    } catch (error) {
        console.error("Error updating milestone:", error);
        throw error;
    }
};

/**
 * Delete milestone
 */
export const deleteMilestone = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges/${id}`, {
            method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to delete milestone");
        }

        return result;
    } catch (error) {
        console.error("Error deleting milestone:", error);
        throw error;
    }
};

/**
 * Toggle milestone active status
 */
export const toggleMilestoneActive = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges/${id}/toggle-active`, {
            method: "PATCH",
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to toggle milestone status");
        }

        return result;
    } catch (error) {
        console.error("Error toggling milestone status:", error);
        throw error;
    }
};

/**
 * Calculate delivery charge for order value
 */
export const calculateDeliveryCharge = async (orderValue) => {
    try {
        const response = await fetch(`${API_BASE_URL}/delivery-charges/calculate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderValue }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to calculate delivery charge");
        }

        return result;
    } catch (error) {
        console.error("Error calculating delivery charge:", error);
        throw error;
    }
};
