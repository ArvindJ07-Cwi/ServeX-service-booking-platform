import { useState, useEffect } from 'react';
import { X, Star, Clock, User, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI } from '../services/api';

export default function ServiceDetailModal({ service, isOpen, onClose }) {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        if (isOpen && service?._id) {
            setLoadingReviews(true);
            reviewsAPI.getByService(service._id)
                .then(res => setReviews(res.data?.reviews || res.data || []))
                .catch(() => setReviews([]))
                .finally(() => setLoadingReviews(false));
        }
    }, [isOpen, service?._id]);

    if (!isOpen || !service) return null;

    const handleConfirmBooking = () => {
        addToCart(service);
        navigate('/cart');
        onClose();
    };

    const displayReviews = reviews.length > 0 ? reviews.slice(0, 3) : [
        { _id: '1', user_name: 'Priya M.', rating: 5, comment: 'Excellent service, very professional and punctual.', createdAt: '2024-01-15' },
        { _id: '2', user_name: 'Rahul K.', rating: 4, comment: 'Good quality work. Would recommend to others.', createdAt: '2024-01-10' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-surface-900/50 animate-fade-in" />

            {/* Modal */}
            <div
                className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Image */}
                <div className="relative h-48 bg-surface-100">
                    {service.image ? (
                        <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-surface-300">
                            {service.name?.charAt(0)}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-surface-700 hover:bg-white transition-colors shadow-sm"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    {service.category && (
                        <span className="absolute bottom-3 left-3 badge-primary">{service.category}</span>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-surface-900">{service.name}</h2>
                            <div className="mt-1.5 flex items-center gap-3 text-sm text-surface-500">
                                {service.duration && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> {service.duration}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    {service.rating || 4.5} ({service.reviewCount || 120})
                                </span>
                            </div>
                        </div>
                        <p className="text-lg font-bold text-surface-900 whitespace-nowrap">₹{service.price}</p>
                    </div>

                    <p className="mt-4 text-sm text-surface-600 leading-relaxed">{service.description}</p>

                    {/* Reviews */}
                    <div className="mt-5 border-t border-surface-100 pt-5">
                        <h3 className="text-sm font-semibold text-surface-900 mb-3">Customer Reviews</h3>
                        {loadingReviews ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-surface-400" /></div>
                        ) : (
                            <div className="space-y-3">
                                {displayReviews.map((review) => (
                                    <div key={review._id} className="rounded-lg bg-surface-50 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-xs font-medium text-surface-600">
                                                {review.user_name?.charAt(0) || <User className="h-3 w-3" />}
                                            </div>
                                            <span className="text-xs font-medium text-surface-700">{review.user_name || 'Customer'}</span>
                                            <div className="flex items-center gap-0.5 ml-auto">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-surface-500 leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleConfirmBooking}
                        className="btn-primary w-full mt-5 py-3"
                    >
                        Add to Cart · ₹{service.price}
                    </button>
                </div>
            </div>
        </div>
    );
}
