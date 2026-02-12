import axios from "axios";

// Base URL for the backend API
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Upload Image
export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append("image", file);

        const token = localStorage.getItem("admin_token");

        const response = await axios.post(`${API_URL}/upload/image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

// Get all team members
export const getTeamMembers = async () => {
    try {
        const response = await axios.get(`${API_URL}/team-members`);
        return response.data;
    } catch (error) {
        console.error("Error fetching team members:", error);
        throw error;
    }
};

// Add a new team member
export const addTeamMember = async (teamMemberData) => {
    try {
        const response = await axios.post(`${API_URL}/team-members`, teamMemberData);
        return response.data;
    } catch (error) {
        console.error("Error adding team member:", error);
        throw error;
    }
};

// Update a team member
export const updateTeamMember = async (id, teamMemberData) => {
    try {
        const response = await axios.put(`${API_URL}/team-members/${id}`, teamMemberData);
        return response.data;
    } catch (error) {
        console.error("Error updating team member:", error);
        throw error;
    }
};

// Delete a team member
export const deleteTeamMember = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/team-members/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting team member:", error);
        throw error;
    }
};
