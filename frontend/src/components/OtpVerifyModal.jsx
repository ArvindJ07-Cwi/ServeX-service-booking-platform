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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                className="relative w-full max-w-md bg-white rounded-xl shadow-lg border border-surface-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-surface-900">OTP Verification</h2>
                            <p className="text-xs text-surface-500">Enter the 6-digit code from the customer</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {success ? (
                        <div className="flex flex-col items-center py-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 border border-green-200 mb-4">
                                <CheckCircle2 className="h-7 w-7 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-surface-900">Verified Successfully!</h3>
                            <p className="text-sm text-surface-500 mt-1">Booking has been marked as completed.</p>
                        </div>
                    ) : (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
                                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
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
                                        className={`w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 transition-all duration-150 outline-none
                                            ${digit ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 bg-white text-surface-900'}
                                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20`}
                                        id={`otp-input-${index}`}
                                    />
                                ))}
                            </div>

                            {/* Verify button */}
                            <button
                                onClick={handleVerify}
                                disabled={loading || otp.join('').length !== 6}
                                className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                id="verify-otp-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying…
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
