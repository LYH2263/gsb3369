import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BookListPage } from '../pages/BookListPage';
import { TestWrapper } from '../test-utils';

vi.mock('../api/bookApi', () => ({
  fetchBooks: vi.fn().mockResolvedValue({ content: [], total: 0, page: 1 }),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn()
}));

vi.mock('../api/cartApi', () => ({
  addToCart: vi.fn()
}));

describe('BookListPage', () => {
  beforeEach(() => {
    localStorage.setItem('bookstore_user', JSON.stringify({ id: 1, username: 'test', role: 'USER' }));
  });

  it('renders header text', async () => {
    render(
      <TestWrapper>
        <BookListPage />
      </TestWrapper>
    );
    expect(screen.getByText('图书列表')).toBeTruthy();
    expect(await screen.findByText('暂无图书记录，点击右上角“新增图书”开始创建吧。')).toBeTruthy();
  });
});
