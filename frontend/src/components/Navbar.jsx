import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Search, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-md">
            <div className="section-container flex h-16 items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary-600 flex-shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">S</div>
                    <span className="hidden sm:inline">ServeX</span>
                </Link>

                {/* Search Bar (center) */}
                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search services..."
                            className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2 pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                        />
                    </div>
                </form>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/services" className="text-sm font-medium text-surface-600 hover:text-primary-600">Services</Link>
                    <Link to="/about" className="text-sm font-medium text-surface-600 hover:text-primary-600">About</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Mobile Search Icon */}
                    <Link to="/services" className="md:hidden p-2 text-surface-600 hover:text-primary-600 transition-colors">
                        <Search className="h-5 w-5" />
                    </Link>

                    {/* Cart Icon */}
                    <Link to="/cart" className="relative p-2 text-surface-600 hover:text-primary-600 transition-colors">
                        <ShoppingCart className="h-5 w-5" />
                        {cartItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-scale-in">
                                {cartItems.length}
                            </span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to={user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'agent' ? '/agent-dashboard' : '/dashboard'}
                                className="text-sm font-medium text-surface-900 hover:text-primary-600 hidden sm:inline"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/profile"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold hover:bg-primary-200 transition-colors"
                                title="Profile"
                            >
                                {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                            </Link>
                            <button onClick={logout} className="btn-secondary px-4 py-2 text-xs">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="text-sm font-medium text-surface-600 hover:text-primary-600 px-3 py-2">
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary px-4 py-2 text-xs">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
