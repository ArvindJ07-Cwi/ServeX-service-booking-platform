import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
        <div className="flex min-h-screen bg-surface-50 items-center justify-center p-6">
            <div className="mx-auto w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-surface-200">
                <Logo size="medium" className="mb-8 justify-center" />
                
                <h1 className="text-2xl font-bold text-surface-900 text-center">Reset your password</h1>
                <p className="mt-2 text-sm text-surface-500 text-center mb-8">
                    Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                </p>

                {status === 'success' ? (
                    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 animate-scale-in text-center">
                        <CheckCircle2 className="h-10 w-10 text-success-500 shrink-0" />
                        <p className="text-sm text-success-700 font-medium">{message}</p>
                        <Link to="/login" className="btn-primary w-full mt-4 py-2">
                            Return to log in
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === 'error' && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 animate-scale-in">
                                <AlertCircle className="h-4 w-4 text-danger-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-danger-500">{message}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
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
                            className="btn-primary w-full py-3 mt-2"
                        >
                            {status === 'loading' ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> Sending reset link...</>
                            ) : (
                                'Send reset link'
                            )}
                        </button>

                        <p className="mt-6 text-center text-sm text-surface-500">
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                                &larr; Back to login
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
