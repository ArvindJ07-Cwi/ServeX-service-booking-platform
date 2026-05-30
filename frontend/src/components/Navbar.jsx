import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setMobileMenuOpen(false);
        }
    };

    const getDashboardPath = () => {
        if (user?.role === 'admin') return '/admin-dashboard';
        if (user?.role === 'agent') return '/agent-dashboard';
        return '/dashboard';
    };

    const isAgent = isAuthenticated && user?.role === 'agent';

    return (
        <nav className={`sticky top-0 z-50 bg-white border-b transition-shadow duration-200 ${scrolled ? 'shadow-sm border-surface-200' : 'border-transparent'}`}>
            <div className="section-container">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <Logo size="small" />

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {!isAgent && (
                            <>
                                <Link to="/" className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors">
                                    Home
                                </Link>
                                <Link to="/services" className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors">
                                    Services
                                </Link>
                            </>
                        )}
                        <Link to={getDashboardPath()} className={`px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors ${!isAuthenticated ? 'hidden' : ''}`}>
                            Dashboard
                        </Link>
                    </div>

                    {/* Search Bar (center) — hide for agents */}
                    {!isAgent && (
                        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm mx-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search services..."
                                    className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2 pl-9 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                                />
                            </div>
                        </form>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Search Icon */}
                        {!isAgent && (
                            <Link to="/services" className="lg:hidden p-2 text-surface-500 hover:text-surface-700 rounded-lg hover:bg-surface-50 transition-colors">
                                <Search className="h-5 w-5" />
                            </Link>
                        )}

                        {/* Cart Icon — hide for agents */}
                        {!isAgent && (
                            <Link to="/cart" className="relative p-2 text-surface-500 hover:text-surface-700 rounded-lg hover:bg-surface-50 transition-colors">
                                <ShoppingCart className="h-5 w-5" />
                                {cartItems.length > 0 && (
                                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-semibold text-white">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <NotificationDropdown />

                                {/* User Menu */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-50 transition-colors"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-700 text-sm font-semibold border border-primary-100">
                                            {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                                        </div>
                                        <ChevronDown className={`h-3.5 w-3.5 text-surface-400 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-200 bg-white py-1 shadow-lg animate-scale-in">
                                            <div className="px-4 py-3 border-b border-surface-100">
                                                <p className="text-sm font-medium text-surface-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to={getDashboardPath()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                                                >
                                                    <LayoutDashboard className="h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                                                >
                                                    <User className="h-4 w-4" />
                                                    Profile
                                                </Link>
                                            </div>
                                            <div className="border-t border-surface-100 py-1">
                                                <button
                                                    onClick={() => { logout(); setUserMenuOpen(false); }}
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">
                                    Log in
                                </Link>
                                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-surface-500 hover:text-surface-700 rounded-lg hover:bg-surface-50 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-surface-100 py-3 animate-slide-down">
                        <div className="space-y-1">
                            {!isAgent && (
                                <>
                                    <Link
                                        to="/"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg transition-colors"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        to="/services"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg transition-colors"
                                    >
                                        Services
                                    </Link>
                                </>
                            )}
                            {isAuthenticated && (
                                <Link
                                    to={getDashboardPath()}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg transition-colors"
                                >
                                    Dashboard
                                </Link>
                            )}
                            {!isAuthenticated && (
                                <div className="pt-2 border-t border-surface-100 mt-2 flex gap-2 px-3">
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm">
                                        Log in
                                    </Link>
                                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary flex-1 text-center text-sm">
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
