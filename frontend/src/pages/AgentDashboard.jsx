import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import BookingCard, { BookingCardSkeleton } from '../components/BookingCard';
import OtpVerifyModal from '../components/OtpVerifyModal';
import {
    Briefcase,
    IndianRupee,
    CheckCircle2,
    Clock,
    TrendingUp,
    Package,
    Loader2,
    AlertCircle,
    MapPin,
    Tag,
} from 'lucide-react';

const tabs = [
    { value: 'available', label: 'Available Jobs' },
    { value: 'my', label: 'My Jobs' },
];

export default function AgentDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('available');
    const [availableBookings, setAvailableBookings] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');
    const [otpBookingId, setOtpBookingId] = useState(null);
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
            } else if (action === 'reject') {
                await bookingsAPI.reject(id);
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
        <>
            <div className="bg-surface-50 min-h-screen">
                <div className="section-container py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-surface-900">
                                    Welcome, {user?.name || 'Agent'}
                                </h1>
                                <p className="text-sm text-surface-500 mt-1">
                                    Jobs matching your service area and category
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {user?.service_category && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 border border-primary-100">
                                        <Tag className="h-3 w-3" /> {user.service_category}
                                    </span>
                                )}
                                {(user?.city || user?.location) && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 border border-success-100">
                                        <MapPin className="h-3 w-3" />
                                        {user.city || user.location}
                                        {user?.area && ` · ${user.area}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Earnings', value: `₹${totalEarnings.toLocaleString()}`, icon: IndianRupee, iconBg: 'bg-success-50 text-success-600' },
                            { label: 'Active Jobs', value: activeJobs.length, icon: Briefcase, iconBg: 'bg-primary-50 text-primary-600' },
                            { label: 'Completed', value: completedJobs.length, icon: CheckCircle2, iconBg: 'bg-success-50 text-success-600' },
                            { label: 'Available', value: availableBookings.length, icon: Clock, iconBg: 'bg-warning-50 text-warning-600' },
                        ].map(({ label, value, icon: Icon, iconBg }) => (
                            <div key={label} className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold text-surface-900">{value}</p>
                                        <p className="text-xs text-surface-500">{label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Earnings banner */}
                    <div className="card mb-6 p-5 bg-surface-900 border-surface-800 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-surface-400 uppercase tracking-wider">Total Earnings</p>
                                <p className="text-2xl font-semibold mt-1">₹{totalEarnings.toLocaleString()}</p>
                                <p className="text-xs text-surface-400 mt-1">{completedJobs.length} jobs completed</p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-500/20 px-4 py-3">
                            <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                            <p className="text-sm text-danger-600">{error}</p>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mb-6">
                        {tabs.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setActiveTab(value)}
                                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                    activeTab === value
                                        ? 'bg-surface-900 text-white'
                                        : 'text-surface-600 hover:bg-surface-100'
                                }`}
                            >
                                {label}
                                <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                                    activeTab === value ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'
                                }`}>
                                    {value === 'available' ? availableBookings.length : myBookings.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Bookings */}
                    <div className="space-y-3">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
                        ) : currentBookings.length > 0 ? (
                            currentBookings.map((booking) => (
                                <div key={booking._id} className="relative">
                                    {actionLoading === booking._id && (
                                        <div className="absolute inset-0 bg-white/60 rounded-xl z-10 flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                                        </div>
                                    )}
                                    <BookingCard
                                        booking={booking}
                                        showActions={true}
                                        onAction={handleAction}
                                        onOtpVerify={(id) => setOtpBookingId(id)}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="card text-center py-16">
                                <Package className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                                <h3 className="text-base font-medium text-surface-700">
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

            {/* OTP Modal */}
            {otpBookingId && (
                <OtpVerifyModal
                    bookingId={otpBookingId}
                    onClose={() => setOtpBookingId(null)}
                    onVerified={() => {
                        setOtpBookingId(null);
                        fetchData();
                    }}
                />
            )}
        </>
    );
}
