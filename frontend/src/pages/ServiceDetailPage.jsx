import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Clock, Star, CheckCircle2, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

export default function ServiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const response = await servicesAPI.getById(id);
                setService(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load service details.');
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(service);
        // Optionally show toast or redirect
        navigate('/cart');
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="section-container py-12 text-center text-red-500">
                <p>{error || 'Service not found'}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 btn-secondary"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12">
            {/* Header / Image Area */}
            <div className="relative h-[40vh] w-full overflow-hidden bg-surface-900">
                {service.image && (
                    <img
                        src={service.image}
                        alt={service.name}
                        className="h-full w-full object-cover opacity-60"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="section-container absolute bottom-0 left-0 right-0 py-8 text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-sm text-surface-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="mb-2 inline-block rounded-full bg-primary-600/90 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                                {service.category}
                            </span>
                            <h1 className="text-3xl font-bold md:text-5xl">{service.name}</h1>
                            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-surface-200">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{service.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                                    <span>4.8 (120 reviews)</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-3xl font-bold">₹{service.price}</div>
                            <div className="text-sm text-surface-400">Fixed Price</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-container mt-12 grid gap-12 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-surface-900 mb-4">Description</h2>
                        <p className="text-surface-600 leading-relaxed">
                            {service.description}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-surface-900 mb-4">What's Included</h2>
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {['Professional Equipment', 'Experienced Staff', 'Safety Protocols', 'Satisfaction Guarantee'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-surface-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {/* Sidebar Action */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-2xl border border-surface-200 bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-surface-900">Booking Summary</h3>

                        <div className="mt-6 space-y-4 border-t border-surface-100 pt-4">
                            <div className="flex justify-between text-surface-600">
                                <span>Service Price</span>
                                <span>₹{service.price}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
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
                            className="btn-primary mt-6 w-full py-4 text-base"
                        >
                            Add to Cart
                        </button>

                        <p className="mt-4 text-center text-xs text-surface-400">
                            Book now, pay later options available.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
