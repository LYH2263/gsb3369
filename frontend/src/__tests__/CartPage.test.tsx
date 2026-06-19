import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CartPage } from '../pages/CartPage';
import { TestWrapper } from '../test-utils';

vi.mock('../api/cartApi', () => ({
  fetchCart: vi.fn().mockResolvedValue([]),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn()
}));

vi.mock('../api/orderApi', () => ({
  createOrder: vi.fn()
}));

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.setItem('bookstore_user', JSON.stringify({ id: 1, username: 'test', role: 'USER' }));
  });

  it('renders title', async () => {
    render(
      <TestWrapper>
        <CartPage />
      </TestWrapper>
    );
    expect(screen.getByText('购物车')).toBeTruthy();
    expect(await screen.findByText('购物车目前是空的，去图书页挑几本吧。')).toBeTruthy();
  });
});
