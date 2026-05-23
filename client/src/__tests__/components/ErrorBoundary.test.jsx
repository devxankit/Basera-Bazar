import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Suppress the expected console.error from React's error boundary
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const ThrowingChild = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Test error from child');
  return <div>Rendered OK</div>;
};

describe('ErrorBoundary', () => {
  test('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Rendered OK')).toBeInTheDocument();
  });

  test('shows full-page error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('shows section-specific message when section prop is provided', () => {
    render(
      <ErrorBoundary section="Admin">
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    // Both the h2 and p contain "Admin panel" — check the heading specifically
    expect(screen.getByRole('heading', { name: /Admin panel/i })).toBeInTheDocument();
  });

  test('renders inline fallback prop instead of full-page error UI', () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
  });

  test('shows a Back to Home button in full-page error mode', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
  });

  describe('handleReset redirect behavior', () => {
    beforeEach(() => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '',
        assign: vi.fn(),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test('routes to / by default for customer app crashes', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/some-customer-route',
      });

      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/');
    });

    test('routes to /admin/dashboard for Admin panel crashes', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/admin/settings',
      });

      render(
        <ErrorBoundary section="Admin">
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/admin/dashboard');
    });

    test('routes to /partner/home for Partner panel crashes', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/partner/settings',
      });

      render(
        <ErrorBoundary section="Partner">
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/partner/home');
    });

    test('routes to /executive/dashboard for Executive panel crashes', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/executive/settings',
      });

      render(
        <ErrorBoundary section="Executive">
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/executive/dashboard');
    });

    test('routes to /team-leader/dashboard for Staff panel crashes on a team-leader path', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/team-leader/some-page',
      });

      render(
        <ErrorBoundary section="Staff">
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/team-leader/dashboard');
    });

    test('routes to /office-staff/dashboard for Staff panel crashes on an office-staff path', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/office-staff/some-page',
      });

      render(
        <ErrorBoundary section="Staff">
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/office-staff/dashboard');
    });

    test('routes to / for Staff panel crashes on any other path', () => {
      vi.stubGlobal('location', {
        href: '',
        pathname: '/some-other-path',
      });

      render(
        <ErrorBoundary section="Staff">
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /back to home/i });
      button.click();

      expect(window.location.href).toBe('/');
    });
  });
});

