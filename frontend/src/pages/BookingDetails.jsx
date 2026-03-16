import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import StatusTimeline from '../components/StatusTimeline';
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    Phone,
    Mail,
    CreditCard,
    FileText,
    Loader2,
    AlertCircle,
    XCircle,
    CheckCircle2,
} from 'lucide-react';

export default function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Initial load
    useEffect(() => {
        let isMounted = true;
        const fetchBooking = async () => {
            // Only show loading on initial mount if booking is null
            if (!booking) setLoading(true);
            try {
                const response = await bookingsAPI.getById(id);
                if (isMounted) {
                    setBooking(response.data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError('Booking not found or access denied.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBooking();

        // Polling every 5 seconds for real-time updates
        const interval = setInterval(fetchBooking, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [id]);

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        setCancelling(true);
        try {
            await bookingsAPI.cancel(id);
            // Refresh explicitly
            const response = await bookingsAPI.getById(id);
            setBooking(response.data);
        } catch (err) {
            console.error(err);
            alert('Failed to cancel booking.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading && !booking) {
        return (
            <div className="flex bg-surface-50 min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="section-container py-12 text-center text-red-500">
                <p>{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 btn-secondary"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (!booking) return null;

    const {
        status,
        date,
        time,
        address,
        notes,
        totalAmount,
        subtotal,
        tax,
        platformFee,
        service,
        agent,
        _id
    } = booking;

    const canCancel = (status === 'pending' || status === 'confirmed') && user.role === 'user';

    return (
        <div className="section-container py-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-2 flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
                        Booking #{_id}
                    </h1>
                    <p className="text-sm text-surface-500 mt-1">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                </div>

                {canCancel && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="btn-danger w-full md:w-auto"
                    >
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Timeline */}
                    <div className="card">
                        <h2 className="text-lg font-bold text-surface-900 mb-6">Booking Status</h2>
                        <StatusTimeline currentStatus={status} />
                    </div>

                    {/* Service Info */}
                    <div className="card">
                        <h2 className="text-lg font-bold text-surface-900 mb-6 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary-600" />
                            Service Details
                        </h2>
                        <div className="flex gap-4">
                            <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-surface-100 overflow-hidden">
                                {service && service.image && (
                                    <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-surface-900">{service?.name}</h3>
                                <p className="text-sm text-surface-500 mt-1">{service?.description}</p>
                                <p className="mt-2 text-sm font-medium text-primary-600">Duration: {service?.duration}</p>
                            </div>
                        </div>
                    </div>

                    {/* Agent Info (If assigned) */}
                    {agent && (
                        <div className="card bg-primary-50 border-primary-100">
                            <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Assigned Professional
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-xl">
                                    {agent.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-primary-900">{agent.name}</p>
                                    <div className="flex gap-4 mt-1 text-sm text-primary-700">
                                        <a href={`tel:${agent.phone || ''}`} className="flex items-center gap-1 hover:underline">
                                            <Phone className="h-3 w-3" /> {agent.phone || 'N/A'}
                                        </a>
                                        <a href={`mailto:${agent.email}`} className="flex items-center gap-1 hover:underline">
                                            <Mail className="h-3 w-3" /> {agent.email}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Schedule & Location */}
                    <div className="card space-y-6">
                        <div>
                            <h3 className="flex items-center gap-2 font-semibold text-surface-900 mb-3">
                                <Calendar className="h-4 w-4 text-primary-600" />
                                Date & Time
                            </h3>
                            <p className="text-surface-600 ml-6">{new Date(date).toLocaleDateString()} at {time}</p>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 font-semibold text-surface-900 mb-3">
                                <MapPin className="h-4 w-4 text-primary-600" />
                                Location
                            </h3>
                            <p className="text-surface-600 ml-6 break-words">{address}</p>
                        </div>

                        {notes && (
                            <div>
                                <h3 className="flex items-center gap-2 font-semibold text-surface-900 mb-3">
                                    <FileText className="h-4 w-4 text-primary-600" />
                                    Notes
                                </h3>
                                <p className="text-surface-600 ml-6 italic">"{notes}"</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Summary */}
                    <div className="card">
                        <h3 className="flex items-center gap-2 font-semibold text-surface-900 mb-4">
                            <CreditCard className="h-4 w-4 text-primary-600" />
                            Payment Summary
                        </h3>

                        <div className="space-y-3 text-sm border-b border-surface-100 pb-4 mb-4">
                            <div className="flex justify-between text-surface-600">
                                <span>Service Total</span>
                                <span>₹{Number(subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Taxes (18%)</span>
                                <span>₹{Number(tax).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Platform Fee</span>
                                <span>₹{Number(platformFee).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-lg text-surface-900">
                            <span>Total Paid</span>
                            <span>₹{Number(totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Payment Successful
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
