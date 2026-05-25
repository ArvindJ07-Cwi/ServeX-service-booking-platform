import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
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

    if (review) {
        return (
            <div className="card bg-green-50/50 border-green-100 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Your Review
                    </h3>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-5 w-5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-200'}`}
                            />
                        ))}
                    </div>
                </div>
                {review.comment && (
                    <div className="bg-white p-4 rounded-lg border border-surface-100 text-surface-700 italic">
                        "{review.comment}"
                    </div>
                )}
                <p className="text-xs text-surface-400 mt-3 text-right">
                    Submitted on {new Date(review.created_at).toLocaleDateString()}
                </p>
            </div>
        );
    }

    if (user?.role !== 'user') {
        return null; // Agents/Admins don't see the comment box if user hasn't commented
    }

    return (
        <div className="card mt-6">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                Rate your experience
            </h3>
            
            {error && (
                <div className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col items-center py-2">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="p-1 focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`h-8 w-8 transition-colors ${
                                        star <= (hoverRating || rating) 
                                            ? 'text-yellow-400 fill-yellow-400' 
                                            : 'text-surface-200 hover:text-yellow-200'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="text-sm text-surface-500 mt-2 font-medium">
                        {rating === 0 ? 'Select a rating' : ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
                    </span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">
                        Write a review (optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="How was the service? Was the professional helpful?"
                        rows={3}
                        className="input-field resize-none w-full p-3 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-800"
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={submitting || rating === 0}
                        className="btn-primary"
                    >
                        {submitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2"/> Submitting...</>
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
