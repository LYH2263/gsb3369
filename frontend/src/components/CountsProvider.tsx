import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  SetStateAction
} from 'react';
import { fetchCart } from '../api/cartApi';
import { fetchOrdersPaged } from '../api/orderApi';
import { fetchOrders } from '../api/orderApi';
import { useAuth } from '../contexts/AuthContext';

type CountsContextValue = {
  cartCount: number;
  orderCount: number;
  setCartCount: Dispatch<SetStateAction<number>>;
  setOrderCount: Dispatch<SetStateAction<number>>;
};

const CountsContext = createContext<CountsContextValue | undefined>(undefined);

export const useCounts = () => {
  const ctx = useContext(CountsContext);
  if (!ctx) {
    throw new Error('useCounts must be used within CountsProvider');
  }
  return ctx;
};

export const CountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setCartCount(0);
        setOrderCount(0);
        return;
      }
      try {
        const cart = await fetchCart();
        setCartCount(cart.length);
      } catch {
        // 忽略初始化失败
        setCartCount(0);
      }
      try {
        const { total } = await fetchOrdersPaged(1, 1);
        setOrderCount(total);
      } catch {
        setOrderCount(0);
      }
    };
    void init();
  }, [user]);

  const value = useMemo(
    () => ({ cartCount, orderCount, setCartCount, setOrderCount }),
    [cartCount, orderCount]
  );

  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>;
};

