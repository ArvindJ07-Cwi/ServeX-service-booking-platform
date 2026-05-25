import { useState, useRef, useEffect } from 'react';
import { bookingsAPI } from '../services/api';
import { ShieldCheck, X, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OtpVerifyModal({ bookingId, onClose, onVerified }) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);

    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index, value) => {
        // Allow only digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await bookingsAPI.verifyOtp(bookingId, otpString);
            setSuccess(true);
            setTimeout(() => {
                onVerified?.();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify OTP');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setResending(true);
        setError('');
        try {
            await bookingsAPI.generateOtp(bookingId);
            setResendCooldown(30); // 30-second cooldown
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">OTP Verification</h2>
                            <p className="text-sm text-primary-100">Enter the 6-digit code from the customer</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-surface-900">Verified Successfully!</h3>
                            <p className="text-sm text-surface-500 mt-1">Booking has been marked as completed.</p>
                        </div>
                    ) : (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                                            ${digit ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 bg-surface-50 text-surface-900'}
                                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20`}
                                        id={`otp-input-${index}`}
                                    />
                                ))}
                            </div>

                            {/* Verify button */}
                            <button
                                onClick={handleVerify}
                                disabled={loading || otp.join('').length !== 6}
                                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                id="verify-otp-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-4 w-4" />
                                        Verify & Complete
                                    </>
                                )}
                            </button>

                            {/* Resend */}
                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleResend}
                                    disabled={resending || resendCooldown > 0}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:text-surface-400 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
                                    id="resend-otp-btn"
                                >
                                    {resending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
