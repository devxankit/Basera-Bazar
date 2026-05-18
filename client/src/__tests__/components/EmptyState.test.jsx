import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import EmptyState from '../../components/common/EmptyState';

const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;

describe('EmptyState', () => {
  test('renders the title', () => {
    render(<EmptyState title="No results found" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  test('renders the message when provided', () => {
    render(<EmptyState title="Empty" message="Try adjusting your filters" />);
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  test('does not render message element when message is omitted', () => {
    const { queryByText } = render(<EmptyState title="Empty" />);
    expect(queryByText(/try/i)).toBeNull();
  });

  test('renders the icon when provided', () => {
    render(<EmptyState icon={MockIcon} title="Empty" />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('does not render icon wrapper when icon is omitted', () => {
    const { queryByTestId } = render(<EmptyState title="Empty" />);
    expect(queryByTestId('mock-icon')).toBeNull();
  });

  test('renders the action element when provided', async () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={<button onClick={onAction}>Add Item</button>}
      />
    );
    const btn = screen.getByRole('button', { name: 'Add Item' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onAction).toHaveBeenCalledOnce();
  });

  test('does not render action wrapper when action is omitted', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
