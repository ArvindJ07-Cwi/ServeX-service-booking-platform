import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { authAPI } from '../services/api';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        setStatus('loading');
        try {
            const res = await authAPI.resetPassword(token, password);
            setStatus('success');
            setMessage(res.data.message || 'Password reset successfully');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Invalid or expired token.');
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

                    <h1 className="text-center text-2xl font-bold text-surface-900">Set new password</h1>
                    <p className="mt-1.5 text-center text-sm text-surface-600 mb-8">
                        Your new password must be securely different from previous passwords.
                    </p>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm text-green-700 font-medium">{message}</p>
                            <p className="text-xs text-surface-500">Redirecting to login…</p>
                            <Link to="/login" className="btn-primary w-full mt-2 py-2.5">
                                Go to login now
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
                                <label className="block text-sm font-medium text-surface-900 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (status === 'error') setStatus('idle');
                                        }}
                                        placeholder="••••••••"
                                        className="input-field pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-900 mb-1.5">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-surface-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (status === 'error') setStatus('idle');
                                        }}
                                        placeholder="••••••••"
                                        className="input-field pl-10 pr-10"
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
                                        Resetting password…
                                    </>
                                ) : (
                                    'Reset password'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
