import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, paymentAPI } from '../services/api';
import StatusTimeline from '../components/StatusTimeline';
import ReviewSection from '../components/ReviewSection';
import OtpVerifyModal from '../components/OtpVerifyModal';
import ChatBox from '../components/ChatBox';
import {
    ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail,
    CreditCard, FileText, Loader2, AlertCircle, XCircle,
    CheckCircle2, ShieldCheck, RefreshCw, Wallet, Tag
} from 'lucide-react';

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

    useEffect(() => {
        let isMounted = true;
        const fetchBooking = async () => {
            if (!booking) setLoading(true);
            try {
                const response = await bookingsAPI.getById(id);
                if (isMounted) { setBooking(response.data); setError(null); }
            } catch (err) {
                if (isMounted) setError('Booking not found or access denied.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchBooking();
        const interval = setInterval(fetchBooking, 5000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [id]);

    useEffect(() => {
        if (booking?.otp_expires_at && booking?.status === 'in_progress' && !booking?.otp_verified) {
            const updateTimer = () => {
                const remaining = Math.max(0, Math.floor((new Date(booking.otp_expires_at).getTime() - Date.now()) / 1000));
                setOtpTimeLeft(remaining);
            };
            updateTimer();
            const timer = setInterval(updateTimer, 1000);
            return () => clearInterval(timer);
        }
    }, [booking?.otp_expires_at, booking?.status, booking?.otp_verified]);

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
            alert('Failed to cancel booking.');
        } finally {
            setCancelling(false);
        }
    };

    const handleAgentAction = async (action) => {
        setActionLoading(true);
        try {
            if (action === 'accept') await bookingsAPI.accept(id);
            else if (action === 'reject') { await bookingsAPI.reject(id); navigate('/agent-dashboard'); return; }
            else await bookingsAPI.updateStatus(id, action);
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
                <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="section-container py-16 text-center">
                <AlertCircle className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-600">{error}</p>
                <button onClick={() => navigate(user?.role === 'agent' ? '/agent-dashboard' : '/dashboard')} className="btn-secondary mt-4">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (!booking) return null;

    const { status, date, time, address, location: bookingLocation, notes, totalAmount, subtotal, tax, platformFee, service, agent, user: customer, _id, coupon_code, discount_amount } = booking;
    const isAgent = user?.role === 'agent';
    const canCancel = ['pending', 'confirmed', 'assigned'].includes(status) && !isAgent;

    // Shared service details fragment
    const renderServiceDetails = () => (
        <div className="card p-5">
            <h2 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-surface-400" />
                Service Details
            </h2>
            <div className="flex gap-4">
                <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-surface-100 overflow-hidden">
                    {service?.image ? (
                        <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-400 text-lg font-semibold">
                            {service?.name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-surface-900">{service?.name}</h3>
                    <p className="text-xs text-surface-500 mt-1 line-clamp-2">{service?.description}</p>
                    {service?.duration && <p className="text-xs text-primary-600 mt-1.5 font-medium">{service.duration}</p>}
                </div>
            </div>
            {(date || time || address) && (
                <div className="mt-4 border-t border-surface-100 pt-4 grid gap-3 sm:grid-cols-2">
                    {(date || time) && (
                        <div>
                            <p className="text-[11px] text-surface-400 uppercase tracking-wider mb-1">Schedule</p>
                            <p className="text-sm font-medium text-surface-900 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-surface-400" />
                                {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {time}
                            </p>
                        </div>
                    )}
                    {address && (
                        <div>
                            <p className="text-[11px] text-surface-400 uppercase tracking-wider mb-1">Location</p>
                            <p className="text-sm font-medium text-surface-900 flex items-start gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-surface-400 mt-0.5 flex-shrink-0" />
                                <span>{address}</span>
                            </p>
                            {bookingLocation && <p className="text-xs text-primary-600 font-medium ml-5 mt-0.5">{bookingLocation}</p>}
                        </div>
                    )}
                    {notes && (
                        <div className="sm:col-span-2">
                            <p className="text-[11px] text-surface-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-sm text-surface-600 italic">"{notes}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // ===== AGENT VIEW =====
    if (isAgent) {
        return (
            <div className="bg-surface-50 min-h-screen">
                <div className="section-container py-8 max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        <span className="badge-primary text-xs uppercase tracking-wider">{status.replace('_', ' ')}</span>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-5">
                            {/* Actions */}
                            {['pending', 'assigned', 'accepted', 'confirmed', 'in_progress'].includes(status) && (
                                <div className="card p-5 border-primary-200 bg-primary-50/50">
                                    <h2 className="text-sm font-semibold text-surface-900 mb-3">Actions Required</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {(status === 'pending' || status === 'assigned') && (
                                            <>
                                                <button onClick={() => handleAgentAction('accept')} disabled={actionLoading} className="btn-primary text-sm">Accept Booking</button>
                                                {status === 'assigned' && (
                                                    <button onClick={() => handleAgentAction('reject')} disabled={actionLoading} className="btn-danger text-sm">Reject</button>
                                                )}
                                            </>
                                        )}
                                        {(status === 'accepted' || status === 'confirmed') && (
                                            <button onClick={() => handleAgentAction('in_progress')} disabled={actionLoading} className="btn-primary text-sm w-full">Start Service</button>
                                        )}
                                        {status === 'in_progress' && (
                                            <button onClick={() => setOtpInputVisible(true)} disabled={actionLoading} className="btn-primary text-sm w-full">
                                                <ShieldCheck className="h-4 w-4" /> Complete Service (Verify OTP)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {renderServiceDetails()}

                            {['accepted', 'in_progress', 'completed'].includes(status) && customer && (
                                <ChatBox bookingId={_id} status={status} isAgent={true} />
                            )}

                            {status === 'completed' && (
                                <div className="card p-5 bg-success-50 border-success-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-success-600 font-medium">Job Completed</p>
                                            <p className="text-sm text-success-700 mt-0.5">Your Earnings</p>
                                        </div>
                                        <p className="text-xl font-semibold text-success-800">₹{Number(subtotal).toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Customer sidebar */}
                        <div className="lg:col-span-1">
                            <div className="card p-5 sticky top-24">
                                <h2 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4 text-surface-400" /> Customer
                                </h2>
                                {customer ? (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[11px] text-surface-400 uppercase tracking-wider">Name</p>
                                            <p className="text-sm font-medium text-surface-900">{customer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-surface-400 uppercase tracking-wider">Contact</p>
                                            <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-sm text-primary-600 font-medium mt-1">
                                                <Phone className="h-3.5 w-3.5" /> {customer.phone || 'N/A'}
                                            </a>
                                            <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-sm text-primary-600 font-medium mt-1">
                                                <Mail className="h-3.5 w-3.5" /> {customer.email}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-surface-500">Customer info not available.</p>
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

    // ===== USER VIEW =====
    return (
        <div className="bg-surface-50 min-h-screen">
            <div className="section-container py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        <h1 className="text-2xl font-semibold text-surface-900">
                            Booking <span className="text-surface-400 font-mono text-lg">#{String(_id).slice(-8).toUpperCase()}</span>
                        </h1>
                        <p className="text-sm text-surface-500 mt-1">
                            Booked on {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    {canCancel && (
                        <button onClick={handleCancel} disabled={cancelling} className="btn-danger w-full md:w-auto">
                            {cancelling ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</> : 'Cancel Booking'}
                        </button>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Status Timeline */}
                        <div className="card p-5">
                            <h2 className="text-sm font-semibold text-surface-900 mb-5">Booking Status</h2>
                            <StatusTimeline currentStatus={status} />
                        </div>

                        {/* OTP Section */}
                        {status === 'in_progress' && booking.otp_code && !booking.otp_verified && (
                            <div className="card p-5 border-warning-200 bg-warning-50" id="otp-display-section">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600 flex-shrink-0">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-sm font-semibold text-surface-900">Completion OTP</h2>
                                        <p className="text-xs text-surface-500 mt-0.5">Share this code with your service provider</p>

                                        <div className="mt-3 flex gap-1.5">
                                            {booking.otp_code.split('').map((digit, i) => (
                                                <div key={i} className="flex h-10 w-9 items-center justify-center rounded-lg bg-white border border-warning-200 text-lg font-semibold text-surface-900">
                                                    {digit}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3">
                                            {otpTimeLeft > 0 ? (
                                                <p className="text-xs text-surface-500">
                                                    Expires in <span className="font-semibold text-warning-700">{Math.floor(otpTimeLeft / 60)}:{String(otpTimeLeft % 60).padStart(2, '0')}</span>
                                                </p>
                                            ) : (
                                                <p className="text-xs text-danger-500 font-medium">OTP expired</p>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleResendOtp}
                                            disabled={resendingOtp || resendCooldown > 0}
                                            className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:text-surface-400 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors"
                                        >
                                            {resendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OTP Verified */}
                        {booking.otp_verified && status === 'completed' && (
                            <div className="card p-4 bg-success-50 border-success-200">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-success-600" />
                                    <p className="text-sm font-medium text-success-700">OTP verified — service confirmed</p>
                                </div>
                            </div>
                        )}

                        {/* Review */}
                        {status === 'completed' && (
                            <ReviewSection bookingId={_id} serviceId={service?._id} status={status} agentId={agent?._id} />
                        )}

                        {renderServiceDetails()}

                        {/* Chat */}
                        {['accepted', 'in_progress', 'completed'].includes(status) && agent && (
                            <ChatBox bookingId={_id} status={status} isAgent={false} />
                        )}

                        {/* Agent Info */}
                        {agent && (
                            <div className="card p-5">
                                <h2 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4 text-surface-400" /> Assigned Professional
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold border border-primary-100">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-surface-900">{agent.name}</p>
                                        {agent.service_category && (
                                            <p className="text-xs text-surface-500 mt-0.5 flex items-center gap-1">
                                                <Tag className="h-3 w-3" /> {agent.service_category}
                                            </p>
                                        )}
                                        <div className="flex gap-3 mt-1.5 text-xs text-primary-600">
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

                    {/* Payment Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card p-5 sticky top-24">
                            <h3 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-surface-400" /> Payment Summary
                            </h3>

                            <div className="space-y-2.5 text-sm border-b border-surface-100 pb-4 mb-4">
                                <div className="flex justify-between text-surface-500">
                                    <span>Service</span>
                                    <span>₹{(Number(subtotal) + (Number(discount_amount) || 0)).toFixed(2)}</span>
                                </div>
                                {Number(discount_amount) > 0 && (
                                    <div className="flex justify-between text-success-600 font-medium">
                                        <span>Discount ({coupon_code})</span>
                                        <span>-₹{Number(discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-surface-500">
                                    <span>Taxes (18%)</span>
                                    <span>₹{Number(tax).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-surface-500">
                                    <span>Platform fee</span>
                                    <span>₹{Number(platformFee).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between font-semibold text-surface-900">
                                <span>Total Paid</span>
                                <span>₹{Number(totalAmount).toFixed(2)}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-success-50 py-2 text-xs font-medium text-success-700">
                                <CheckCircle2 className="h-3 w-3" /> Payment Successful
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
