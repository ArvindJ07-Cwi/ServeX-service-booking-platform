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
            case 'new_booking': return <CalendarClock className="h-5 w-5 text-blue-500" />;
            case 'status_update': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'payment_success': return <CreditCard className="h-5 w-5 text-emerald-500" />;
            case 'booking_cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-surface-400" />;
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-surface-600 hover:text-primary-600 transition-colors rounded-full hover:bg-surface-100"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute 1 top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-scale-in">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-surface-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-surface-100 flex items-center justify-between bg-surface-50">
                        <h3 className="font-semibold text-surface-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Check className="h-3 w-3" /> Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-sm text-surface-400">Loading notifications...</div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-surface-100">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification._id} 
                                        className={`p-4 hover:bg-surface-50 transition-colors flex gap-3 relative group ${!notification.isRead ? 'bg-primary-50/30' : ''}`}
                                    >
                                        {!notification.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                                        )}
                                        <div className="flex-shrink-0 mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 pr-6">
                                            <p className="text-sm font-medium text-surface-900">{notification.title}</p>
                                            <p className="text-xs text-surface-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                            <p className="text-[10px] text-surface-400 mt-2">{formatTime(notification.createdAt)}</p>
                                        </div>
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                            {!notification.isRead && (
                                                <button 
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    className="p-1.5 rounded-full hover:bg-primary-100 text-primary-600"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(notification._id)}
                                                className="p-1.5 rounded-full hover:bg-red-100 text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center flex flex-col items-center">
                                <Bell className="h-10 w-10 text-surface-200 mb-3" />
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
