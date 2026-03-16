import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Mail, Lock, User, Phone, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

// InputField is defined OUTSIDE the component to prevent re-creation on every render
function InputField({ name, label, type = 'text', icon: Icon, placeholder, autoComplete, value, onChange, error, showPassword, onTogglePassword }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-surface-700 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input
                    id={name}
                    name={name}
                    type={name === 'password' || name === 'confirmPassword' ? (showPassword ? 'text' : 'password') : type}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`input-field pl-10 ${(name === 'password' || name === 'confirmPassword') ? 'pr-10' : ''} ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                />
                {(name === 'password' || name === 'confirmPassword') && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
        </div>
    );
}

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'user',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
        if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit number';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
            const { confirmPassword, ...payload } = form;
            const user = await register(payload);
            const dashboardMap = { admin: '/admin-dashboard', agent: '/agent-dashboard', user: '/dashboard' };
            navigate(dashboardMap[user.role] || '/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left - Visual */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px',
                }} />
                <div className="absolute bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-600/20 blur-[80px]" />

                <div className="relative text-center max-w-md px-8">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10">
                        <Wrench className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Join the ServeX community</h2>
                    <p className="mt-3 text-surface-400 leading-relaxed">
                        Whether you need services or want to offer yours, create your account in seconds.
                    </p>
                    <div className="mt-8 flex justify-center gap-8 text-center">
                        <div>
                            <p className="text-2xl font-bold text-white">50K+</p>
                            <p className="text-xs text-surface-500">Happy Users</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">5K+</p>
                            <p className="text-xs text-surface-500">Professionals</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">4.8</p>
                            <p className="text-xs text-surface-500">Avg Rating</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right - Form */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
                <div className="mx-auto w-full max-w-sm">
                    <Link to="/" className="inline-flex items-center gap-2 group mb-10 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-surface-900 tracking-tight">
                            Serve<span className="text-primary-600">X</span>
                        </span>
                    </Link>

                    <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
                    <p className="mt-1.5 text-sm text-surface-500">
                        Get started in less than a minute
                    </p>

                    {error && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 animate-scale-in">
                            <AlertCircle className="h-4 w-4 text-danger-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-danger-500">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <InputField name="name" label="Full name" icon={User} placeholder="John Doe" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
                        <InputField name="email" label="Email address" type="email" icon={Mail} placeholder="you@example.com" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
                        <InputField name="phone" label="Phone (optional)" type="tel" icon={Phone} placeholder="9876543210" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} />

                        {/* Role Selector */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">I want to</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'user', label: 'Book Services' },
                                    { value: 'agent', label: 'Offer Services' },
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, role: value }))}
                                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${form.role === value
                                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                                            : 'border-surface-200 text-surface-500 hover:border-surface-300'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <InputField name="password" label="Password" icon={Lock} placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                        <InputField name="confirmPassword" label="Confirm password" icon={Lock} placeholder="••••••••" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3"
                            id="register-submit"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-surface-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
