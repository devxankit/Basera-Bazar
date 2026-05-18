import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../../context/CartContext';

// Clear localStorage between tests to avoid state leakage
beforeEach(() => {
  localStorage.clear();
});

const CartConsumer = ({ onCart }) => {
  const cart = useCart();
  onCart(cart);
  return null;
};

const renderWithCart = (onCart) =>
  render(
    <CartProvider>
      <CartConsumer onCart={onCart} />
    </CartProvider>
  );

const PRODUCT = {
  _id: 'prod1',
  name: 'Test Product',
  price: { value: 100 },
  inventory: { quantity: 5 },
};

describe('CartContext', () => {
  test('starts with empty cart', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    expect(ctx.cartCount).toBe(0);
    expect(ctx.cartTotal).toBe(0);
  });

  test('addToCart adds a product', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    expect(ctx.cartCount).toBe(1);
    expect(ctx.cart['prod1'].qty).toBe(1);
  });

  test('addToCart increments quantity on repeated add', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.addToCart(PRODUCT); });
    expect(ctx.cart['prod1'].qty).toBe(2);
  });

  test('addToCart returns success:true on valid product', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    let result;
    act(() => { result = ctx.addToCart(PRODUCT); });
    expect(result.success).toBe(true);
  });

  test('addToCart returns success:false for invalid product', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    let result;
    act(() => { result = ctx.addToCart(null); });
    expect(result.success).toBe(false);
  });

  test('addToCart respects stock limit', () => {
    const limitedProduct = { ...PRODUCT, inventory: { quantity: 1 } };
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(limitedProduct); });
    let result;
    act(() => { result = ctx.addToCart(limitedProduct); });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('stock_limit');
  });

  test('removeFromCart decrements quantity', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.removeFromCart('prod1'); });
    expect(ctx.cart['prod1'].qty).toBe(1);
  });

  test('removeFromCart deletes item when qty reaches 0', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.removeFromCart('prod1'); });
    expect(ctx.cart['prod1']).toBeUndefined();
    expect(ctx.cartCount).toBe(0);
  });

  test('deleteFromCart removes item regardless of quantity', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.deleteFromCart('prod1'); });
    expect(ctx.cart['prod1']).toBeUndefined();
  });

  test('clearCart empties all items', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.clearCart(); });
    expect(ctx.cartCount).toBe(0);
  });

  test('cartTotal sums price * qty', () => {
    let ctx;
    renderWithCart((c) => { ctx = c; });
    act(() => { ctx.addToCart(PRODUCT); });
    act(() => { ctx.addToCart(PRODUCT); });
    // price.value = 100, qty = 2 → total = 200
    expect(ctx.cartTotal).toBe(200);
  });

  test('throws when useCart is used outside CartProvider', () => {
    const BadConsumer = () => { useCart(); return null; };
    expect(() => render(<BadConsumer />)).toThrow('useCart must be used within a CartProvider');
  });
});
