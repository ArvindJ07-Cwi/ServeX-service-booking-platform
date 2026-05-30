import { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReviewSection({ bookingId, serviceId, status, agentId }) {
    const { user } = useAuth();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchReview = async () => {
            if (status !== 'completed') {
                if (isMounted) setLoading(false);
                return;
            }
            try {
                const res = await reviewsAPI.getByBooking(bookingId);
                if (isMounted) {
                    setReview(res.data);
                }
            } catch (err) {
                // 404 means no review yet, which is fine
                if (err.response?.status !== 404) {
                    console.error('Failed to fetch review:', err);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchReview();
        return () => { isMounted = false; };
    }, [bookingId, status]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating from 1 to 5 stars');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await reviewsAPI.create({
                booking_id: bookingId,
                rating,
                comment
            });
            setReview(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="h-24 w-full skeleton rounded-xl"></div>;
    }

    if (status !== 'completed') {
        return null;
    }

    // Rating labels
    const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    if (review) {
        return (
            <div className="card mt-6 border-success-500/20 bg-success-50/30">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
                            <CheckCircle2 className="h-4.5 w-4.5 text-success-500" />
                            Your Review
                        </h3>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}`}
                                />
                            ))}
                        </div>
                    </div>
                    {review.comment && (
                        <div className="bg-white rounded-lg border border-surface-100 p-4">
                            <p className="text-sm text-surface-700 italic leading-relaxed">"{review.comment}"</p>
                        </div>
                    )}
                    <p className="text-xs text-surface-400 mt-3 text-right">
                        Submitted on {new Date(review.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>
        );
    }

    if (user?.role !== 'user') {
        return null; // Agents/Admins don't see the comment box if user hasn't commented
    }

    return (
        <div className="card mt-6">
            <div className="p-5">
                <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-5">
                    <Star className="h-4.5 w-4.5 text-amber-400" />
                    Rate your experience
                </h3>
                
                {error && (
                    <div className="mb-4 text-sm text-danger-600 bg-danger-50 p-3 rounded-lg border border-danger-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Star Rating Selector */}
                    <div className="flex flex-col items-center py-3 bg-surface-50 rounded-xl">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${
                                            star <= (hoverRating || rating) 
                                                ? 'text-amber-400 fill-amber-400' 
                                                : 'text-surface-200 hover:text-amber-200'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm text-surface-500 mt-2 font-medium">
                            {rating === 0 ? 'Select a rating' : ratingLabels[rating - 1]}
                        </span>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">
                            Write a review (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="How was the service? Was the professional helpful?"
                            rows={3}
                            className="input-field resize-none"
                        ></textarea>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={submitting || rating === 0}
                            className="btn-primary"
                        >
                            {submitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                            ) : (
                                'Submit Review'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
