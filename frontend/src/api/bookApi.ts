import { apiClient } from './client';

export type Book = {
  id: number;
  name: string;
  author?: string;
  price: number;
  stock: number;
};

export type BookRequest = Omit<Book, 'id'>;

export type PageResult<T> = {
  content: T[];
  total: number;
  page: number;
  size: number;
};

export const fetchBooks = async (page = 1, size = 8): Promise<PageResult<Book>> => {
  const { data } = await apiClient.get<PageResult<Book>>('/books', {
    params: { page, size }
  });
  return data;
};

export const createBook = async (payload: BookRequest): Promise<Book> => {
  const { data } = await apiClient.post<Book>('/books', payload);
  return data;
};

export const updateBook = async (id: number, payload: BookRequest): Promise<Book> => {
  const { data } = await apiClient.put<Book>(`/books/${id}`, payload);
  return data;
};

export const deleteBook = async (id: number): Promise<void> => {
  await apiClient.delete(`/books/${id}`);
};

