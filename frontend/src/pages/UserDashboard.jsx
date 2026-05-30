import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, servicesAPI } from '../services/api';
import BookingCard, { BookingCardSkeleton } from '../components/BookingCard';
import {
    CalendarDays,
    PlusCircle,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    MapPin,
    ArrowRight,
} from 'lucide-react';

const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
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
        <div className="bg-surface-50 min-h-screen">
            <div className="section-container py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-surface-900">
                            Welcome back, {user?.name?.split(' ')[0] || 'User'}
                        </h1>
                        <p className="text-sm text-surface-500 mt-1">Manage your bookings and services</p>
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

                {/* Success banner */}
                {bookingSuccess && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-success-50 border border-success-500/20 px-4 py-3 animate-fade-in">
                        <CheckCircle2 className="h-4 w-4 text-success-600" />
                        <p className="text-sm text-success-700 font-medium">{bookingSuccess}</p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, icon: Package, iconBg: 'bg-surface-100 text-surface-600' },
                        { label: 'Pending', value: stats.pending, icon: Clock, iconBg: 'bg-warning-50 text-warning-600' },
                        { label: 'Active', value: stats.active, icon: CalendarDays, iconBg: 'bg-primary-50 text-primary-600' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle2, iconBg: 'bg-success-50 text-success-600' },
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

                {/* Book Form */}
                {showBookForm && (
                    <div className="card p-5 mb-6 animate-slide-down">
                        <h2 className="text-base font-semibold text-surface-900 mb-4">Book a Service</h2>
                        {bookingError && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-500/20 px-3 py-2.5">
                                <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                                <p className="text-sm text-danger-600">{bookingError}</p>
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
                                <input
                                    type="text"
                                    value={bookingForm.address}
                                    onChange={(e) => setBookingForm((p) => ({ ...p, address: e.target.value }))}
                                    placeholder="Enter your full address"
                                    className="input-field"
                                    id="booking-address-input"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes (optional)</label>
                                <textarea
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
                                    placeholder="Any special instructions..."
                                    rows={2}
                                    className="input-field resize-none"
                                />
                            </div>
                            <div className="sm:col-span-2 flex gap-3">
                                <button type="submit" disabled={bookingLoading} className="btn-primary" id="confirm-booking-btn">
                                    {bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking...</> : <>Confirm Booking</>}
                                </button>
                                <button type="button" onClick={() => setShowBookForm(false)} className="btn-ghost">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6">
                    {statusFilters.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                filter === value
                                    ? 'bg-surface-900 text-white'
                                    : 'text-surface-600 hover:bg-surface-100'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <BookingCard key={booking._id} booking={booking} />
                        ))
                    ) : (
                        <div className="card text-center py-16">
                            <Package className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                            <h3 className="text-base font-medium text-surface-700">No bookings found</h3>
                            <p className="text-sm text-surface-400 mt-1">
                                {filter === 'all' ? "You haven't booked anything yet." : `No ${filter} bookings.`}
                            </p>
                            <button
                                onClick={() => setShowBookForm(true)}
                                className="btn-primary mt-5"
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
