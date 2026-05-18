import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// Mock the api module — AuthContext calls api.get('/auth/me') on mount
vi.mock('../../services/api', () => {
  const get = vi.fn();
  const interceptors = {
    response: { use: vi.fn(() => 1), eject: vi.fn() },
  };
  return { default: { get, post: vi.fn(), interceptors } };
});

// Mock ConfirmationModal
vi.mock('../../components/common/ConfirmationModal', () => ({
  default: ({ isOpen, message }) => isOpen ? <div role="dialog">{message}</div> : null,
}));

import api from '../../services/api';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Default: /auth/me returns 401 (not logged in)
  api.get.mockRejectedValue({ response: { status: 401 } });
});

const AuthConsumer = ({ onCtx }) => {
  const ctx = useAuth();
  onCtx(ctx);
  return <div>{ctx.user ? `logged in as ${ctx.user.name}` : 'not logged in'}</div>;
};

const renderWithAuth = (onCtx) =>
  render(
    <AuthProvider>
      <AuthConsumer onCtx={onCtx} />
    </AuthProvider>
  );

describe('AuthContext', () => {
  test('provides null user when not authenticated', async () => {
    let ctx;
    renderWithAuth((c) => { ctx = c; });
    await waitFor(() => expect(ctx.loading).toBe(false));
    expect(ctx.user).toBeNull();
  });

  test('throws when useAuth is used outside AuthProvider', () => {
    const BadConsumer = () => { useAuth(); return null; };
    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within an AuthProvider');
  });

  test('sets user from /auth/me response on mount', async () => {
    // AuthContext reads response.data.data (not response.data.user)
    api.get.mockResolvedValue({
      data: { success: true, data: { _id: 'u1', name: 'Test User', role: 'user' } },
    });
    let ctx;
    renderWithAuth((c) => { ctx = c; });
    // AuthProvider renders a spinner (not children) while loading=true.
    // Once loading=false, children mount and ctx is populated.
    await waitFor(() => expect(ctx).toBeDefined());
    await waitFor(() => expect(ctx.user).not.toBeNull());
    expect(ctx.user).toMatchObject({ name: 'Test User' });
  });

  test('login function sets user in context', async () => {
    api.get.mockRejectedValue({ response: { status: 401 } });
    let ctx;
    renderWithAuth((c) => { ctx = c; });
    // After 401, loading=false and children mount
    await waitFor(() => expect(ctx).toBeDefined());

    const mockUser = { _id: 'u2', name: 'Jane', role: 'partner' };
    act(() => { ctx.login(mockUser, 'tok123'); }); // login(userData, token)
    expect(ctx.user).toMatchObject({ name: 'Jane' });
  });

  test('logout function clears user from context', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { _id: 'u1', name: 'Test User', role: 'user' } },
    });
    let ctx;
    renderWithAuth((c) => { ctx = c; });
    await waitFor(() => expect(ctx).toBeDefined());
    await waitFor(() => expect(ctx.user).not.toBeNull());
    act(() => { ctx.logout(); });
    expect(ctx.user).toBeNull();
  });
});
