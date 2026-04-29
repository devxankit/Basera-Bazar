import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('basera_cart');
    return savedCart ? JSON.parse(savedCart) : {};
  });

  useEffect(() => {
    localStorage.setItem('basera_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const currentQty = prev[product._id]?.qty || 0;
      if (currentQty >= (product.inventory?.quantity || 100)) return prev; // Avoid exceeding stock if applicable
      return {
        ...prev,
        [product._id]: {
          item: product,
          qty: currentQty + 1
        }
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const currentQty = prev[productId]?.qty || 0;
      if (currentQty <= 1) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          qty: currentQty - 1
        }
      };
    });
  };

  const deleteFromCart = (productId) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const clearCart = () => setCart({});

  const cartTotal = Object.values(cart).reduce((sum, item) => {
    const price = item.item.pricing?.price_per_unit || item.item.price?.value || 0;
    return sum + (price * item.qty);
  }, 0);
  const cartCount = Object.values(cart).length;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, deleteFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
