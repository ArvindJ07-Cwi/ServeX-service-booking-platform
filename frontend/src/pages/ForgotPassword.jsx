import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        try {
            const res = await authAPI.forgotPassword(email);
            setStatus('success');
            setMessage(res.data.message);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-12">
            <div className="w-full max-w-[420px]">
                <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Logo size="medium" />
                    </div>

                    <h1 className="text-center text-2xl font-bold text-surface-900">Reset your password</h1>
                    <p className="mt-1.5 text-center text-sm text-surface-600 mb-8">
                        Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                    </p>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm text-green-700 font-medium">{message}</p>
                            <Link to="/login" className="btn-primary w-full mt-2 py-2.5">
                                Return to log in
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {status === 'error' && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
                                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-600">{message}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-surface-900 mb-1.5">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (status === 'error') setStatus('idle');
                                        }}
                                        placeholder="you@example.com"
                                        className="input-field pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn-primary w-full py-2.5"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending reset link…
                                    </>
                                ) : (
                                    'Send reset link'
                                )}
                            </button>

                            <p className="text-center">
                                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back to login
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
