import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { servicesAPI, reviewsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Clock, Star, CheckCircle2, ChevronRight, Loader2, ArrowLeft, User, ShoppingCart } from 'lucide-react';

export default function ServiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServiceAndReviews = async () => {
            try {
                const response = await servicesAPI.getById(id);
                setService(response.data);
                
                // Fetch reviews
                setLoadingReviews(true);
                const reviewRes = await reviewsAPI.getByService(id);
                setReviews(reviewRes.data.reviews || reviewRes.data || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load service details.');
            } finally {
                setLoading(false);
                setLoadingReviews(false);
            }
        };
        fetchServiceAndReviews();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(service);
        // Optionally show toast or redirect
        navigate('/cart');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50 pt-20">
                <div className="section-container py-12">
                    <div className="grid gap-10 lg:grid-cols-5">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="skeleton h-5 w-48" />
                            <div className="skeleton aspect-[16/10] rounded-xl" />
                            <div className="skeleton h-8 w-3/4" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-2/3" />
                        </div>
                        <div className="lg:col-span-2">
                            <div className="skeleton h-64 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen bg-surface-50 pt-20">
                <div className="section-container py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50">
                        <span className="text-2xl">⚠</span>
                    </div>
                    <h2 className="text-lg font-semibold text-surface-900">{error || 'Service not found'}</h2>
                    <p className="text-sm text-surface-500 mt-1 mb-6">The service you're looking for may have been removed or is temporarily unavailable.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const fallbackReviews = [
        { id: 1, name: 'Anjali P.', rating: 5, comment: 'Excellent service, highly professional!' },
        { id: 2, name: 'Rohan M.', rating: 4, comment: 'Good quality but arrived a bit late.' }
    ];

    const displayReviews = reviews.length > 0 ? reviews : fallbackReviews;

    return (
        <div className="min-h-screen bg-surface-50 pt-20 animate-fade-in">
            <div className="section-container py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-surface-500 mb-8">
                    <Link to="/" className="hover:text-surface-700 transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-surface-300" />
                    <Link to="/services" className="hover:text-surface-700 transition-colors">Services</Link>
                    {service.category && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5 text-surface-300" />
                            <Link to={`/services?category=${encodeURIComponent(service.category)}`} className="hover:text-surface-700 transition-colors">
                                {service.category}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-surface-300" />
                    <span className="text-surface-900 font-medium truncate max-w-[200px]">{service.name}</span>
                </nav>

                <div className="grid gap-10 lg:grid-cols-5">
                    {/* Left Column — Image + Details */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Service Image */}
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-100">
                            {service.image ? (
                                <img
                                    src={service.image}
                                    alt={service.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-surface-100 text-5xl font-bold text-surface-300">
                                    {service.name?.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Service Info */}
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                {service.category && (
                                    <span className="badge-primary">{service.category}</span>
                                )}
                                <div className="flex items-center gap-1 text-sm text-surface-500">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    <span className="font-medium text-surface-700">{(service.rating || 4.8).toFixed(1)}</span>
                                    <span>({service.reviewCount || 120} reviews)</span>
                                </div>
                                {service.duration && (
                                    <div className="flex items-center gap-1 text-sm text-surface-500">
                                        <Clock className="h-4 w-4" />
                                        <span>{service.duration}</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">{service.name}</h1>
                        </div>

                        {/* Description */}
                        <section>
                            <h2 className="text-lg font-semibold text-surface-900 mb-3">Description</h2>
                            <p className="text-surface-600 leading-relaxed">
                                {service.description}
                            </p>
                        </section>

                        {/* What's Included */}
                        <section className="card p-6">
                            <h2 className="text-lg font-semibold text-surface-900 mb-4">What's Included</h2>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {['Professional Equipment', 'Experienced Staff', 'Safety Protocols', 'Satisfaction Guarantee'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-surface-600">
                                        <CheckCircle2 className="h-5 w-5 text-success-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Customer Reviews */}
                        <section>
                            <h2 className="text-lg font-semibold text-surface-900 mb-4">Customer Reviews</h2>
                            <div className="space-y-4">
                                {loadingReviews ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                                    </div>
                                ) : (
                                    displayReviews.map(review => (
                                        <div key={review._id || review.id} className="card p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xs ring-1 ring-primary-100">
                                                        {(review.user?.name || review.customer?.name || review.name || 'C').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-surface-900">
                                                            {review.user?.name || review.customer?.name || review.name || 'Customer'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    <span className="text-sm font-medium text-surface-700">{review.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-surface-600 leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column — Sidebar */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24 card p-6">
                            <h3 className="text-lg font-semibold text-surface-900">Booking Summary</h3>

                            <div className="mt-6 space-y-3 border-t border-surface-100 pt-5">
                                <div className="flex justify-between text-sm text-surface-600">
                                    <span>Service Price</span>
                                    <span className="font-medium text-surface-900">₹{service.price}</span>
                                </div>
                                <div className="flex justify-between text-sm text-surface-600">
                                    <span>Taxes & Fees</span>
                                    <span className="text-xs text-surface-400">(Calculated at checkout)</span>
                                </div>
                                <div className="border-t border-surface-100 pt-3 flex justify-between font-bold text-lg text-surface-900">
                                    <span>Total</span>
                                    <span>₹{service.price}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                className="btn-primary mt-6 w-full py-3.5 text-base"
                            >
                                <ShoppingCart className="h-4.5 w-4.5" />
                                Add to Cart
                            </button>

                            <p className="mt-4 text-center text-xs text-surface-400">
                                Book now, pay later options available.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
