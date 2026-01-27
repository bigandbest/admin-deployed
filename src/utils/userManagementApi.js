const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        return {
            success: false,
            error: data.error || data.message || "Request failed",
        };
    }
    return { success: true, ...data };
};

export async function getAdminUsers(page = 1, limit = 10, search = "", role = "", status = "") {
    try {
        const params = new URLSearchParams({
            page,
            limit,
            search,
            role,
            status
        });
        const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`);
        return await handleResponse(response);
    } catch (error) {
        console.error("Error in getAdminUsers:", error);
        return { success: false, error: error.message };
    }
}

export async function createAdminUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error in createAdminUser:", error);
        return { success: false, error: error.message };
    }
}

export async function updateAdminUser(userId, userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error in updateAdminUser:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteAdminUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "DELETE",
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error in deleteAdminUser:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleAdminUserStatus(userId, active) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error in toggleAdminUserStatus:", error);
        return { success: false, error: error.message };
    }
}
