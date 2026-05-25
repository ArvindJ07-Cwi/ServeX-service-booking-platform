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
        <div className="flex min-h-screen bg-surface-50 items-center justify-center p-6">
            <div className="mx-auto w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-surface-200">
                <Logo size="medium" className="mb-8 justify-center" />
                
                <h1 className="text-2xl font-bold text-surface-900 text-center">Set new password</h1>
                <p className="mt-2 text-sm text-surface-500 text-center mb-8">
                    Your new password must be securely different from previous passwords.
                </p>

                {status === 'success' ? (
                    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 animate-scale-in text-center">
                        <CheckCircle2 className="h-10 w-10 text-success-500 shrink-0" />
                        <p className="text-sm text-success-700 font-medium">{message}</p>
                        <p className="text-xs text-surface-500">Redirecting to login...</p>
                        <Link to="/login" className="btn-primary w-full mt-4 py-2">
                            Go to login now
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
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
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
                            className="btn-primary w-full py-3 mt-4"
                        >
                            {status === 'loading' ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> Resetting password...</>
                            ) : (
                                'Reset password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
