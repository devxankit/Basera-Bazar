import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('basera_cart');
      return savedCart ? JSON.parse(savedCart) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('basera_cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * addToCart supports composite keys for attribute-based variants.
   * Returns { success: boolean, reason?: string } so callers can show feedback.
   */
  const addToCart = (product) => {
    if (!product) return { success: false, reason: 'invalid_product' };

    const cartKey = product._cartKey || product._id || product.id;
    if (!cartKey) return { success: false, reason: 'invalid_product' };

    // Read current qty synchronously from cart state snapshot
    const currentQty = cart[cartKey]?.qty || 0;

    // Support both 'inventory.quantity' (system products) and 'stock_quantity' (mandi products)
    const stockLimit = product.inventory?.quantity ?? product.stock_quantity ?? 999;

    if (currentQty >= stockLimit) {
      return { success: false, reason: 'stock_limit', limit: stockLimit };
    }

    setCart((prev) => ({
      ...prev,
      [cartKey]: {
        item: { ...product, _cartKey: cartKey },
        qty: (prev[cartKey]?.qty || 0) + 1,
        selectedType: product.selectedType || prev[cartKey]?.selectedType || product.type_name || null,
        selectedSubType: product.selectedSubType || prev[cartKey]?.selectedSubType || product.sub_type_name || null,
        selectedBrand: product.selectedBrand || prev[cartKey]?.selectedBrand || product.brand_name || product.brand || null,
      },
    }));

    return { success: true };
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
    if (!item?.item) return sum;
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
