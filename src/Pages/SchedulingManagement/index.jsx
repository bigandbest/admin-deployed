import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaClock, FaPlus, FaEdit, FaTrash, FaWarehouse, FaCog } from 'react-icons/fa';
import {
    getAllTimeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getWarehouseSlots,
    assignSlotToWarehouse,
    updateWarehouseSlotConfig,
    removeSlotFromWarehouse
} from '../../utils/schedulingApi';
import { getAllWarehouses } from '../../utils/supabaseApi';

const SchedulingManagement = () => {
    const [activeTab, setActiveTab] = useState('slots');
    const [timeSlots, setTimeSlots] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [warehouseSlots, setWarehouseSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showWarehouseSlotModal, setShowWarehouseSlotModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [editingWarehouseSlot, setEditingWarehouseSlot] = useState(null);

    // Form states
    const [slotForm, setSlotForm] = useState({
        start_time: '',
        end_time: '',
        display_name: ''
    });

    const [warehouseSlotForm, setWarehouseSlotForm] = useState({
        warehouse_id: '',
        slot_id: '',
        max_capacity: 20,
        scheduling_window_hours: 24,
        days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    });

    useEffect(() => {
        fetchTimeSlots();
        fetchWarehouses();
    }, []);

    useEffect(() => {
        if (selectedWarehouse) {
            fetchWarehouseSlots(selectedWarehouse.id);
        }
    }, [selectedWarehouse]);

    const fetchTimeSlots = async () => {
        setLoading(true);
        try {
            const response = await getAllTimeSlots();
            if (response.success) {
                setTimeSlots(response.data);
            } else {
                toast.error('Failed to fetch time slots');
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
            toast.error('Error fetching time slots');
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await getAllWarehouses();
            if (response.success) {
                setWarehouses(response.data);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const fetchWarehouseSlots = async (warehouseId) => {
        setLoading(true);
        try {
            const response = await getWarehouseSlots(warehouseId);
            if (response.success) {
                setWarehouseSlots(response.data);
            } else {
                toast.error('Failed to fetch warehouse slots');
            }
        } catch (error) {
            console.error('Error fetching warehouse slots:', error);
            toast.error('Error fetching warehouse slots');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = editingSlot
                ? await updateTimeSlot(editingSlot.id, slotForm)
                : await createTimeSlot(slotForm);

            if (response.success) {
                toast.success(editingSlot ? 'Time slot updated successfully' : 'Time slot created successfully');
                setShowSlotModal(false);
                setEditingSlot(null);
                setSlotForm({ start_time: '', end_time: '', display_name: '' });
                fetchTimeSlots();
            } else {
                toast.error(response.error || 'Failed to save time slot');
            }
        } catch (error) {
            console.error('Error saving time slot:', error);
            toast.error('Error saving time slot');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (id) => {
        if (!confirm('Are you sure you want to delete this time slot?')) return;

        setLoading(true);
        try {
            const response = await deleteTimeSlot(id);
            if (response.success) {
                toast.success('Time slot deleted successfully');
                fetchTimeSlots();
            } else {
                toast.error(response.error || 'Failed to delete time slot');
            }
        } catch (error) {
            console.error('Error deleting time slot:', error);
            toast.error('Error deleting time slot');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSlot = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = editingWarehouseSlot
                ? await updateWarehouseSlotConfig(editingWarehouseSlot.id, {
                    max_capacity: warehouseSlotForm.max_capacity,
                    scheduling_window_hours: warehouseSlotForm.scheduling_window_hours,
                    days_of_week: warehouseSlotForm.days_of_week
                })
                : await assignSlotToWarehouse(warehouseSlotForm);

            if (response.success) {
                toast.success(editingWarehouseSlot ? 'Slot configuration updated' : 'Slot assigned to warehouse');
                setShowWarehouseSlotModal(false);
                setEditingWarehouseSlot(null);
                setWarehouseSlotForm({
                    warehouse_id: '',
                    slot_id: '',
                    max_capacity: 20,
                    scheduling_window_hours: 24,
                    days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                });
                if (selectedWarehouse) {
                    fetchWarehouseSlots(selectedWarehouse.id);
                }
            } else {
                toast.error(response.error || 'Failed to assign slot');
            }
        } catch (error) {
            console.error('Error assigning slot:', error);
            toast.error('Error assigning slot');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveWarehouseSlot = async (id) => {
        if (!confirm('Are you sure you want to remove this slot from the warehouse?')) return;

        setLoading(true);
        try {
            const response = await removeSlotFromWarehouse(id);
            if (response.success) {
                toast.success('Slot removed from warehouse');
                if (selectedWarehouse) {
                    fetchWarehouseSlots(selectedWarehouse.id);
                }
            } else {
                toast.error(response.error || 'Failed to remove slot');
            }
        } catch (error) {
            console.error('Error removing slot:', error);
            toast.error('Error removing slot');
        } finally {
            setLoading(false);
        }
    };

    const openEditSlot = (slot) => {
        setEditingSlot(slot);
        setSlotForm({
            start_time: slot.start_time,
            end_time: slot.end_time,
            display_name: slot.display_name
        });
        setShowSlotModal(true);
    };

    const openEditWarehouseSlot = (warehouseSlot) => {
        setEditingWarehouseSlot(warehouseSlot);
        setWarehouseSlotForm({
            warehouse_id: warehouseSlot.warehouse_id,
            slot_id: warehouseSlot.slot_id,
            max_capacity: warehouseSlot.max_capacity,
            scheduling_window_hours: warehouseSlot.scheduling_window_hours || 24,
            days_of_week: warehouseSlot.days_of_week || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        });
        setShowWarehouseSlotModal(true);
    };

    const toggleDayOfWeek = (day) => {
        setWarehouseSlotForm(prev => ({
            ...prev,
            days_of_week: prev.days_of_week.includes(day)
                ? prev.days_of_week.filter(d => d !== day)
                : [...prev.days_of_week, day]
        }));
    };

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FaClock className="text-blue-600" />
                        Scheduling Management
                    </h1>

                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('slots')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'slots'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <FaClock className="inline mr-2" />
                                Time Slots
                            </button>
                            <button
                                onClick={() => setActiveTab('warehouse')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'warehouse'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <FaWarehouse className="inline mr-2" />
                                Warehouse Configuration
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Time Slots Tab */}
                {activeTab === 'slots' && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Time Slots</h2>
                            <button
                                onClick={() => {
                                    setEditingSlot(null);
                                    setSlotForm({ start_time: '', end_time: '', display_name: '' });
                                    setShowSlotModal(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <FaPlus /> Add Time Slot
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Display Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Start Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                End Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {timeSlots.map((slot) => (
                                            <tr key={slot.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {slot.display_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {slot.start_time}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {slot.end_time}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${slot.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {slot.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openEditSlot(slot)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Warehouse Configuration Tab */}
                {activeTab === 'warehouse' && (
                    <div className="space-y-6">
                        {/* Warehouse Selector */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Warehouse
                            </label>
                            <select
                                value={selectedWarehouse?.id || ''}
                                onChange={(e) => {
                                    const warehouse = warehouses.find(w => w.id === parseInt(e.target.value));
                                    setSelectedWarehouse(warehouse);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">-- Select a warehouse --</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} ({warehouse.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Warehouse Slots */}
                        {selectedWarehouse && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Slots for {selectedWarehouse.name}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setEditingWarehouseSlot(null);
                                            setWarehouseSlotForm({
                                                warehouse_id: selectedWarehouse.id,
                                                slot_id: '',
                                                max_capacity: 20,
                                                scheduling_window_hours: 24,
                                                days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                            });
                                            setShowWarehouseSlotModal(true);
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <FaPlus /> Assign Slot
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Time Slot
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Max Capacity
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Scheduling Window
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Days Active
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {warehouseSlots.map((warehouseSlot) => (
                                                    <tr key={warehouseSlot.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {warehouseSlot.scheduling_time_slots?.display_name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {warehouseSlot.max_capacity} orders
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {warehouseSlot.scheduling_window_hours || 24} hours
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {warehouseSlot.days_of_week?.length || 7} days
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${warehouseSlot.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {warehouseSlot.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => openEditWarehouseSlot(warehouseSlot)}
                                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                            >
                                                                <FaCog />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveWarehouseSlot(warehouseSlot.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Time Slot Modal */}
                {showSlotModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                            <h3 className="text-xl font-semibold mb-4">
                                {editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
                            </h3>
                            <form onSubmit={handleCreateSlot}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={slotForm.display_name}
                                            onChange={(e) => setSlotForm({ ...slotForm, display_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 8 PM - 10 PM"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={slotForm.start_time}
                                            onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={slotForm.end_time}
                                            onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : editingSlot ? 'Update' : 'Create'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSlotModal(false);
                                            setEditingSlot(null);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Warehouse Slot Modal */}
                {showWarehouseSlotModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                            <h3 className="text-xl font-semibold mb-4">
                                {editingWarehouseSlot ? 'Edit Slot Configuration' : 'Assign Slot to Warehouse'}
                            </h3>
                            <form onSubmit={handleAssignSlot}>
                                <div className="space-y-4">
                                    {!editingWarehouseSlot && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Time Slot
                                            </label>
                                            <select
                                                value={warehouseSlotForm.slot_id}
                                                onChange={(e) => setWarehouseSlotForm({ ...warehouseSlotForm, slot_id: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">-- Select a time slot --</option>
                                                {timeSlots.filter(s => s.is_active).map((slot) => (
                                                    <option key={slot.id} value={slot.id}>
                                                        {slot.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Capacity (orders per slot)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={warehouseSlotForm.max_capacity}
                                            onChange={(e) => setWarehouseSlotForm({ ...warehouseSlotForm, max_capacity: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Scheduling Window (hours in advance)
                                        </label>
                                        <select
                                            value={warehouseSlotForm.scheduling_window_hours}
                                            onChange={(e) => setWarehouseSlotForm({ ...warehouseSlotForm, scheduling_window_hours: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="24">24 hours (Default)</option>
                                            <option value="36">36 hours</option>
                                            <option value="48">48 hours</option>
                                            <option value="72">72 hours (3 days)</option>
                                            <option value="96">96 hours (4 days)</option>
                                            <option value="120">120 hours (5 days)</option>
                                            <option value="168">168 hours (7 days)</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Users can schedule orders up to this many hours in advance
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Active Days
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {daysOfWeek.map((day) => (
                                                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={warehouseSlotForm.days_of_week.includes(day)}
                                                        onChange={() => toggleDayOfWeek(day)}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 capitalize">{day}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : editingWarehouseSlot ? 'Update' : 'Assign'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowWarehouseSlotModal(false);
                                            setEditingWarehouseSlot(null);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchedulingManagement;
