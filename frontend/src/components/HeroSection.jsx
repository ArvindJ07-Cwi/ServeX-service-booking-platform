import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Star, Shield, Clock } from 'lucide-react';

const stats = [
    { label: 'Active Users', value: '50K+', icon: Star },
    { label: 'Verified Pros', value: '5K+', icon: Shield },
    { label: 'Services Done', value: '200K+', icon: Clock },
];

export default function HeroSection() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (location) params.set('location', location);
        navigate(`/services?${params.toString()}`);
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900 to-primary-950 pt-32 pb-20 sm:pt-40 sm:pb-28">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '40px 40px',
            }} />

            {/* Gradient orbs */}
            <div className="absolute top-20 -left-40 h-80 w-80 rounded-full bg-primary-600/20 blur-[100px]" />
            <div className="absolute bottom-10 right-0 h-60 w-60 rounded-full bg-primary-500/10 blur-[80px]" />

            <div className="section-container relative">
                <div className="mx-auto max-w-3xl text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-primary-300 backdrop-blur-sm animate-fade-in mb-6">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        Trusted by 50,000+ customers
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl animate-slide-up">
                        Book Local Services
                        <br />
                        <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                            with Confidence
                        </span>
                    </h1>

                    <p className="mt-5 text-base sm:text-lg text-surface-400 max-w-xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        From home cleaning to complex repairs — connect with verified professionals
                        near you. Quality guaranteed.
                    </p>

                    {/* Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="mt-10 flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm animate-slide-up"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div className="relative flex-1">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Your location"
                                className="w-full rounded-xl bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder:text-surface-500 outline-none focus:bg-white/15 transition-colors"
                                id="hero-location-input"
                            />
                        </div>
                        <div className="relative flex-[2]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search for services... (e.g., AC repair, cleaning)"
                                className="w-full rounded-xl bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder:text-surface-500 outline-none focus:bg-white/15 transition-colors"
                                id="hero-search-input"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary py-3 px-6 rounded-xl flex items-center gap-2"
                            id="hero-search-button"
                        >
                            Search
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    {/* Stats */}
                    <div className="mt-14 grid grid-cols-3 gap-6 sm:gap-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        {stats.map(({ label, value, icon: Icon }) => (
                            <div key={label} className="text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <Icon className="h-4 w-4 text-primary-400" />
                                    <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
                                </div>
                                <span className="mt-1 text-xs text-surface-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
