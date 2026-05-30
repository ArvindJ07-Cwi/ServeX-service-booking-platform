import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import ServiceCard, { ServiceCardSkeleton } from '../components/ServiceCard';
import CategoryGrid from '../components/CategoryGrid';
import { Search, X, ArrowLeft, Package } from 'lucide-react';

export default function ServicesPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const categoryParam = searchParams.get('category') || '';
    const searchParam = searchParams.get('search') || '';

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(searchParam);

    useEffect(() => {
        fetchServices();
    }, [categoryParam, searchParam]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params = {};
            if (categoryParam) params.category = categoryParam;
            if (searchParam) params.search = searchParam;
            const { data } = await servicesAPI.getAll(params);
            setServices(data.services || data || []);
        } catch {
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/services?search=${encodeURIComponent(searchInput.trim())}`);
        } else {
            navigate('/services');
        }
    };

    const handleCategoryClick = (cat) => {
        navigate(`/services?category=${encodeURIComponent(cat.name)}`);
    };

    const clearFilters = () => {
        setSearchInput('');
        navigate('/services');
    };

    const activeFilter = categoryParam || searchParam;

    return (
        <div className="min-h-screen bg-surface-50 pt-20 animate-fade-in">
            <div className="section-container py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="page-header">
                        {categoryParam ? `${categoryParam} Services` : searchParam ? `Results for "${searchParam}"` : 'All Services'}
                    </h1>
                    <p className="page-subtitle mt-1">
                        {loading ? 'Loading...' : `${services.length} service${services.length !== 1 ? 's' : ''} found`}
                    </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search services..."
                            className="input-field pl-12 pr-24 py-3 text-base"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-sm px-4 py-2">
                            Search
                        </button>
                    </div>
                </form>

                {/* Active filter chip */}
                {activeFilter && (
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-surface-500">Filtered by:</span>
                        <span className="badge-primary flex items-center gap-1.5 px-3 py-1">
                            {categoryParam ? `Category: ${categoryParam}` : `Search: ${searchParam}`}
                            <button onClick={clearFilters} className="ml-0.5 hover:text-primary-900 transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                        <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-1">
                            View all services
                        </button>
                    </div>
                )}

                {/* Categories (show when no filter is active) */}
                {!activeFilter && (
                    <div className="mb-10">
                        <h2 className="text-lg font-semibold text-surface-900 mb-4">Browse by Category</h2>
                        <CategoryGrid onCategoryClick={handleCategoryClick} />
                    </div>
                )}

                {/* Services grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                        : services.length > 0
                            ? services.map((service) => <ServiceCard key={service._id} service={service} />)
                            : null
                    }
                </div>

                {/* Empty state */}
                {!loading && services.length === 0 && (
                    <div className="text-center py-20">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
                            <Package className="h-8 w-8 text-surface-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-surface-900">
                            No services found
                        </h3>
                        <p className="text-sm text-surface-500 mt-1 mb-6 max-w-sm mx-auto">
                            {searchParam ? `No results for "${searchParam}". Try a different search term.` : categoryParam ? `No services in "${categoryParam}" yet.` : 'No services available at the moment.'}
                        </p>
                        <button onClick={clearFilters} className="btn-secondary">
                            <ArrowLeft className="h-4 w-4" /> View all services
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
