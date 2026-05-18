import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import Pagination from '../../components/admin/Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 47,
    pageSize: 10,
    onPageChange: vi.fn(),
  };

  test('renders nothing when totalPages is 1', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when totalPages is 0', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={0} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders Prev and Next buttons', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  test('renders all page number buttons', () => {
    render(<Pagination {...defaultProps} totalPages={3} totalItems={25} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  test('Prev button is disabled on the first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
  });

  test('Next button is disabled on the last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  test('calls onPageChange with next page on Next click', async () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test('calls onPageChange with prev page on Prev click', async () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: /prev/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('calls onPageChange with specific page on page button click', async () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} totalPages={3} totalItems={25} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('shows "Showing X – Y of Z Records" label', () => {
    render(<Pagination {...defaultProps} currentPage={2} totalPages={5} totalItems={47} pageSize={10} />);
    expect(screen.getByText(/showing 11/i)).toBeInTheDocument();
    expect(screen.getByText(/of 47/i)).toBeInTheDocument();
  });
});
