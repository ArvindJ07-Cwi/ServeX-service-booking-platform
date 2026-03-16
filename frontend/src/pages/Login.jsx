import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // If already logged in, redirect to appropriate dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            const dashboardMap = { admin: '/admin-dashboard', agent: '/agent-dashboard', user: '/dashboard' };
            navigate(dashboardMap[user.role] || '/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const errs = {};
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError('');

        try {
            const user = await login(form);
            const from = location.state?.from?.pathname;
            const dashboardMap = { admin: '/admin-dashboard', agent: '/agent-dashboard', user: '/dashboard' };
            navigate(from || dashboardMap[user.role] || '/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left - Form */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
                <div className="mx-auto w-full max-w-sm">
                    {/* Logo */}
                    <Link to="/" className="inline-flex items-center gap-2 group mb-10">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 transition-transform group-hover:scale-105">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-surface-900 tracking-tight">
                            Serve<span className="text-primary-600">X</span>
                        </span>
                    </Link>

                    <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
                    <p className="mt-1.5 text-sm text-surface-500">
                        Sign in to your account to continue
                    </p>

                    {/* Error banner */}
                    {error && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 animate-scale-in">
                            <AlertCircle className="h-4 w-4 text-danger-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-danger-500">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={`input-field pl-10 ${errors.email ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-danger-500">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-danger-500">{errors.password}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3"
                            id="login-submit"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-surface-500">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right - Visual */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px',
                }} />
                <div className="absolute top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-[80px]" />
                <div className="absolute bottom-20 left-10 h-40 w-40 rounded-full bg-primary-400/20 blur-[60px]" />

                <div className="relative text-center max-w-md px-8">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10">
                        <Wrench className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Your trusted service marketplace</h2>
                    <p className="mt-3 text-primary-200 leading-relaxed">
                        Book verified professionals for any service — from home cleaning to complex repairs. Quality guaranteed.
                    </p>
                </div>
            </div>
        </div>
    );
}
