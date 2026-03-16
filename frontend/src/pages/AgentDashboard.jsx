import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import BookingCard, { BookingCardSkeleton } from '../components/BookingCard';
import {
    Briefcase,
    DollarSign,
    CheckCircle2,
    Clock,
    TrendingUp,
    Package,
    Loader2,
    AlertCircle,
} from 'lucide-react';

const tabs = [
    { value: 'available', label: 'Available', icon: Package },
    { value: 'my', label: 'My Jobs', icon: Briefcase },
];

export default function AgentDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('available');
    const [availableBookings, setAvailableBookings] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');
    const isMounted = useRef(true);

    const fetchData = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const [availableRes, myRes] = await Promise.all([
                bookingsAPI.getAvailable().catch(() => ({ data: [] })),
                bookingsAPI.getMyBookings().catch(() => ({ data: [] })),
            ]);
            if (isMounted.current) {
                setAvailableBookings(availableRes.data.bookings || availableRes.data || []);
                setMyBookings(myRes.data.bookings || myRes.data || []);
            }
        } catch {
            if (isMounted.current) setError('Failed to load bookings.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchData(true);

        // Poll every 5 seconds for real-time updates
        const interval = setInterval(() => fetchData(false), 5000);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [fetchData]);

    const handleAction = async (id, action) => {
        setActionLoading(id);
        setError('');
        try {
            if (action === 'accept') {
                await bookingsAPI.accept(id);
            } else {
                await bookingsAPI.updateStatus(id, action);
            }
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${action} booking.`);
        } finally {
            setActionLoading(null);
        }
    };

    const completedJobs = myBookings.filter((b) => b.status === 'completed');
    const totalEarnings = completedJobs.reduce((sum, b) => sum + (b.totalAmount || b.service?.price || 0), 0);
    const activeJobs = myBookings.filter((b) => ['accepted', 'confirmed', 'in_progress'].includes(b.status));

    const currentBookings = activeTab === 'available' ? availableBookings : myBookings;

    return (
        <div className="min-h-screen bg-surface-50 pt-20">
            <div className="section-container py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="page-header">
                        Agent Dashboard
                    </h1>
                    <p className="page-subtitle">Welcome, {user?.name || 'Agent'}. Manage your jobs and earnings.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">₹{totalEarnings.toLocaleString()}</p>
                                <p className="text-xs text-surface-500">Total Earnings</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">{activeJobs.length}</p>
                                <p className="text-xs text-surface-500">Active Jobs</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">{completedJobs.length}</p>
                                <p className="text-xs text-surface-500">Completed</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">{availableBookings.length}</p>
                                <p className="text-xs text-surface-500">Available</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Earnings Card */}
                <div className="card mb-8 bg-gradient-to-r from-primary-600 to-primary-700 border-0 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-primary-200">Earnings Summary</p>
                            <p className="text-3xl font-bold mt-1">₹{totalEarnings.toLocaleString()}</p>
                            <p className="text-sm text-primary-200 mt-1">{completedJobs.length} completed jobs</p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                            <TrendingUp className="h-7 w-7 text-white" />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 animate-scale-in">
                        <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                        <p className="text-sm text-danger-500">{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-surface-100 p-1 mb-6 w-fit">
                    {tabs.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setActiveTab(value)}
                            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === value
                                ? 'bg-white text-surface-900 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${activeTab === value ? 'bg-primary-100 text-primary-700' : 'bg-surface-200 text-surface-500'
                                }`}>
                                {value === 'available' ? availableBookings.length : myBookings.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Bookings */}
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
                    ) : currentBookings.length > 0 ? (
                        currentBookings.map((booking) => (
                            <div key={booking._id} className="relative">
                                {actionLoading === booking._id && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                                    </div>
                                )}
                                <BookingCard
                                    booking={booking}
                                    showActions={true}
                                    onAction={handleAction}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="card text-center py-16">
                            <Package className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-surface-600">
                                {activeTab === 'available' ? 'No available bookings' : 'No jobs yet'}
                            </h3>
                            <p className="text-sm text-surface-400 mt-1">
                                {activeTab === 'available' ? 'Check back later for new bookings.' : 'Accept available bookings to get started.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
