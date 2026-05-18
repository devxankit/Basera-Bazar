import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import FilterBar, { FilterField } from '../../components/admin/FilterBar';

describe('FilterBar', () => {
  test('renders nothing when open is false', () => {
    const { container } = render(<FilterBar open={false} onReset={vi.fn()}><div>child</div></FilterBar>);
    expect(container.firstChild).toBeNull();
  });

  test('renders children when open is true', () => {
    render(<FilterBar open={true} onReset={vi.fn()}><span>Filter Input</span></FilterBar>);
    expect(screen.getByText('Filter Input')).toBeInTheDocument();
  });

  test('does not show Reset button when activeCount is 0', () => {
    render(<FilterBar open={true} onReset={vi.fn()} activeCount={0}><div /></FilterBar>);
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull();
  });

  test('shows Reset button with count when activeCount > 0', () => {
    render(<FilterBar open={true} onReset={vi.fn()} activeCount={2}><div /></FilterBar>);
    expect(screen.getByRole('button', { name: /reset.*2/i })).toBeInTheDocument();
  });

  test('calls onReset when Reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<FilterBar open={true} onReset={onReset} activeCount={1}><div /></FilterBar>);
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});

describe('FilterField', () => {
  test('renders label and children', () => {
    render(
      <FilterField label="Status">
        <select><option>All</option></select>
      </FilterField>
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
