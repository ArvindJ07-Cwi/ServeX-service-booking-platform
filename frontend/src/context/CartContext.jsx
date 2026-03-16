import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Clear cart on logout
    useEffect(() => {
        if (!user) {
            setCartItems([]);
        }
    }, [user]);

    const addToCart = (service) => {
        setCartItems((prev) => {
            // Prevent adding same service twice
            if (prev.find(item => item._id === service._id)) {
                return prev;
            }
            return [...prev, service];
        });
    };

    const removeFromCart = (id) => {
        setCartItems((prev) => prev.filter(item => item._id !== id));
    };

    const clearCart = () => setCartItems([]);

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
    const tax = subtotal * 0.18;
    // Platform fee: 49 per service booked
    const platformFee = cartItems.length * 49;
    const total = subtotal + tax + platformFee;

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            subtotal,
            tax,
            platformFee,
            total
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}

export default CartContext;
