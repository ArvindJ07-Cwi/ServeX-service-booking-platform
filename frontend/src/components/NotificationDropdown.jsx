import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, CreditCard, XCircle, Info, CalendarClock, Trash2, Check } from 'lucide-react';
import { notificationsAPI } from '../services/api';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch unread count on mount
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Polling every minute
        return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await notificationsAPI.getUnreadCount();
            setUnreadCount(data.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await notificationsAPI.getAll();
            setNotifications(data || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationsAPI.delete(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'new_booking': return <CalendarClock className="h-4 w-4 text-blue-600" />;
            case 'status_update': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'payment_success': return <CreditCard className="h-4 w-4 text-green-600" />;
            case 'booking_cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-surface-400" />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-surface-200 bg-white shadow-lg overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
                        <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                            >
                                <Check className="h-3 w-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="py-10 text-center text-sm text-surface-400">Loading…</div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-surface-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`flex gap-3 px-4 py-3 relative group transition-colors hover:bg-surface-50 ${!notification.isRead ? 'bg-primary-50/40' : ''}`}
                                    >
                                        {/* Unread indicator */}
                                        {!notification.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-600 rounded-r" />
                                        )}

                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100">
                                            {getIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-6">
                                            <p className="text-sm font-medium text-surface-900 truncate">{notification.title}</p>
                                            <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notification.message}</p>
                                            <p className="text-[11px] text-surface-400 mt-1.5">{formatTime(notification.createdAt)}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary-100 text-primary-600 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification._id)}
                                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-red-100 text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 mb-3">
                                    <Bell className="h-5 w-5 text-surface-300" />
                                </div>
                                <p className="text-sm font-medium text-surface-500">No notifications yet</p>
                                <p className="text-xs text-surface-400 mt-1">When you get updates, they will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
