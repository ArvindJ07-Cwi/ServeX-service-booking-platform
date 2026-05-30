import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { paymentAPI, couponAPI } from '../services/api';
import { Loader2, Calendar, MapPin, AlertCircle, CreditCard, Shield, Tag, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CityOptions } from '../constants/cities.jsx';

// Helper: Load Razorpay script dynamically
function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function CheckoutPage() {
    const { user } = useAuth();
    const { cartItems, clearCart, total, subtotal, tax, platformFee } = useCart();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        address: user?.address || '',
        date: '',
        time: '',
        notes: '',
        location: user?.city || user?.location || '',
        city: user?.city || user?.location || '',
        area: user?.area || '',
    });

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState('');
    const [couponError, setCouponError] = useState('');

    const applyCoupon = async () => {
        setCouponMessage('');
        setCouponError('');
        if (!couponCode.trim()) return;
        try {
            const { data } = await couponAPI.apply({ code: couponCode, amount: subtotal });
            setAppliedCoupon(data);
            setCouponMessage(data.message);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid or Expired Coupon');
            setAppliedCoupon(null);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponMessage('');
        setCouponError('');
    };

    const appliedDiscount = appliedCoupon ? Number(appliedCoupon.discount_amount) : 0;
    const finalSubtotal = subtotal - appliedDiscount;
    const finalTax = finalSubtotal * 0.18;
    const finalTotal = finalSubtotal + finalTax + platformFee;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const isFormValid = form.address && form.date && form.time && form.city;

    // Process Razorpay payment for a single cart item
    const processPaymentForItem = (item) => {
        return new Promise(async (resolve, reject) => {
            try {
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    reject(new Error('Failed to load Razorpay SDK. Check your internet connection.'));
                    return;
                }

                const { data } = await paymentAPI.createOrder({
                    amount: finalTotal,
                    service_id: item._id,
                    date: form.date,
                    time: form.time,
                    address: form.address,
                    notes: form.notes,
                    location: form.city || form.location,
                    city: form.city,
                    area: form.area,
                    coupon_code: appliedCoupon ? appliedCoupon.coupon_code : ''
                });

                const options = {
                    key: data.key_id,
                    amount: data.amount,
                    currency: data.currency,
                    order_id: data.order_id,
                    name: 'ServeX',
                    description: `Payment for ${item.name}`,
                    handler: async function (response) {
                        try {
                            const verifyRes = await paymentAPI.verify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                service_id: item._id,
                                date: form.date,
                                time: form.time,
                                address: form.address,
                                notes: form.notes,
                                location: form.city || form.location,
                                city: form.city,
                                area: form.area,
                                coupon_code: appliedCoupon ? appliedCoupon.coupon_code : ''
                            });
                            resolve(verifyRes.data);
                        } catch (verifyErr) {
                            reject(verifyErr);
                        }
                    },
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || ''
                    },
                    remember_customer: false,
                    method: {
                        upi: true,
                        card: true,
                        netbanking: true,
                        wallet: true,
                        emi: false,
                        paylater: false
                    },
                    theme: { color: '#2563EB' },
                    modal: {
                        ondismiss: function () {
                            reject(new Error('Payment cancelled by user'));
                        },
                        confirm_close: true
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
                });
                rzp.open();
            } catch (err) {
                reject(err);
            }
        });
    };

    const handlePayNow = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let lastBookingId = null;
            for (const item of cartItems) {
                const result = await processPaymentForItem(item);
                if (result?.booking?._id) {
                    lastBookingId = result.booking._id;
                }
            }
            clearCart();
            if (lastBookingId) {
                navigate(`/bookings/${lastBookingId}`);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
            setError(msg);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cartItems.length === 0 && !loading) {
            navigate('/cart');
        }
    }, [cartItems, navigate, loading]);

    if (cartItems.length === 0 && !loading) return null;

    return (
        <div className="section-container py-8 lg:py-12 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    Back to cart
                </Link>
                <h1 className="page-header">Checkout</h1>
                <p className="page-subtitle">Complete your booking details below</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                {/* Form Section */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Service Location */}
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <h2 className="text-base font-semibold text-surface-900">Service Location</h2>
                        </div>

                        {form.city && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                Showing professionals near <strong>{form.city}</strong>
                                {form.area && <> — {form.area}</>}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                    Address <span className="text-danger-500">*</span>
                                </label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                    rows={2}
                                    placeholder="Enter your complete address..."
                                    className="input-field resize-none"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                        City <span className="text-danger-500">*</span>
                                    </label>
                                    <select
                                        name="city"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value, location: e.target.value })}
                                        className="input-field"
                                        required
                                    >
                                        <CityOptions />
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                        Area <span className="text-xs text-surface-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="area"
                                        value={form.area}
                                        onChange={handleChange}
                                        placeholder="e.g. Andheri West"
                                        className="input-field"
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <h2 className="text-base font-semibold text-surface-900">Preferred Schedule</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                    Date <span className="text-danger-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                    Time <span className="text-danger-500">*</span>
                                </label>
                                <select
                                    name="time"
                                    value={form.time}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                >
                                    <option value="">Select time</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="04:00 PM">04:00 PM</option>
                                    <option value="06:00 PM">06:00 PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card p-5">
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">
                            Additional Notes <span className="text-xs text-surface-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Any specific instructions for the professional?"
                            className="input-field resize-none"
                        />
                    </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card sticky top-24 p-5">
                        <h2 className="text-sm font-semibold text-surface-900 mb-4">Order Summary</h2>

                        {/* Items */}
                        <div className="space-y-2.5 mb-4 pb-4 border-b border-surface-100">
                            {cartItems.map(item => (
                                <div key={item._id} className="flex justify-between text-sm">
                                    <span className="text-surface-600 truncate mr-3">{item.name}</span>
                                    <span className="font-medium text-surface-900 whitespace-nowrap">₹{item.price}</span>
                                </div>
                            ))}
                        </div>

                        {/* Pricing */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-surface-500">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {appliedDiscount > 0 && (
                                <div className="flex justify-between text-success-600 font-medium">
                                    <span>Discount</span>
                                    <span>-₹{appliedDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-surface-500">
                                <span>Taxes (18%)</span>
                                <span>₹{finalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-500">
                                <span>Platform fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-surface-200 pt-3 mt-3 flex justify-between font-semibold text-surface-900 text-base">
                                <span>Total</span>
                                <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Coupon */}
                        <div className="mt-4 pt-4 border-t border-surface-100">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Tag className="h-3.5 w-3.5 text-surface-400" />
                                <span className="text-xs font-medium text-surface-600">Coupon Code</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="Enter code"
                                    className="input-field py-2 text-xs"
                                    disabled={appliedCoupon}
                                />
                                {!appliedCoupon ? (
                                    <button onClick={applyCoupon} className="btn-secondary py-2 px-3 text-xs flex-shrink-0">Apply</button>
                                ) : (
                                    <button onClick={removeCoupon} className="text-xs font-medium text-danger-500 hover:text-danger-600 px-2 flex-shrink-0">Remove</button>
                                )}
                            </div>
                            {couponMessage && <p className="text-xs text-success-600 mt-1.5">{couponMessage}</p>}
                            {couponError && <p className="text-xs text-danger-500 mt-1.5">{couponError}</p>}
                            {!appliedCoupon && !couponMessage && !couponError && (
                                <p className="text-xs text-surface-400 mt-1.5">Try <span className="font-semibold text-primary-600">SERVEX50</span></p>
                            )}
                        </div>

                        {/* Payment methods */}
                        <div className="mt-4 pt-4 border-t border-surface-100">
                            <p className="text-xs font-medium text-surface-600 mb-2">Payment Methods</p>
                            <div className="flex flex-wrap gap-1.5">
                                {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
                                    <span key={m} className="px-2 py-0.5 text-[11px] bg-surface-50 text-surface-500 rounded border border-surface-200">{m}</span>
                                ))}
                            </div>
                        </div>

                        {/* Test mode */}
                        <div className="mt-4 p-3 rounded-lg bg-primary-50 border border-primary-100">
                            <p className="text-xs font-medium text-primary-700 mb-1">Test Mode</p>
                            <ul className="text-[11px] text-primary-600 space-y-0.5">
                                <li>UPI: <strong>success@razorpay</strong></li>
                                <li>Card: <strong>4111 1111 1111 1111</strong></li>
                            </ul>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-danger-50 text-danger-600 text-xs">
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={handlePayNow}
                            disabled={loading || !isFormValid}
                            className="btn-primary w-full mt-5 py-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" />
                                    Pay ₹{finalTotal.toFixed(2)}
                                </>
                            )}
                        </button>
                        <p className="text-[11px] text-center text-surface-400 mt-2">
                            Secured by Razorpay · Encrypted payment
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
