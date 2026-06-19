import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { OrdersPage } from '../pages/OrdersPage';
import { TestWrapper } from '../test-utils';

vi.mock('../api/orderApi', () => ({
  fetchOrdersPaged: vi.fn().mockResolvedValue({ content: [], total: 0, page: 1, size: 8 }),
  fetchOrder: vi.fn()
}));

describe('OrdersPage', () => {
  beforeEach(() => {
    localStorage.setItem('bookstore_user', JSON.stringify({ id: 1, username: 'test', role: 'USER' }));
  });

  it('renders title', async () => {
    render(
      <TestWrapper>
        <OrdersPage />
      </TestWrapper>
    );
    expect(screen.getByText('订单列表')).toBeTruthy();
    expect(await screen.findByText('暂无订单记录。')).toBeTruthy();
  });
});
