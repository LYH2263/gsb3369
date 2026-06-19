import { apiClient } from './client';

export type OrderItem = {
  id: number;
  orderId: number;
  bookId: number;
  quantity: number;
  price: number;
  book?: {
    id: number;
    name: string;
  };
};

export type Order = {
  id: number;
  userId: number;
  /** 购买用户名称，管理员查看时由后端填充 */
  userName?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrderCreateItem = {
  bookId: number;
  quantity: number;
};

export type OrderCreateRequest = {
  items: OrderCreateItem[];
};

export type PageResult<T> = {
  content: T[];
  total: number;
  page: number;
  size: number;
};

export const fetchOrdersPaged = async (
  page: number,
  size: number
): Promise<PageResult<Order>> => {
  const { data } = await apiClient.get<PageResult<Order>>('/orders', {
    params: { page, size }
  });
  return data;
};

export const fetchOrder = async (id: number): Promise<Order> => {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
};

export const createOrderFromCart = async (): Promise<Order> => {
  const { data } = await apiClient.post<Order>('/orders/from-cart');
  return data;
};

export const createOrder = async (payload: OrderCreateRequest): Promise<Order> => {
  const { data } = await apiClient.post<Order>('/orders', payload);
  return data;
};

