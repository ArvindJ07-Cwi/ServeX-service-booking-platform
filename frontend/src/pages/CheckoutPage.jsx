import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { paymentAPI } from '../services/api';
import { Loader2, Calendar, MapPin, AlertCircle, CreditCard, Shield } from 'lucide-react';

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
        notes: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Razorpay payment flow for a single cart item
    const processPaymentForItem = (item) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Step 1: Create Razorpay order on backend
                const itemPrice = Number(item.price);
                const itemTax = itemPrice * 0.18;
                const itemPlatformFee = 49.00;
                const itemTotal = itemPrice + itemTax + itemPlatformFee;

                const { data } = await paymentAPI.createOrder({
                    amount: itemTotal,
                    service_id: item._id,
                    date: form.date,
                    time: form.time,
                    address: form.address,
                    notes: form.notes
                });

                // Step 2: Open Razorpay checkout popup
                const options = {
                    key: data.key_id,
                    amount: data.amount,
                    currency: data.currency,
                    order_id: data.order_id,
                    name: 'ServeX',
                    description: `Payment for ${item.name}`,
                    handler: async function (response) {
                        try {
                            // Step 3: Verify payment on backend → booking is created there
                            const verifyRes = await paymentAPI.verify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                service_id: item._id,
                                date: form.date,
                                time: form.time,
                                address: form.address,
                                notes: form.notes
                            });
                            resolve(verifyRes.data);
                        } catch (verifyErr) {
                            reject(verifyErr);
                        }
                    },
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || '',
                        contact: user?.phone || ''
                    },
                    theme: {
                        color: '#6366f1'
                    },
                    modal: {
                        ondismiss: function () {
                            reject(new Error('Payment cancelled by user'));
                        }
                    }
                };

                const rzp = new window.Razorpay(options);

                rzp.on('payment.failed', function (response) {
                    reject(new Error(response.error?.description || 'Payment failed'));
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
                            <div className="flex justify-between text-surface-600">
                                <span>Taxes</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Platform Fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t border-surface-200 pt-4 mt-4 flex justify-between font-bold text-xl text-surface-900">
                            <span>Total Amount</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Methods Info */}
                    <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary-600" />
                            Accepted Payment Methods
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-surface-500">
                            <span className="px-2 py-1 bg-surface-100 rounded-md">UPI</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">QR Code</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">Credit/Debit Card</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">Net Banking</span>
                            <span className="px-2 py-1 bg-surface-100 rounded-md">Wallets</span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handlePayNow}
                        disabled={loading || !form.address || !form.date || !form.time}
                        className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5" />
                                Pay ₹{total.toFixed(2)} Securely
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
