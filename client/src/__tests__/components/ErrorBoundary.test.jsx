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

  test('shows a Refresh button in full-page error mode', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });
});
