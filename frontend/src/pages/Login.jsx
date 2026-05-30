import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

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
        <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-12">
            <div className="w-full max-w-[420px]">
                {/* Card */}
                <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Logo size="medium" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-center text-2xl font-bold text-surface-900">
                        Welcome back
                    </h1>
                    <p className="mt-1.5 text-center text-sm text-surface-600">
                        Sign in to your account to continue
                    </p>

                    {/* Error banner */}
                    {error && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-surface-900 mb-1.5">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                                />
                            </div>
                            {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-surface-900">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5"
                            id="login-submit"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="mt-6 text-center text-sm text-surface-600">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
