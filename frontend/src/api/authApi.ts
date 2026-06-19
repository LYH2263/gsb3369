import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export type AuthUser = {
  id: number;
  username: string;
  role: 'ADMIN' | 'USER';
};

export const login = async (username: string, password: string): Promise<AuthUser> => {
  const { data } = await axios.post<AuthUser>(`${baseURL}/auth/login`, {
    username,
    password
  });
  return data;
};

export const register = async (username: string, password: string): Promise<AuthUser> => {
  const { data } = await axios.post<AuthUser>(`${baseURL}/auth/register`, {
    username,
    password
  });
  return data;
};
