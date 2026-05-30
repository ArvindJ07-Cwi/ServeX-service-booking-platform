import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
    const { cartItems, removeFromCart, clearCart, subtotal, tax, platformFee, total } = useCart();
    const navigate = useNavigate();

    if (cartItems.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                    <ShoppingBag className="h-7 w-7 text-surface-400" />
                </div>
                <h1 className="text-xl font-semibold text-surface-900">Your cart is empty</h1>
                <p className="mt-2 text-sm text-surface-500 max-w-sm">
                    Browse our services and add something you need.
                </p>
                <Link to="/services" className="btn-primary mt-6">
                    Browse Services
                </Link>
            </div>
        );
    }

    return (
        <div className="section-container py-8 lg:py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="page-header">Cart</h1>
                    <p className="page-subtitle">{cartItems.length} {cartItems.length === 1 ? 'service' : 'services'} selected</p>
                </div>
                <Link to="/services" className="btn-ghost text-sm hidden sm:inline-flex">
                    <ArrowLeft className="h-4 w-4" />
                    Continue browsing
                </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                    {cartItems.map((item) => (
                        <div key={item._id} className="card flex gap-4 p-4">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-100">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-surface-300">
                                        {item.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 items-start justify-between min-w-0">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-surface-900 truncate">{item.name}</h3>
                                    <p className="text-xs text-surface-500 mt-0.5">{item.category} · {item.duration}</p>
                                    <p className="text-sm font-semibold text-surface-900 mt-2">₹{item.price}</p>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="p-1.5 text-surface-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors flex-shrink-0"
                                    title="Remove"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={clearCart}
                        className="text-xs font-medium text-danger-500 hover:text-danger-600 transition-colors mt-2"
                    >
                        Clear cart
                    </button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-24 p-5">
                        <h2 className="text-sm font-semibold text-surface-900 mb-4">Order Summary</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-surface-600">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Taxes (18% GST)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Platform fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>

                            <div className="border-t border-surface-200 pt-3 flex justify-between font-semibold text-surface-900">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn-primary mt-6 w-full group"
                        >
                            Proceed to Checkout
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>

                        <p className="text-xs text-center text-surface-400 mt-3">
                            Secure checkout · Pay after service
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
