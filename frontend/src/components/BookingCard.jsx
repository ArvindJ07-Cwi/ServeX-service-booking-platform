import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import StatusTimeline from './StatusTimeline';

const statusConfig = {
    pending: { label: 'New Request', className: 'badge-warning' },
    confirmed: { label: 'Confirmed', className: 'badge-primary' },
    assigned: { label: 'Assigned to You', className: 'badge-primary' },
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
        <div className="card group" id={`booking-card-${_id}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                    {/* Service Image */}
                    <div className="hidden sm:block h-20 w-20 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                        {service?.image ? (
                            <img src={service.image} alt={service?.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                                <span className="text-xl font-bold text-primary-300">{(service?.name || 'S').charAt(0)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-surface-900 line-clamp-1">
                                    {service?.name || 'Service Booking'}
                                </h3>
                                <p className="text-xs text-surface-400 mt-0.5 font-mono">
                                    #{String(_id || '').slice(-8).toUpperCase() || 'N/A'}
                                </p>
                            </div>
                            <span className={statusInfo.className}>{statusInfo.label}</span>
                        </div>

                        {/* Details */}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-surface-500">
                            {date && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-surface-400" />
                                    {formatDate(date)}
                                </span>
                            )}
                            {time && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-surface-400" />
                                    {time}
                                </span>
                            )}
                            {address && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-surface-400" />
                                    <span className="line-clamp-1">{address}</span>
                                </span>
                            )}
                            {booking?.location && (
                                <span className="flex items-center gap-1 text-primary-600 font-medium">
                                    📍 {booking.location}
                                </span>
                            )}
                        </div>

                        {/* Agent/User info */}
                        {(bookingUser || agent) && (
                            <div className="mt-2 text-xs text-surface-400">
                                {bookingUser && <span>Customer: <span className="font-medium text-surface-600">{bookingUser.name}</span></span>}
                                {agent && <span className="ml-3">Agent: <span className="font-medium text-surface-600">{agent.name}</span></span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Price + Link */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                    {totalAmount > 0 && (
                        <p className="text-lg font-bold text-surface-900">₹{totalAmount}</p>
                    )}
                    <Link
                        to={`/bookings/${_id}`}
                        className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Details <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Agent actions */}
            {showActions && status !== 'completed' && status !== 'cancelled' && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-100 pt-4">
                    {(status === 'pending' || status === 'assigned') && (
                        <>
                            <button
                                onClick={() => onAction?.(_id, 'accept')}
                                className="btn-primary text-xs py-2"
                            >
                                {status === 'assigned' ? 'Accept Assignment' : 'Accept Request'}
                            </button>
                            {status === 'assigned' && (
                                <button
                                    onClick={() => onAction?.(_id, 'reject')}
                                    className="btn-danger text-xs py-2"
                                >
                                    Reject
                                </button>
                            )}
                        </>
                    )}
                    {(status === 'accepted' || status === 'confirmed') && (
                        <button
                            onClick={() => onAction?.(_id, 'in_progress')}
                            className="btn-primary text-xs py-2"
                        >
                            Start Service
                        </button>
                    )}
                    {status === 'in_progress' && (
                        <button
                            onClick={() => onOtpVerify?.(_id)}
                            className="btn-primary text-xs py-2"
                            id={`complete-otp-btn-${_id}`}
                        >
                            🔐 Complete with OTP
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Skeleton variant
export function BookingCardSkeleton() {
    return (
        <div className="card">
            <div className="flex justify-between">
                <div className="flex-1">
                    <div className="h-4 w-48 skeleton mb-2" />
                    <div className="h-3 w-20 skeleton mb-3" />
                    <div className="flex gap-4">
                        <div className="h-3 w-24 skeleton" />
                        <div className="h-3 w-20 skeleton" />
                    </div>
                </div>
                <div className="h-5 w-16 skeleton" />
            </div>
        </div>
    );
}
