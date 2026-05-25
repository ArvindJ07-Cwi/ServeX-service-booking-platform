import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, paymentAPI } from '../services/api';
import StatusTimeline from '../components/StatusTimeline';
import ReviewSection from '../components/ReviewSection';
import OtpVerifyModal from '../components/OtpVerifyModal';
import ChatBox from '../components/ChatBox';
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
    ShieldCheck,
    RefreshCw,
    Wallet
} from 'lucide-react';

const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
        case 'electrical': return '⚡';
        case 'plumbing': return '🔧';
        case 'painting': return '🎨';
        default: return '💼';
    }
};

export default function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [otpTimeLeft, setOtpTimeLeft] = useState(0);
    const [resendingOtp, setResendingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpInputVisible, setOtpInputVisible] = useState(false);

    // Initial load
    useEffect(() => {
        let isMounted = true;
        const fetchBooking = async () => {
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

        const interval = setInterval(fetchBooking, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [id]);

    // OTP countdown timer for User
    useEffect(() => {
        if (booking?.otp_expires_at && booking?.status === 'in_progress' && !booking?.otp_verified) {
            const updateTimer = () => {
                const expiresAt = new Date(booking.otp_expires_at).getTime();
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
                setOtpTimeLeft(remaining);
            };
            updateTimer();
            const timer = setInterval(updateTimer, 1000);
            return () => clearInterval(timer);
        }
    }, [booking?.otp_expires_at, booking?.status, booking?.otp_verified]);

    // Resend cooldown timer for User
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setResendingOtp(true);
        try {
            await bookingsAPI.generateOtp(id);
            setResendCooldown(30);
            const response = await bookingsAPI.getById(id);
            setBooking(response.data);
        } catch (err) {
            console.error('Failed to resend OTP:', err);
        } finally {
            setResendingOtp(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        setCancelling(true);
        try {
            await bookingsAPI.cancel(id);
            const response = await bookingsAPI.getById(id);
            setBooking(response.data);
        } catch (err) {
            console.error(err);
            alert('Failed to cancel booking.');
        } finally {
            setCancelling(false);
        }
    };

    const handleAgentAction = async (action) => {
        setActionLoading(true);
        try {
            if (action === 'accept') {
                await bookingsAPI.accept(id);
            } else if (action === 'reject') {
                await bookingsAPI.reject(id);
                navigate('/agent-dashboard');
                return;
            } else {
                await bookingsAPI.updateStatus(id, action);
            }
            const response = await bookingsAPI.getById(id);
            setBooking(response.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
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
                    onClick={() => navigate(user?.role === 'agent' ? '/agent-dashboard' : '/dashboard')}
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
        location: bookingLocation,
        notes,
        totalAmount,
        subtotal,
        tax,
        platformFee,
        service,
        agent,
        user: customer,
        _id,
        coupon_code,
        discount_amount
    } = booking;

    const isAgent = user?.role === 'agent';
    const canCancel = ['pending', 'confirmed', 'assigned'].includes(status) && !isAgent;

    // ----- UI FRAGMENTS -----

    const renderServiceDetails = () => (
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
            {(date || time || address) && (
                <div className="mt-6 border-t border-surface-100 pt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm text-surface-500 mb-1">
                            <Calendar className="h-4 w-4" /> Date & Time
                        </h3>
                        <p className="font-medium text-surface-900">{new Date(date).toLocaleDateString()} at {time}</p>
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-sm text-surface-500 mb-1">
                            <MapPin className="h-4 w-4" /> Location
                        </h3>
                        <p className="font-medium text-surface-900 break-words">{address}</p>
                        {bookingLocation && <p className="text-xs text-primary-600 font-medium">📍 {bookingLocation}</p>}
                    </div>
                    {notes && (
                        <div className="sm:col-span-2">
                            <h3 className="flex items-center gap-2 text-sm text-surface-500 mb-1">
                                <FileText className="h-4 w-4" /> Notes
                            </h3>
                            <p className="text-sm text-surface-600 italic">"{notes}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // =============================
    // AGENT VIEW
    // =============================
    if (isAgent) {
        return (
            <div className="min-h-screen bg-surface-50 pt-20">
                <div className="section-container py-8 max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600">
                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                        </button>
                        <span className="badge-primary px-3 py-1 text-sm font-medium uppercase tracking-wider">
                            Status: {status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Actions Card */}
                            {['pending', 'assigned', 'accepted', 'confirmed', 'in_progress'].includes(status) && (
                                <div className="card bg-primary-50 border-primary-200">
                                    <h2 className="text-lg font-bold text-primary-900 mb-4">Required Actions</h2>
                                    <div className="flex flex-wrap gap-3">
                                        {(status === 'pending' || status === 'assigned') && (
                                            <>
                                                <button onClick={() => handleAgentAction('accept')} disabled={actionLoading} className="btn-primary flex-1">
                                                    Accept Booking
                                                </button>
                                                {status === 'assigned' && (
                                                    <button onClick={() => handleAgentAction('reject')} disabled={actionLoading} className="btn-danger flex-1">
                                                        Reject
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {(status === 'accepted' || status === 'confirmed') && (
                                            <button onClick={() => handleAgentAction('in_progress')} disabled={actionLoading} className="btn-primary w-full">
                                                Start Service
                                            </button>
                                        )}
                                        {status === 'in_progress' && (
                                            <button onClick={() => setOtpInputVisible(true)} disabled={actionLoading} className="btn-primary w-full">
                                                Complete Service (Verify OTP)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Service Profile */}
                            {renderServiceDetails()}
                            
                            {/* Chat Box Element */}
                            {['accepted', 'in_progress'].concat(status === 'completed' ? ['completed'] : []).includes(status) && customer && (
                                <ChatBox bookingId={_id} status={status} isAgent={true} />
                            )}
                            
                            {/* Completion Status/Earnings */}
                            {status === 'completed' && (
                                <div className="card bg-green-50 border-green-200">
                                    <h2 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                        <Wallet className="h-5 w-5" /> Job Completed
                                    </h2>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-green-100">
                                        <span className="text-surface-600 font-medium">Your Earnings:</span>
                                        <span className="text-2xl font-bold text-green-700">₹{Number(subtotal).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Customer Information */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="card">
                                <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary-600" />
                                    Customer Details
                                </h2>
                                {customer ? (
                                    <div className="text-sm space-y-4">
                                        <div>
                                            <p className="text-surface-500 mb-1">Name</p>
                                            <p className="font-semibold text-surface-900 text-base">{customer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-surface-500 mb-1">Contact</p>
                                            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-primary-600 font-medium mt-1">
                                                <Phone className="h-4 w-4" /> {customer.phone || 'N/A'}
                                            </a>
                                            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-primary-600 font-medium mt-2">
                                                <Mail className="h-4 w-4" /> {customer.email}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-surface-500">Customer information not available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {otpInputVisible && (
                    <OtpVerifyModal 
                        bookingId={_id} 
                        onClose={() => setOtpInputVisible(false)} 
                        onVerified={async () => {
                            setOtpInputVisible(false);
                            const response = await bookingsAPI.getById(id);
                            setBooking(response.data);
                        }} 
                    />
                )}
            </div>
        );
    }

    // =============================
    // USER VIEW
    // =============================
    return (
        <div className="section-container py-8 pt-24 animate-fade-in">
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

                    {/* OTP Section — only for user when booking is in_progress */}
                    {status === 'in_progress' && booking.otp_code && !booking.otp_verified && (
                        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" id="otp-display-section">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-amber-900">Completion OTP</h2>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Share this OTP with your service provider to complete the job
                                    </p>

                                    {/* OTP Code Display */}
                                    <div className="mt-4 flex justify-center gap-2">
                                        {booking.otp_code.split('').map((digit, i) => (
                                            <div
                                                key={i}
                                                className="flex h-14 w-12 items-center justify-center rounded-xl bg-white border-2 border-amber-300 text-2xl font-bold text-amber-800 shadow-sm"
                                            >
                                                {digit}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Timer */}
                                    <div className="mt-4 text-center">
                                        {otpTimeLeft > 0 ? (
                                            <p className="text-sm text-amber-700 font-medium">
                                                ⏳ OTP expires in{' '}
                                                <span className="font-bold text-amber-900">
                                                    {Math.floor(otpTimeLeft / 60)}:{String(otpTimeLeft % 60).padStart(2, '0')}
                                                </span>
                                            </p>
                                        ) : (
                                            <p className="text-sm text-red-600 font-medium">⚠️ OTP has expired</p>
                                        )}
                                    </div>

                                    {/* Resend button */}
                                    <div className="mt-3 text-center">
                                        <button
                                            onClick={handleResendOtp}
                                            disabled={resendingOtp || resendCooldown > 0}
                                            className="text-sm text-amber-700 hover:text-amber-900 font-medium disabled:text-amber-400 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
                                        >
                                            {resendingOtp ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            )}
                                            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OTP Verified badge */}
                    {booking.otp_verified && status === 'completed' && (
                        <div className="card bg-green-50 border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <p className="text-sm font-medium text-green-700">OTP verified — service completion confirmed by customer</p>
                            </div>
                        </div>
                    )}

                    {/* Review Section */}
                    {status === 'completed' && (
                        <ReviewSection 
                            bookingId={_id} 
                            serviceId={service?._id} 
                            status={status} 
                            agentId={agent?._id} 
                        />
                    )}

                    {/* Service Info */}
                    {renderServiceDetails()}

                    {/* Chat Box Element */}
                    {['accepted', 'in_progress', 'completed'].includes(status) && agent && (
                        <ChatBox bookingId={_id} status={status} isAgent={false} />
                    )}

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
                                    {agent.service_category && (
                                        <p className="text-sm font-medium text-primary-700 mt-0.5 flex items-center gap-1">
                                            Profession: <span className="font-bold inline-flex items-center gap-1 bg-primary-100 px-2 py-0.5 rounded-md">{agent.service_category} {getCategoryIcon(agent.service_category)}</span>
                                        </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-primary-700">
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
                    {/* Payment Summary */}
                    <div className="card">
                        <h3 className="flex items-center gap-2 font-semibold text-surface-900 mb-4">
                            <CreditCard className="h-4 w-4 text-primary-600" />
                            Payment Summary
                        </h3>

                        <div className="space-y-3 text-sm border-b border-surface-100 pb-4 mb-4">
                            <div className="flex justify-between text-surface-600">
                                <span>Service Total</span>
                                <span>₹{(Number(subtotal) + (Number(discount_amount) || 0)).toFixed(2)}</span>
                            </div>
                            {Number(discount_amount) > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount ({coupon_code})</span>
                                    <span>-₹{Number(discount_amount).toFixed(2)}</span>
                                </div>
                            )}
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
