// admin-deployed/src/Components/Enquiries/AdminEnquiryChat.jsx
import { useState, useEffect, useRef } from 'react';
import { sendAdminMessage } from '../../api/adminEnquiryApi';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function AdminEnquiryChat({ enquiryId, adminId, adminName }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (enquiryId) {
            fetchMessages();
            // Mark messages as read
            markMessagesAsRead();
        }
    }, [enquiryId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/enquiry-messages/${enquiryId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        try {
            await fetch(
                `${API_BASE_URL}/enquiry-messages/${enquiryId}/read`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sender_type: 'ADMIN' }),
                }
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        // Validate admin ID exists
        if (!adminId) {
            toast.error('Admin authentication required. Please log in again.');
            return;
        }

        setSending(true);

        try {
            const messageData = {
                enquiry_id: enquiryId,
                sender_id: adminId,
                sender_name: adminName || 'Admin',
                message: newMessage.trim(),
            };

            const response = await sendAdminMessage(messageData);

            if (response.success) {
                setMessages(prev => [...prev, response.message]);
                setNewMessage('');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
            });
        }
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.created_at);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
            {/* Chat Header */}
            <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg">
                <h3 className="font-semibold text-lg">Customer Chat</h3>
                <p className="text-sm text-gray-300">Discuss pricing and negotiate with customer</p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                {date}
                            </div>
                        </div>

                        {/* Messages for this date */}
                        {dateMessages.map((message) => {
                            const isAdmin = message.sender_type === 'ADMIN';

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-4`}
                                >
                                    <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                                        {/* Sender Name */}
                                        {!isAdmin && (
                                            <p className="text-xs text-gray-500 mb-1 px-1">
                                                {message.sender_name || 'Customer'}
                                            </p>
                                        )}

                                        {/* Message Bubble */}
                                        <div
                                            className={`rounded-lg px-4 py-3 ${isAdmin
                                                ? 'bg-gray-800 text-white rounded-br-none'
                                                : 'bg-white text-gray-900 rounded-bl-none shadow'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {message.message}
                                            </p>

                                            {/* Timestamp */}
                                            <p
                                                className={`text-xs mt-2 ${isAdmin ? 'text-gray-300' : 'text-gray-500'
                                                    }`}
                                            >
                                                {formatTime(message.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-gray-600">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start the conversation with the customer</p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {sending ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Be professional and provide clear pricing information
                </p>
            </form>
        </div>
    );
}
