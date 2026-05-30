import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, Loader2, Eye, EyeOff, AlertCircle, MapPin, Tag, Briefcase, ShoppingBag } from 'lucide-react';
import Logo from '../components/Logo';
import { CityOptions } from '../constants/cities.jsx';

// InputField is defined OUTSIDE the component to prevent re-creation on every render
function InputField({ name, label, type = 'text', icon: Icon, placeholder, autoComplete, value, onChange, error, showPassword, onTogglePassword }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-surface-900 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                <input
                    id={name}
                    name={name}
                    type={name === 'password' || name === 'confirmPassword' ? (showPassword ? 'text' : 'password') : type}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`input-field pl-10 ${(name === 'password' || name === 'confirmPassword') ? 'pr-10' : ''} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                />
                {(name === 'password' || name === 'confirmPassword') && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
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
        location: '',   // kept for backward compat, set same as city
        city: '',
        area: '',
        service_category: '',
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
            const { confirmPassword, ...rest } = form;
            // Keep location in sync with city for backward compat
            const payload = { ...rest, location: form.city || form.location || null };
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
        <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-12">
            <div className="w-full max-w-[480px]">
                {/* Card */}
                <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Logo size="medium" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-center text-2xl font-bold text-surface-900">
                        Create your account
                    </h1>
                    <p className="mt-1.5 text-center text-sm text-surface-600">
                        Get started in less than a minute
                    </p>

                    {/* Error banner */}
                    {error && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <InputField name="name" label="Full name" icon={User} placeholder="John Doe" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
                        <InputField name="email" label="Email address" type="email" icon={Mail} placeholder="you@example.com" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
                        <InputField name="phone" label="Phone (optional)" type="tel" icon={Phone} placeholder="9876543210" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} />

                        {/* Role Selector Cards */}
                        <div>
                            <label className="block text-sm font-medium text-surface-900 mb-2">I want to</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'user', label: 'Book Services', description: 'Find & hire professionals', Icon: ShoppingBag },
                                    { value: 'agent', label: 'Offer Services', description: 'Get hired for your skills', Icon: Briefcase },
                                ].map(({ value, label, description, Icon: RoleIcon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, role: value }))}
                                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all duration-150 ${form.role === value
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
                                            }`}
                                    >
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${form.role === value ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500'}`}>
                                            <RoleIcon className="h-5 w-5" />
                                        </div>
                                        <span className={`text-sm font-semibold ${form.role === value ? 'text-primary-700' : 'text-surface-900'}`}>
                                            {label}
                                        </span>
                                        <span className="text-xs text-surface-500 leading-tight">
                                            {description}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Agent-specific fields */}
                        {form.role === 'agent' && (
                            <div className="space-y-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
                                <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">Professional details</p>
                                <div>
                                    <label className="block text-sm font-medium text-surface-900 mb-1.5">Service Area / City <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                        <select
                                            name="city"
                                            value={form.city}
                                            onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value, location: e.target.value }))}
                                            className="input-field pl-10 bg-white"
                                        >
                                            <CityOptions />
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-900 mb-1.5">
                                        Area / Locality <span className="text-surface-400 font-normal text-xs">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                        <input
                                            type="text"
                                            name="area"
                                            value={form.area}
                                            onChange={handleChange}
                                            placeholder="e.g. Andheri West, Koregaon Park"
                                            className="input-field pl-10 bg-white"
                                            maxLength={100}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-900 mb-1.5">Service Category</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                        <select
                                            name="service_category"
                                            value={form.service_category}
                                            onChange={handleChange}
                                            className="input-field pl-10 bg-white"
                                        >
                                            <option value="">Select your expertise</option>
                                            <option value="Cleaning">Cleaning</option>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Painting">Painting</option>
                                            <option value="Appliance">Appliance Repair</option>
                                            <option value="Carpentry">Carpentry</option>
                                            <option value="Salon">Salon & Beauty</option>
                                            <option value="Pest Control">Pest Control</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <InputField name="password" label="Password" icon={Lock} placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                        <InputField name="confirmPassword" label="Confirm password" icon={Lock} placeholder="••••••••" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5"
                            id="register-submit"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-surface-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
