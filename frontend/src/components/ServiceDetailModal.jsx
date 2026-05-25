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
            const fetchReviews = async () => {
                setLoadingReviews(true);
                try {
                    const res = await reviewsAPI.getByService(service._id);
                    setReviews(res.data.reviews || res.data || []);
                } catch (err) {
                    console.error("Failed to fetch reviews", err);
                } finally {
                    setLoadingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [isOpen, service]);

    if (!isOpen || !service) return null;

    const handleConfirmBooking = () => {
        addToCart(service);
        navigate('/cart');
        onClose();
    };

    const mockReviews = [
        { id: 1, name: 'Anjali P.', rating: 5, comment: 'Excellent service, highly professional!' },
        { id: 2, name: 'Rohan M.', rating: 4, comment: 'Good quality but arrived a bit late.' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-up">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white/90 rounded-full backdrop-blur-md transition-colors z-10 text-surface-900"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Cover Image */}
                <div className="h-48 w-full bg-surface-100 relative">
                    {service.image ? (
                        <img 
                            src={service.image} 
                            alt={service.name} 
                            className="w-full h-full object-cover rounded-t-2xl" 
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-2xl">
                            <span className="text-5xl font-bold text-primary-300">{service.name?.charAt(0)}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                        <h2 className="text-2xl font-bold text-surface-900">{service.name}</h2>
                        <div className="text-right flex-shrink-0 ml-4">
                            <span className="text-xl font-bold text-primary-600">₹{service.price}</span>
                        </div>
                    </div>
                    
                    <p className="text-surface-600 text-sm mb-4 leading-relaxed">
                        {service.description}
                    </p>

                    {/* Stats & Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-6 border-y border-surface-100 py-4">
                        <div className="flex items-center gap-1.5 text-surface-700">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span>{service.duration || '1 hr'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-surface-700">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span>{(service.rating || 4.5).toFixed(1)}/5 ({service.reviewCount || 120} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-surface-700">
                            <User className="w-4 h-4 text-emerald-500" />
                            <span>{service.bookings || '500+'} Bookings</span>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-surface-900 mb-3">Recent Reviews</h3>
                        <div className="space-y-3">
                            {loadingReviews ? (
                                <div className="flex justify-center py-4 text-primary-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
                            ) : reviews.length > 0 ? (
                                reviews.slice(0, 3).map(review => (
                                    <div key={review._id || review.id} className="bg-surface-50 p-3 rounded-lg text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-surface-900">
                                                {review.user?.name || review.customer?.name || 'Customer'}
                                            </span>
                                            <div className="flex items-center">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="ml-1 text-xs text-surface-500">{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-surface-600 text-xs">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                mockReviews.map(review => (
                                    <div key={review.id} className="bg-surface-50 p-3 rounded-lg text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-surface-900">{review.name}</span>
                                            <div className="flex items-center">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="ml-1 text-xs text-surface-500">{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-surface-600 text-xs">{review.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CTA Action */}
                    <button 
                        onClick={handleConfirmBooking}
                        className="btn-primary w-full py-3.5 text-base shadow-md"
                    >
                        Confirm Booking • ₹{service.price}
                    </button>
                </div>
            </div>
        </div>
    );
}
