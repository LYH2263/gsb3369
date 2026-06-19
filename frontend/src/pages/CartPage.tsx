import React, { useEffect, useState } from 'react';
import { CartItem, clearCart, fetchCart, removeCartItem, updateCartItem } from '../api/cartApi';
import { createOrder } from '../api/orderApi';
import { useToast } from '../components/ToastProvider';
import { useCounts } from '../components/CountsProvider';
import { useConfirm } from '../components/ConfirmDialogProvider';
import { useAuth } from '../contexts/AuthContext';

export const CartPage: React.FC = () => {
  const { showToast } = useToast();
  const { setCartCount, setOrderCount } = useCounts();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const confirm = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      setItems(data);
      setSelectedIds(data.map((i) => i.id));
      setCartCount(data.length);
    } catch {
      showToast('加载购物车失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = items.reduce(
    (sum, item) =>
      selectedIds.includes(item.id) ? sum + item.book.price * item.quantity : sum,
    0
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const changeQuantity = async (item: CartItem, delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    try {
      await updateCartItem(item.id, next);
      await load();
    } catch {
      showToast('更新数量失败');
    }
  };

  const handleRemove = async (item: CartItem) => {
    try {
      await removeCartItem(item.id);
      await load();
    } catch {
      showToast('移除失败');
    }
  };

  const handleClear = async () => {
    if (isAdmin) {
      showToast('管理员账号不能操作购物车');
      return;
    }
    const ok = await confirm({
      title: '清空购物车',
      message: '确定清空购物车中的所有商品吗？'
    });
    if (!ok) return;
    try {
      await clearCart();
      await load();
    } catch {
      showToast('清空失败');
    }
  };

  const handleCheckout = async () => {
    if (isAdmin) {
      showToast('管理员账号不能提交订单');
      return;
    }
    if (items.length === 0 || selectedIds.length === 0) {
      showToast('请选择要结算的商品');
      return;
    }
    try {
      const selectedItems = items.filter((item) => selectedIds.includes(item.id));
      await createOrder({
        items: selectedItems.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity
        }))
      });
      showToast('下单成功');
      await load();
      setOrderCount((prev) => prev + 1);
    } catch {
      showToast('下单失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">购物车</h2>
          <p className="text-xs text-slate-600">调整数量并一键下单。</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={handleClear}
            disabled={isAdmin}
            className={`px-3 py-1.5 rounded-full border border-slate-200 ${
              isAdmin ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            清空
          </button>
          <button
            onClick={handleCheckout}
            disabled={isAdmin}
            className={`px-4 py-1.5 rounded-full text-white shadow-lg shadow-emerald-500/25 ${
              isAdmin ? 'bg-emerald-300 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            提交订单
          </button>
        </div>
      </div>

      {loading && <div className="h-24 glass-card animate-pulse" />}

      {!loading && items.length === 0 && (
        <div className="text-sm text-slate-700 bg-white/70 border border-slate-200 px-3 py-3 rounded-md">
          购物车目前是空的，去图书页挑几本吧。
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`glass-card px-4 py-3 flex items-center justify-between text-sm ${
                selectedIds.includes(item.id) ? '' : 'opacity-60'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSelect(item.id)}
                className={`mr-3 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                  selectedIds.includes(item.id)
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-white border-slate-300'
                }`}
              >
                {selectedIds.includes(item.id) && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>
              <div className="flex-1">
                <div className="font-medium">{item.book.name}</div>
                <div className="text-xs text-slate-400">
                  单价：¥{item.book.price.toFixed(2)} · 小计：
                  {(item.book.price * item.quantity).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeQuantity(item, -1)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => changeQuantity(item, 1)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center"
                >
                  +
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="ml-2 text-xs text-rose-700 hover:text-rose-600"
                >
                  移除
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-slate-700">合计</span>
            <span className="text-lg font-semibold text-emerald-700">
              ¥{total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

