import React, { useState, useEffect } from "react";
import {
    getTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    uploadImage,
} from "../../api/teamApi";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaUpload } from "react-icons/fa";

const TeamManager = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        image_url: "",
    });

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            const response = await getTeamMembers();
            if (response.success) {
                setTeamMembers(response.data);
            }
        } catch (error) {
            toast.error("Failed to fetch team members");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const response = await uploadImage(file);
            if (response.success) {
                setFormData((prev) => ({ ...prev, image_url: response.imageUrl }));
                toast.success("Image uploaded successfully");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const openModal = (member = null) => {
        if (member) {
            setIsEditing(true);
            setCurrentMember(member);
            setFormData({
                name: member.name,
                designation: member.designation,
                image_url: member.image_url || "",
            });
        } else {
            setIsEditing(false);
            setCurrentMember(null);
            setFormData({
                name: "",
                designation: "",
                image_url: "",
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return; // Prevent closing while submitting
        setIsModalOpen(false);
        setIsEditing(false);
        setCurrentMember(null);
        setFormData({
            name: "",
            designation: "",
            image_url: "",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                await updateTeamMember(currentMember.id, formData);
                toast.success("Team member updated successfully");
            } else {
                await addTeamMember(formData);
                toast.success("Team member added successfully");
            }
            await fetchTeamMembers();
            closeModal();
        } catch (error) {
            toast.error(isEditing ? "Failed to update member" : "Failed to add member");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this team member?")) {
            setDeletingId(id);
            try {
                await deleteTeamMember(id);
                toast.success("Team member deleted successfully");
                await fetchTeamMembers();
            } catch (error) {
                toast.error("Failed to delete team member");
            } finally {
                setDeletingId(null);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <FaPlus /> Add Team Member
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {teamMembers.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            No team members found. Add one to get started!
                        </div>
                    ) : (
                        teamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="relative h-48 w-full bg-gray-100">
                                    {member.image_url ? (
                                        <img
                                            src={member.image_url}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => openModal(member)}
                                            className="bg-white p-2 rounded-full shadow-md text-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            disabled={deletingId === member.id}
                                            className={`bg-white p-2 rounded-full shadow-md text-red-500 transition-colors ${deletingId === member.id
                                                ? "opacity-50 cursor-not-allowed"
                                                : "hover:text-red-600"
                                                }`}
                                        >
                                            {deletingId === member.id ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                            ) : (
                                                <FaTrash />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-orange-500 font-medium">
                                        {member.designation}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? "Edit Team Member" : "Add Team Member"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter designation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image
                                </label>
                                <div className="flex flex-col gap-2">
                                    {formData.image_url && (
                                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                            id="image-upload"
                                            disabled={uploading}
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                                        >
                                            {uploading ? (
                                                <span className="flex items-center text-gray-500">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                                                    Uploading...
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-gray-500">
                                                    <FaUpload className="mr-2" />
                                                    {formData.image_url ? "Change Image" : "Upload Image"}
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        placeholder="Or paste image URL"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || submitting}
                                    className={`px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            Saving...
                                        </>
                                    ) : (
                                        isEditing ? "Update" : "Add"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManager;
