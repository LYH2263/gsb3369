import React, { useEffect, useState } from 'react';
import { Order, fetchOrder, fetchOrdersPaged } from '../api/orderApi';
import { useToast } from '../components/ToastProvider';

const pageSize = 8;

export const OrdersPage: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

  const load = async (targetPage = 1) => {
    setLoading(true);
    try {
      const { content, total: t } = await fetchOrdersPaged(targetPage, pageSize);
      setOrders(content);
      setTotal(t);
      setPage(targetPage);
      if (content.length > 0) {
        await loadDetail(content[0].id);
      } else {
        setSelectedId(null);
        setDetail(null);
      }
    } catch {
      showToast('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setSelectedId(id);
    try {
      const o = await fetchOrder(id);
      setDetail(o);
    } catch {
      showToast('加载订单详情失败');
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 space-y-2">
        <h2 className="text-lg font-semibold mb-2">订单列表</h2>
        {loading && <div className="glass-card h-24 animate-pulse" />}
        {!loading && orders.length === 0 && (
          <div className="text-xs text-slate-700 bg-white/70 border border-slate-200 px-3 py-3 rounded-md">
            暂无订单记录。
          </div>
        )}
        {!loading && orders.map((o) => (
            <button
              key={o.id}
              onClick={() => loadDetail(o.id)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs mb-1 transition-all ${
                selectedId === o.id
                  ? 'bg-sky-600 border-sky-400/50 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-white/70 border-slate-200/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>订单 #{o.id}</span>
                <span className="text-[11px]">{o.status}</span>
              </div>
              {o.userName != null && (
                <div className={`text-[11px] ${selectedId === o.id ? 'text-white/90' : 'text-slate-600'}`}>
                  购买用户：{o.userName} (ID: {o.userId})
                </div>
              )}
              <div className={`text-[11px] ${selectedId === o.id ? 'text-white/90' : 'text-slate-600'}`}>
                金额：¥{o.totalAmount.toFixed(2)}
              </div>
            </button>
          ))}
        {!loading && total > pageSize && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-700">
            <div>
              共 {total} 笔订单 · 每页 {pageSize} 笔
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="px-3 py-1 rounded-full border border-slate-200 bg-white disabled:opacity-50"
              >
                上一页
              </button>
              <span>
                第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页
              </span>
              <button
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => load(page + 1)}
                className="px-3 py-1 rounded-full border border-slate-200 bg-white disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <h2 className="text-lg font-semibold mb-2">订单详情</h2>
        {!detail && (
          <div className="text-xs text-slate-700 bg-white/70 border border-slate-200 px-3 py-3 rounded-md">
            请选择左侧订单查看详情。
          </div>
        )}
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="glass-card px-4 py-3">
              <div className="flex items-center justify-between">
                <span>订单编号：{detail.id}</span>
                <span className="text-xs text-slate-600">{detail.status}</span>
              </div>
              {detail.userName != null && (
                <div className="text-xs text-slate-600 mt-1">
                  购买用户：{detail.userName} (ID: {detail.userId})
                </div>
              )}
              <div className="text-xs text-slate-600 mt-1">
                创建时间：{detail.createdAt || '—'}
              </div>
              <div className="mt-2 text-sm">
                总金额：<span className="font-semibold text-emerald-700">
                  ¥{detail.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="glass-card px-4 py-3">
              <h3 className="text-sm font-semibold mb-2">订单项</h3>
              {detail.items && detail.items.length > 0 ? (
                <div className="space-y-2">
                  {detail.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between text-xs border-b border-white/5 pb-1 last:border-0"
                    >
                      <div>
                        <div>{it.book?.name || `图书 #${it.bookId}`}</div>
                        <div className="text-slate-600">
                          单价：¥{it.price.toFixed(2)} · 数量：{it.quantity}
                        </div>
                      </div>
                      <div className="font-medium text-emerald-700">
                        ¥{(it.price * it.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-700">暂无订单项。</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

