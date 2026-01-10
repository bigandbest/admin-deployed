const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Get charge settings
 */
export const getChargeSettings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/charge-settings`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch charge settings");
        }

        return result;
    } catch (error) {
        console.error("Error fetching charge settings:", error);
        throw error;
    }
};

/**
 * Update charge settings
 */
export const updateChargeSettings = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/charge-settings`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to update charge settings");
        }

        return result;
    } catch (error) {
        console.error("Error updating charge settings:", error);
        throw error;
    }
};
