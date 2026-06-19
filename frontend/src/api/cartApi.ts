import { apiClient } from './client';
import type { Book } from './bookApi';

export type CartItem = {
  id: number;
  userId: number;
  bookId: number;
  quantity: number;
  book: Book;
};

export const fetchCart = async (): Promise<CartItem[]> => {
  const { data } = await apiClient.get<CartItem[]>('/cart');
  return data;
};

export const addToCart = async (bookId: number, quantity: number): Promise<void> => {
  await apiClient.post('/cart', null, { params: { bookId, quantity } });
};

export const updateCartItem = async (id: number, quantity: number): Promise<void> => {
  await apiClient.put(`/cart/${id}`, null, { params: { quantity } });
};

export const removeCartItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/cart/${id}`);
};

export const clearCart = async (): Promise<void> => {
  await apiClient.delete('/cart/clear');
};

