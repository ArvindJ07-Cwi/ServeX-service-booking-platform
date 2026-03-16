import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
    const { cartItems, removeFromCart, clearCart, subtotal, tax, platformFee, total } = useCart();
    const navigate = useNavigate();

    if (cartItems.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
                <div className="mb-6 rounded-full bg-surface-100 p-6">
                    <ShoppingBag className="h-12 w-12 text-surface-400" />
                </div>
                <h1 className="text-2xl font-bold text-surface-900">Your cart is empty</h1>
                <p className="mt-2 text-surface-500 max-w-md">
                    Looks like you haven't added any services yet. Explore our services to find what you need.
                </p>
                <Link to="/" className="btn-primary mt-8">
                    Browse Services
                </Link>
            </div>
        );
    }

    return (
        <div className="section-container py-12 animate-fade-in">
            <h1 className="text-3xl font-bold text-surface-900 mb-8">Shopping Cart ({cartItems.length})</h1>

            <div className="grid gap-12 lg:grid-cols-3">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-6">
                    {cartItems.map((item) => (
                        <div key={item._id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-surface-200 bg-white shadow-sm">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-100">
                                {item.image && (
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-lg text-surface-900">{item.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item._id)}
                                            className="text-surface-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-surface-500 mt-1">{item.category} • {item.duration}</p>
                                </div>
                                <div className="mt-4 sm:mt-0 font-bold text-primary-600 text-lg">
                                    ₹{item.price}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={clearCart}
                        className="text-sm text-red-500 hover:text-red-600 font-medium ml-1"
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-surface-900 mb-6">Order Summary</h2>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between text-surface-600">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Taxes (18%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-surface-600">
                                <span>Platform Fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>

                            <div className="border-t border-surface-200 pt-4 mt-4 flex justify-between font-bold text-lg text-surface-900">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn-primary mt-8 w-full group"
                        >
                            Proceed to Checkout
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
