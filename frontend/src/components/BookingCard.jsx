import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ChevronRight, ShieldCheck } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Pending', className: 'badge-warning' },
    confirmed: { label: 'Confirmed', className: 'badge-primary' },
    assigned: { label: 'Assigned', className: 'badge-primary' },
    accepted: { label: 'Accepted', className: 'badge-primary' },
    in_progress: { label: 'In Progress', className: 'badge-primary' },
    completed: { label: 'Completed', className: 'badge-success' },
    cancelled: { label: 'Cancelled', className: 'badge-danger' },
};

export default function BookingCard({ booking, showActions = false, onAction, onOtpVerify }) {
    const {
        _id,
        service,
        status = 'pending',
        date,
        time,
        address,
        totalAmount,
        user: bookingUser,
        agent,
    } = booking || {};

    const statusInfo = statusConfig[status] || statusConfig.pending;

    const formatDate = (d) => {
        if (!d) return 'TBD';
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="card p-4" id={`booking-card-${_id}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-3.5 flex-1 min-w-0">
                    {/* Service Image */}
                    <div className="hidden sm:flex h-14 w-14 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
                        {service?.image ? (
                            <img src={service.image} alt={service?.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary-50">
                                <span className="text-base font-semibold text-primary-400">{(service?.name || 'S').charAt(0)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-surface-900 line-clamp-1">
                                    {service?.name || 'Service Booking'}
                                </h3>
                                <p className="text-[11px] text-surface-400 mt-0.5 font-mono">
                                    #{String(_id || '').slice(-8).toUpperCase() || 'N/A'}
                                </p>
                            </div>
                            <span className={statusInfo.className}>{statusInfo.label}</span>
                        </div>

                        {/* Details */}
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500">
                            {date && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-surface-400" />
                                    {formatDate(date)}
                                </span>
                            )}
                            {time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-surface-400" />
                                    {time}
                                </span>
                            )}
                            {address && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-surface-400" />
                                    <span className="line-clamp-1">{address}</span>
                                </span>
                            )}
                            {booking?.location && (
                                <span className="flex items-center gap-1 text-primary-600 font-medium">
                                    <MapPin className="h-3 w-3" />
                                    {booking.location}
                                </span>
                            )}
                        </div>

                        {/* Customer/Agent info */}
                        {(bookingUser || agent) && (
                            <div className="mt-2 text-[11px] text-surface-400">
                                {bookingUser && <span>Customer: <span className="font-medium text-surface-600">{bookingUser.name}</span></span>}
                                {agent && <span className="ml-3">Agent: <span className="font-medium text-surface-600">{agent.name}</span></span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Price + Details link */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    {totalAmount > 0 && (
                        <p className="text-sm font-semibold text-surface-900">₹{totalAmount}</p>
                    )}
                    <Link
                        to={`/bookings/${_id}`}
                        className="flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Details <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* Agent actions */}
            {showActions && status !== 'completed' && status !== 'cancelled' && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-100 pt-3">
                    {(status === 'pending' || status === 'assigned') && (
                        <>
                            <button
                                onClick={() => onAction?.(_id, 'accept')}
                                className="btn-primary text-xs py-1.5 px-3"
                            >
                                {status === 'assigned' ? 'Accept Assignment' : 'Accept'}
                            </button>
                            {status === 'assigned' && (
                                <button
                                    onClick={() => onAction?.(_id, 'reject')}
                                    className="btn-danger text-xs py-1.5 px-3"
                                >
                                    Reject
                                </button>
                            )}
                        </>
                    )}
                    {(status === 'accepted' || status === 'confirmed') && (
                        <button
                            onClick={() => onAction?.(_id, 'in_progress')}
                            className="btn-primary text-xs py-1.5 px-3"
                        >
                            Start Service
                        </button>
                    )}
                    {status === 'in_progress' && (
                        <button
                            onClick={() => onOtpVerify?.(_id)}
                            className="btn-primary text-xs py-1.5 px-3"
                            id={`complete-otp-btn-${_id}`}
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Complete with OTP
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function BookingCardSkeleton() {
    return (
        <div className="card p-4">
            <div className="flex gap-3.5">
                <div className="hidden sm:block skeleton h-14 w-14 rounded-lg" />
                <div className="flex-1">
                    <div className="skeleton h-4 w-48 mb-1.5" />
                    <div className="skeleton h-3 w-20 mb-3" />
                    <div className="flex gap-4">
                        <div className="skeleton h-3 w-24" />
                        <div className="skeleton h-3 w-20" />
                    </div>
                </div>
                <div className="skeleton h-5 w-14" />
            </div>
        </div>
    );
}
