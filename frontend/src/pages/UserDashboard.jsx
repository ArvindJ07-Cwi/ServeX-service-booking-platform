import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, servicesAPI } from '../services/api';
import BookingCard, { BookingCardSkeleton } from '../components/BookingCard';
import {
    CalendarDays,
    PlusCircle,
    Filter,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Search,
    MapPin,
    ArrowRight,
} from 'lucide-react';

const statusFilters = [
    { value: 'all', label: 'All', icon: Package },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'confirmed', label: 'Confirmed', icon: CalendarDays },
    { value: 'in_progress', label: 'In Progress', icon: Loader2 },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

export default function UserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showBookForm, setShowBookForm] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        service: '',
        date: '',
        time: '',
        address: '',
        notes: '',
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');
    const isMounted = useRef(true);

    const fetchBookings = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const { data } = await bookingsAPI.getMyBookings();
            if (isMounted.current) setBookings(data.bookings || data || []);
        } catch {
            if (isMounted.current) setBookings([]);
        } finally {
            if (isMounted.current && showLoader) setLoading(false);
        }
    }, []);

    const fetchServices = async () => {
        try {
            const { data } = await servicesAPI.getAll();
            setServices(data.services || data || []);
        } catch {
            setServices([]);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchBookings(true);
        fetchServices();

        // Poll every 5 seconds for real-time updates
        const interval = setInterval(() => fetchBookings(false), 5000);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [fetchBookings]);

    const handleCancelBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await bookingsAPI.cancel(id);
            fetchBookings();
        } catch {
            alert('Failed to cancel booking.');
        }
    };

    const handleBookService = async (e) => {
        e.preventDefault();
        if (!bookingForm.service || !bookingForm.date || !bookingForm.time || !bookingForm.address) {
            setBookingError('Please fill in all required fields.');
            return;
        }

        setBookingLoading(true);
        setBookingError('');
        try {
            await bookingsAPI.create(bookingForm);
            setBookingSuccess('Booking created successfully!');
            setBookingForm({ service: '', date: '', time: '', address: '', notes: '' });
            setShowBookForm(false);
            fetchBookings();
            setTimeout(() => setBookingSuccess(''), 4000);
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Failed to create booking.');
        } finally {
            setBookingLoading(false);
        }
    };

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter((b) => b.status === filter);

    const stats = {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        active: bookings.filter((b) => ['confirmed', 'accepted', 'in_progress'].includes(b.status)).length,
        completed: bookings.filter((b) => b.status === 'completed').length,
    };

    return (
        <div className="min-h-screen bg-surface-50 pt-20">
            <div className="section-container py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="page-header">
                            Welcome back, <span className="text-primary-600">{user?.name?.split(' ')[0] || 'User'}</span>
                        </h1>
                        <p className="page-subtitle">Manage your bookings and services</p>
                    </div>
                    <button
                        onClick={() => setShowBookForm(!showBookForm)}
                        className="btn-primary"
                        id="new-booking-btn"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Book a Service
                    </button>
                </div>

                {/* Success message */}
                {bookingSuccess && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 animate-scale-in">
                        <CheckCircle2 className="h-4 w-4 text-success-600" />
                        <p className="text-sm text-success-600 font-medium">{bookingSuccess}</p>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger-children">
                    {[
                        { label: 'Total Bookings', value: stats.total, icon: Package, color: 'text-surface-600 bg-surface-100' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                        { label: 'Active', value: stats.active, icon: Loader2, color: 'text-primary-600 bg-primary-50' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="card">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-surface-900">{value}</p>
                                    <p className="text-xs text-surface-500">{label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Book Service Form */}
                {showBookForm && (
                    <div className="card mb-8 animate-slide-down">
                        <h2 className="text-lg font-semibold text-surface-900 mb-4">Book a Service</h2>
                        {bookingError && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                                <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                                <p className="text-sm text-danger-500">{bookingError}</p>
                            </div>
                        )}
                        <form onSubmit={handleBookService} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Service *</label>
                                <select
                                    value={bookingForm.service}
                                    onChange={(e) => setBookingForm((p) => ({ ...p, service: e.target.value }))}
                                    className="input-field"
                                    id="booking-service-select"
                                >
                                    <option value="">Select a service</option>
                                    {services.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} — ₹{s.price}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Date *</label>
                                <input
                                    type="date"
                                    value={bookingForm.date}
                                    onChange={(e) => setBookingForm((p) => ({ ...p, date: e.target.value }))}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="input-field"
                                    id="booking-date-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Time *</label>
                                <input
                                    type="time"
                                    value={bookingForm.time}
                                    onChange={(e) => setBookingForm((p) => ({ ...p, time: e.target.value }))}
                                    className="input-field"
                                    id="booking-time-input"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Address *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-surface-400" />
                                    <input
                                        type="text"
                                        value={bookingForm.address}
                                        onChange={(e) => setBookingForm((p) => ({ ...p, address: e.target.value }))}
                                        placeholder="Enter your full address"
                                        className="input-field pl-10"
                                        id="booking-address-input"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes (optional)</label>
                                <textarea
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
                                    placeholder="Any special instructions..."
                                    rows={3}
                                    className="input-field resize-none"
                                />
                            </div>
                            <div className="sm:col-span-2 flex gap-3">
                                <button type="submit" disabled={bookingLoading} className="btn-primary" id="confirm-booking-btn">
                                    {bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking...</> : <>Confirm Booking <ArrowRight className="h-4 w-4" /></>}
                                </button>
                                <button type="button" onClick={() => setShowBookForm(false)} className="btn-ghost">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {statusFilters.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${filter === value
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <BookingCard key={booking._id} booking={booking} />
                        ))
                    ) : (
                        <div className="card text-center py-16">
                            <Package className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-surface-600">No bookings found</h3>
                            <p className="text-sm text-surface-400 mt-1">
                                {filter === 'all' ? "You haven't booked anything yet." : `No ${filter} bookings.`}
                            </p>
                            <button
                                onClick={() => setShowBookForm(true)}
                                className="btn-primary mt-4"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Book your first service
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
