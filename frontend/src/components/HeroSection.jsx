import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Star, Shield, Clock } from 'lucide-react';

export default function HeroSection() {
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (location.trim()) params.set('location', location.trim());
        navigate(`/services?${params.toString()}`);
    };

    const stats = [
        { value: '50K+', label: 'Happy Customers' },
        { value: '5,000+', label: 'Verified Professionals' },
        { value: '200K+', label: 'Services Completed' },
    ];

    return (
        <section className="relative bg-surface-50 overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(0_0_0_/_0.03)_1px,_transparent_0)] bg-[size:24px_24px]" />

            <div className="section-container relative">
                <div className="py-16 sm:py-20 lg:py-28">
                    <div className="max-w-3xl">
                        {/* Trust badge */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20 mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                            Trusted by 50,000+ customers across India
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
                            Book Trusted Home{' '}
                            <span className="text-primary-600">Services</span>{' '}
                            in Minutes
                        </h1>

                        {/* Subtext */}
                        <p className="mt-6 text-lg text-surface-600 max-w-2xl leading-relaxed">
                            From cleaning to repairs, find verified professionals for every home need. Quality service, transparent pricing, hassle-free booking.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-surface-400" />
                                <input
                                    type="text"
                                    placeholder="Your city"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="input-field pl-10 py-3"
                                />
                            </div>
                            <div className="relative flex-[2]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-surface-400" />
                                <input
                                    type="text"
                                    placeholder="What service do you need?"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input-field pl-10 py-3"
                                />
                            </div>
                            <button type="submit" className="btn-primary py-3 px-6">
                                <Search className="h-4 w-4" />
                                Search
                            </button>
                        </form>

                        {/* Trust indicators */}
                        <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-surface-500">
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-success-500" />
                                <span>Verified Professionals</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-warning-500" />
                                <span>4.8 Average Rating</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-primary-500" />
                                <span>Same-Day Service</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-3 gap-8 border-t border-surface-200 pt-10">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <p className="text-2xl sm:text-3xl font-bold text-surface-900">{stat.value}</p>
                                <p className="mt-1 text-sm text-surface-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
