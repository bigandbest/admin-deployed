import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaStar } from "react-icons/fa";
import { LoadingOverlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import api from "../../utils/api";

const CustomerReviewManager = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        rating: 5,
        image_url: "",
        comment: "",
        active: true,
        sort_order: 0,
    });

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        setLoading(true);
        try {
            const response = await api.get("/customer-testimonials/list");
            if (response.data.success) {
                setTestimonials(response.data.testimonials);
            }
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            notifications.show({
                title: "Error",
                message: "Failed to fetch testimonials",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingTestimonial) {
                // Update existing testimonial
                await api.put(
                    `/customer-testimonials/update/${editingTestimonial.id}`,
                    formData
                );
                notifications.show({
                    title: "Success",
                    message: "Testimonial updated successfully",
                    color: "green",
                });
            } else {
                // Add new testimonial
                await api.post("/customer-testimonials/add", formData);
                notifications.show({
                    title: "Success",
                    message: "Testimonial added successfully",
                    color: "green",
                });
            }

            fetchTestimonials();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving testimonial:", error);
            notifications.show({
                title: "Error",
                message: "Failed to save testimonial",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this testimonial?")) {
            return;
        }

        setLoading(true);
        try {
            await api.delete(`/customer-testimonials/delete/${id}`);
            notifications.show({
                title: "Success",
                message: "Testimonial deleted successfully",
                color: "green",
            });
            fetchTestimonials();
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            notifications.show({
                title: "Error",
                message: "Failed to delete testimonial",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        setLoading(true);
        try {
            await api.patch(`/customer-testimonials/toggle-status/${id}`);
            notifications.show({
                title: "Success",
                message: "Status updated successfully",
                color: "green",
            });
            fetchTestimonials();
        } catch (error) {
            console.error("Error toggling status:", error);
            notifications.show({
                title: "Error",
                message: "Failed to update status",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (testimonial) => {
        setEditingTestimonial(testimonial);
        setFormData({
            name: testimonial.name,
            rating: testimonial.rating,
            image_url: testimonial.image_url || "",
            comment: testimonial.comment,
            active: testimonial.active,
            sort_order: testimonial.sort_order || 0,
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingTestimonial(null);
        setFormData({
            name: "",
            rating: 5,
            image_url: "",
            comment: "",
            active: true,
            sort_order: 0,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTestimonial(null);
        setFormData({
            name: "",
            rating: 5,
            image_url: "",
            comment: "",
            active: true,
            sort_order: 0,
        });
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <FaStar
                key={i}
                className={i < rating ? "text-yellow-400" : "text-gray-300"}
                size={16}
            />
        ));
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <LoadingOverlay visible={loading} />

            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Customer Reviews Manager
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage customer testimonials displayed on the homepage
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <FaPlus /> Add Review
                </button>
            </div>

            {/* Testimonials Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Rating
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Comment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {testimonials.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No testimonials found. Add your first review!
                                </td>
                            </tr>
                        ) : (
                            testimonials.map((testimonial) => (
                                <tr key={testimonial.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {testimonial.image_url ? (
                                                <img
                                                    src={testimonial.image_url}
                                                    alt={testimonial.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                    {testimonial.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-900">
                                                {testimonial.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {renderStars(testimonial.rating)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                            {testimonial.comment}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">
                                            {testimonial.sort_order}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(testimonial.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${testimonial.active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {testimonial.active ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(testimonial)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(testimonial.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingTestimonial ? "Edit Review" : "Add New Review"}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                {/* Customer Name */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Rating */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating *
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({ ...formData, rating: star })
                                                }
                                                className="focus:outline-none"
                                            >
                                                <FaStar
                                                    size={32}
                                                    className={
                                                        star <= formData.rating
                                                            ? "text-yellow-400"
                                                            : "text-gray-300"
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image URL */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.image_url}
                                        onChange={(e) =>
                                            setFormData({ ...formData, image_url: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                {/* Comment */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Review Comment *
                                    </label>
                                    <textarea
                                        value={formData.comment}
                                        onChange={(e) =>
                                            setFormData({ ...formData, comment: e.target.value })
                                        }
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Sort Order */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sort_order: parseInt(e.target.value) || 0,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Lower numbers appear first
                                    </p>
                                </div>

                                {/* Active Status */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) =>
                                                setFormData({ ...formData, active: e.target.checked })
                                            }
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Active (Display on homepage)
                                        </span>
                                    </label>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingTestimonial ? "Update" : "Add"} Review
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerReviewManager;
