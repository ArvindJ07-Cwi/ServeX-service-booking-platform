import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Quote, Star, Sparkles, Shield, Clock, Headphones } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ServiceCard, { ServiceCardSkeleton } from '../components/ServiceCard';
import { servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const testimonials = [
    {
        id: 1,
        name: 'Priya Sharma',
        role: 'Homeowner',
        content: 'ServeX made finding a reliable electrician so easy. The booking process was seamless, and the professional arrived right on time. Highly recommended!',
        rating: 5,
        avatar: 'PS',
    },
    {
        id: 2,
        name: 'Rahul Verma',
        role: 'Business Owner',
        content: 'We use ServeX for all our office maintenance needs. The quality of service is consistently excellent. Their platform is a game-changer.',
        rating: 5,
        avatar: 'RV',
    },
    {
        id: 3,
        name: 'Anita Desai',
        role: 'Apartment Resident',
        content: 'From plumbing to deep cleaning, I have tried multiple services on ServeX. Every experience has been professional and hassle-free.',
        rating: 4,
        avatar: 'AD',
    },
];

const promoBanners = [
    {
        id: 1,
        title: 'First Booking Offer',
        subtitle: 'Get 20% off on your first service booking',
        cta: 'Book Now',
        gradient: 'from-primary-600 to-primary-800',
    },
    {
        id: 2,
        title: 'Refer & Earn',
        subtitle: 'Invite friends and earn ₹200 per referral',
        cta: 'Learn More',
        gradient: 'from-emerald-600 to-teal-700',
    },
];

const whyUs = [
    {
        icon: Shield,
        title: 'Verified Professionals',
        description: 'Every service provider undergoes background verification and skill assessment.',
    },
    {
        icon: Clock,
        title: 'On-Time, Every Time',
        description: 'Track your booking in real-time. We value your time as much as you do.',
    },
    {
        icon: Sparkles,
        title: 'Quality Guaranteed',
        description: 'Not satisfied? We offer a hassle-free resolution within 24 hours.',
    },
    {
        icon: Headphones,
        title: '24/7 Support',
        description: 'Our support team is always available to help you with any queries.',
    },
];

const howItWorks = [
    {
        step: '01',
        title: 'Choose a Service',
        description: 'Browse our wide range of verified home services and pick what you need.',
    },
    {
        step: '02',
        title: 'Book a Slot',
        description: 'Select your preferred date, time, and provide your address for the visit.',
    },
    {
        step: '03',
        title: 'Get It Done',
        description: 'A verified professional arrives on time and delivers quality service.',
    },
];

export default function Home() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeBanner, setActiveBanner] = useState(0);

    // Redirect agents/admins to their dashboards — they shouldn't see the user home page
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'agent') {
                navigate('/agent-dashboard', { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const { data } = await servicesAPI.getAll({ limit: 6 });
                setServices(data.services || data || []);
            } catch {
                // Use empty array on error — will show empty state
                setServices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Auto-rotate banners
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveBanner((prev) => (prev + 1) % promoBanners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleCategoryClick = (category) => {
        navigate(`/services?category=${encodeURIComponent(category.name)}`);
    };

    return (
        <div>
            {/* Hero */}
            <HeroSection />

            {/* Browse by Category */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="section-container">
                    <div className="text-center mb-10">
                        <h2 className="page-header">Browse by Category</h2>
                        <p className="page-subtitle mt-2">Find the perfect service for your needs</p>
                    </div>
                    <CategoryGrid onCategoryClick={handleCategoryClick} />
                </div>
            </section>

            {/* Promo Banners */}
            <section className="py-12 bg-surface-50">
                <div className="section-container">
                    <div className="relative overflow-hidden rounded-2xl">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${activeBanner * 100}%)` }}
                        >
                            {promoBanners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className={`w-full flex-shrink-0 bg-gradient-to-r ${banner.gradient} rounded-2xl p-8 sm:p-12`}
                                >
                                    <div className="max-w-lg">
                                        <h3 className="text-2xl sm:text-3xl font-bold text-white">{banner.title}</h3>
                                        <p className="mt-2 text-white/80 text-sm sm:text-base">{banner.subtitle}</p>
                                        <Link
                                            to="/services"
                                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 hover:bg-surface-50 transition-colors"
                                        >
                                            {banner.cta} <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Dots */}
                        <div className="absolute bottom-4 right-6 flex gap-1.5">
                            {promoBanners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveBanner(i)}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === activeBanner ? 'w-6 bg-white' : 'w-2 bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Services */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="section-container">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h2 className="page-header">Featured Services</h2>
                            <p className="page-subtitle mt-2">Most popular services near you</p>
                        </div>
                        <Link
                            to="/services"
                            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                            : services.length > 0
                                ? services.map((service) => (
                                    <ServiceCard key={service._id} service={service} />
                                ))
                                : (
                                    <div className="col-span-full text-center py-10 text-surface-500">
                                        No services available at the moment.
                                    </div>
                                )
                        }
                    </div>

                    <div className="mt-8 text-center sm:hidden">
                        <Link to="/services" className="btn-secondary">
                            View all services <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 sm:py-20 bg-surface-50">
                <div className="section-container">
                    <div className="text-center mb-12">
                        <h2 className="page-header">How It Works</h2>
                        <p className="page-subtitle mt-2">Book a service in three simple steps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
                        {howItWorks.map((item, index) => (
                            <div key={item.step} className="relative text-center">
                                {/* Connector line between steps */}
                                {index < howItWorks.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-surface-200" />
                                )}
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white text-xl font-bold">
                                    {item.step}
                                </div>
                                <h3 className="text-base font-semibold text-surface-900">{item.title}</h3>
                                <p className="mt-2 text-sm text-surface-500 leading-relaxed max-w-xs mx-auto">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose ServeX */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="section-container">
                    <div className="text-center mb-12">
                        <h2 className="page-header">Why Choose ServeX</h2>
                        <p className="page-subtitle mt-2">Built for trust, speed, and reliability</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
                        {whyUs.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="card-hover p-6 text-center group">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-200 group-hover:scale-105">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
                                <p className="mt-2 text-sm text-surface-500 leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 sm:py-20 bg-surface-50">
                <div className="section-container">
                    <div className="text-center mb-12">
                        <h2 className="page-header">What Our Customers Say</h2>
                        <p className="page-subtitle mt-2">Real feedback from real users</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                        {testimonials.map((t) => (
                            <div key={t.id} className="card p-6 relative">
                                <Quote className="absolute top-5 right-5 h-7 w-7 text-primary-100" />
                                <div className="flex items-center gap-1 mb-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < t.rating
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-surface-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-surface-600 leading-relaxed">{t.content}</p>
                                <div className="mt-5 flex items-center gap-3 border-t border-surface-100 pt-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700 text-sm font-semibold ring-1 ring-primary-100">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-surface-900">{t.name}</p>
                                        <p className="text-xs text-surface-400">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 sm:py-20 bg-surface-900">
                <div className="section-container text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to get started?</h2>
                    <p className="mt-3 text-surface-400 max-w-md mx-auto">
                        Join thousands of happy customers. Book your first service today.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/register"
                            className="btn-primary py-3 px-8 text-base"
                        >
                            Create Free Account <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            to="/services"
                            className="btn-ghost text-surface-300 hover:text-white hover:bg-white/10 py-3 px-8"
                        >
                            Browse Services
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
