import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { paymentAPI, couponAPI } from '../services/api';
import { Loader2, Calendar, MapPin, AlertCircle, CreditCard, Shield, Tag } from 'lucide-react';

// Helper: Load Razorpay script dynamically (ensures it is available)
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
        location: user?.city || user?.location || '',  // legacy compat
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

    // Process Razorpay payment for a single cart item
    const processPaymentForItem = (item) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Ensure Razorpay SDK is loaded
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    reject(new Error('Failed to load Razorpay SDK. Check your internet connection.'));
                    return;
                }

                // Step 1: Create order on backend
                const itemPrice = Number(item.price);
                // Note: itemTotal logic in processPaymentForItem is largely just a local visual log now, backend computes exact
                const scaledSubtotal = finalSubtotal; // If multiple items, we rely on backend for exact per-item total. Here we just assume 1 item.
                const itemTax = finalTax;
                const itemPlatformFee = platformFee;
                const itemTotal = finalTotal;

                console.log('====== PAYMENT FLOW START ======');
                console.log('Item:', item.name, '| Price:', itemPrice, '| Total:', itemTotal);

                const { data } = await paymentAPI.createOrder({
                    amount: itemTotal,
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

                console.log('✅ Order created:', data);
                console.log('Order ID:', data.order_id);
                console.log('Amount (paise):', data.amount);
                console.log('Key ID:', data.key_id);

                // Step 2: Build Razorpay checkout options
                const options = {
                    key: data.key_id,
                    amount: data.amount,
                    currency: data.currency,
                    order_id: data.order_id,
                    name: 'ServeX',
                    description: `Payment for ${item.name}`,

                    // Payment success callback
                    handler: async function (response) {
                        console.log('✅ Payment successful! Razorpay response:', response);
                        console.log('Razorpay Order ID:', response.razorpay_order_id);
                        console.log('Razorpay Payment ID:', response.razorpay_payment_id);
                        console.log('Razorpay Signature:', response.razorpay_signature ? '(received)' : '(MISSING!)');
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
                            console.log('✅ Verification response:', verifyRes.data);
                            resolve(verifyRes.data);
                        } catch (verifyErr) {
                            console.error('❌ Verification failed:', verifyErr.response?.data || verifyErr.message);
                            reject(verifyErr);
                        }
                    },

                    // Prefill user details — name and email only
                    // DO NOT prefill contact so Razorpay does not auto-skip to QR
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || ''
                    },

                    // Do NOT remember customer — this causes Razorpay to auto-select
                    // payment method based on phone and skip UPI ID option
                    remember_customer: false,

                    // Explicitly enable all payment methods
                    method: {
                        upi: true,
                        card: true,
                        netbanking: true,
                        wallet: true,
                        emi: false,
                        paylater: false
                    },

                    theme: {
                        color: '#6366f1'
                    },

                    modal: {
                        ondismiss: function () {
                            console.warn('⚠️ Payment popup dismissed by user');
                            reject(new Error('Payment cancelled by user'));
                        },
                        confirm_close: true
                    }
                };

                console.log('Opening Razorpay popup...');
                const rzp = new window.Razorpay(options);

                rzp.on('payment.failed', function (response) {
                    console.error('❌ Payment failed:', response.error);
                    console.error('Error code:', response.error?.code);
                    console.error('Error description:', response.error?.description);
                    console.error('Error reason:', response.error?.reason);
                    reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
                });

                rzp.open();
            } catch (err) {
                console.error('❌ Payment flow error:', err);
                reject(err);
            }
        });
    };

    const handlePayNow = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Process payment for each cart item sequentially
            // (Razorpay popup can only open one at a time)
            let lastBookingId = null;

            for (const item of cartItems) {
                const result = await processPaymentForItem(item);
                if (result?.booking?._id) {
                    lastBookingId = result.booking._id;
                }
            }

            // All payments successful → clear cart and redirect
            clearCart();

            if (lastBookingId) {
                navigate(`/bookings/${lastBookingId}`);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Payment error:', err);
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
        <div className="section-container py-12 animate-fade-in max-w-4xl">
            <h1 className="text-3xl font-bold text-surface-900 mb-8">Checkout</h1>

            <div className="grid gap-12 lg:grid-cols-2">

                {/* Form */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
                        <h2 className="text-xl font-bold text-surface-900 mb-6 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary-600" />
                            Service Location
                        </h2>

                        {/* Proximity banner */}
                        {form.city && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary-50 border border-primary-200 px-4 py-2.5">
                                <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                                <span className="text-sm font-medium text-primary-700">
                                    Showing professionals near <strong>{form.city}</strong>
                                    {form.area && <> — {form.area}</>}
                                </span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Full Address</label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    placeholder="Enter your complete address..."
                                    className="input-field resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">
                                    City <span className="text-red-500">*</span>
                                    <span className="text-surface-400 font-normal ml-1">(helps assign a nearby professional)</span>
                                </label>
                                <select
                                    name="city"
                                    id="checkout-city"
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value, location: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select your city</option>
                                    <option value="Mumbai">Mumbai</option>
                                    <option value="Thane">Thane</option>
                                    <option value="Navi Mumbai">Navi Mumbai</option>
                                    <option value="Pune">Pune</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Bangalore">Bangalore</option>
                                    <option value="Hyderabad">Hyderabad</option>
                                    <option value="Chennai">Chennai</option>
                                    <option value="Kolkata">Kolkata</option>
                                    <option value="Ahmedabad">Ahmedabad</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">
                                    Area / Locality <span className="text-surface-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="area"
                                    id="checkout-area"
                                    value={form.area}
                                    onChange={handleChange}
                                    placeholder="e.g. Andheri West, Koregaon Park"
                                    className="input-field"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
                        <h2 className="text-xl font-bold text-surface-900 mb-6 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary-600" />
                            Preferred Schedule
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Date</label>
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
                                <label className="block text-sm font-medium text-surface-700 mb-1">Time</label>
                                <select
                                    name="time"
                                    value={form.time}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                >
                                    <option value="">Select Time</option>
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

                    <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
                        <h2 className="text-xl font-bold text-surface-900 mb-6">Additional Notes</h2>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Any specific instructions? (Optional)"
                            className="input-field"
                        />
                    </div>
                </div>

                {/* Summary Side */}
                <div className="space-y-6">
                    <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200">
                        <h2 className="text-lg font-bold text-surface-900 mb-4">Your Order</h2>
                        <div className="space-y-4 mb-6">
                            {cartItems.map(item => (
                                <div key={item._id} className="flex justify-between text-sm">
                                    <span className="text-surface-600">{item.name}</span>
                                    <span className="font-medium">₹{item.price}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-surface-200 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-surface-600">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {appliedDiscount > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount (Coupon)</span>
                                    <span>-₹{appliedDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-surface-600">
                                <span>Taxes</span>
                                <span>₹{finalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Platform Fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t border-surface-200 pt-4 mt-4 flex justify-between font-bold text-xl text-surface-900">
                            <span>Total Amount</span>
                            <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary-600" />
                            Apply Coupon
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={couponCode} 
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Enter coupon code" 
                                className="input-field py-2"
                                disabled={appliedCoupon}
                            />
                            {!appliedCoupon ? (
                                <button onClick={applyCoupon} className="btn-secondary py-2 px-4 shrink-0">Apply</button>
                            ) : (
                                <button onClick={removeCoupon} className="btn-danger py-2 px-4 shrink-0 bg-red-100 text-red-700 hover:bg-red-200 border-none">Remove</button>
                            )}
                        </div>
                        {couponMessage && <p className="text-sm font-medium text-green-600 mt-2">{couponMessage}</p>}
                        {couponError && <p className="text-sm font-medium text-red-600 mt-2">{couponError}</p>}
                        {!appliedCoupon && !couponMessage && !couponError && (
                            <p className="text-xs text-primary-600 mt-2 font-medium">Suggestion: Use <span className="font-bold">SERVEX50</span> – Get ₹50 off on your first booking</p>
                        )}
                    </div>

                    {/* Payment Methods Info */}
                    <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary-600" />
                            Accepted Payment Methods
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-surface-500">
                            <span className="px-2 py-1 bg-surface-100 rounded-md">UPI ID</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">UPI QR</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">Credit/Debit Card</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">Net Banking</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">Wallets</span>
                        </div>
                    </div>

                    {/* Test mode instructions */}
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-blue-700 mb-2">🧪 Test Mode — How to Pay</h3>
                        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                            <li>UPI ID: Use <strong>success@razorpay</strong></li>
                            <li>Card: Use <strong>4111 1111 1111 1111</strong>, any future expiry, any CVV</li>
                            <li>Netbanking: Select any bank and click "Success"</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handlePayNow}
                        disabled={loading || !form.address || !form.date || !form.time || !form.city}
                        className={`w-full py-4 text-lg shadow-lg rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                            loading || !form.address || !form.date || !form.time || !form.city
                                ? 'bg-surface-300 text-surface-500 cursor-not-allowed'
                                : 'btn-primary shadow-primary-500/20'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5" />
                                Pay ₹{finalTotal.toFixed(2)} Securely
                            </>
                        )}
                    </button>

                    <p className="text-xs text-center text-surface-400 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" />
                        Secured by Razorpay. Your payment information is encrypted.
                    </p>
                </div>
            </div>
        </div>
    );
}
