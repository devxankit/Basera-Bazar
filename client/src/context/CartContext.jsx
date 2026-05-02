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

  /**
   * addToCart supports composite keys for attribute-based variants.
   * If the product has a `_cartKey`, use that; otherwise fall back to `_id`.
   * The product's selectedType, selectedSubType, selectedBrand are stored alongside.
   */
  const addToCart = (product) => {
    if (!product) return;
    
    setCart((prev) => {
      const cartKey = product._cartKey || product._id || product.id;
      if (!cartKey) return prev;

      const currentQty = prev[cartKey]?.qty || 0;
      
      // Support both 'inventory.quantity' (system products) and 'stock_quantity' (mandi products)
      const stockLimit = product.inventory?.quantity ?? product.stock_quantity ?? 999;
      
      if (currentQty >= stockLimit) {
        console.warn(`Cannot add more. Stock limit reached: ${stockLimit}`);
        return prev;
      }

      return {
        ...prev,
        [cartKey]: {
          item: {
            ...product,
            _cartKey: cartKey
          },
          qty: currentQty + 1,
          selectedType: product.selectedType || prev[cartKey]?.selectedType || product.type_name || null,
          selectedSubType: product.selectedSubType || prev[cartKey]?.selectedSubType || product.sub_type_name || null,
          selectedBrand: product.selectedBrand || prev[cartKey]?.selectedBrand || product.brand_name || product.brand || null
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
