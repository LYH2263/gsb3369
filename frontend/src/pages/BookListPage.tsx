import React, { useEffect, useState } from 'react';
import {
  Book,
  BookRequest,
  PageResult,
  createBook,
  deleteBook,
  fetchBooks,
  updateBook
} from '../api/bookApi';
import { addToCart } from '../api/cartApi';
import { useToast } from '../components/ToastProvider';
import { useCounts } from '../components/CountsProvider';
import { useConfirm } from '../components/ConfirmDialogProvider';
import { useAuth } from '../contexts/AuthContext';

type FormMode = 'create' | 'edit';

const emptyForm: BookRequest = {
  name: '',
  author: '',
  price: 0,
  stock: 0
};

export const BookListPage: React.FC = () => {
  const { showToast } = useToast();
  const { setCartCount } = useCounts();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BookRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();

  const load = async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data: PageResult<Book> = await fetchBooks(targetPage, pageSize);
      setBooks(data.content);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      setError('加载图书失败');
      showToast('加载图书失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setFormMode('create');
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (book: Book) => {
    setFormMode('edit');
    setEditingId(book.id);
    setForm({
      name: book.name,
      author: book.author,
      price: book.price,
      stock: book.stock
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!form.name || form.price < 0 || form.stock < 0) {
        showToast('请填写合法的图书信息');
        setSubmitting(false);
        return;
      }
      if (formMode === 'create') {
        await createBook(form);
        showToast('创建图书成功');
      } else if (editingId != null) {
        await updateBook(editingId, form);
        showToast('更新图书成功');
      }
      setFormOpen(false);
      await load(page);
    } catch (e: any) {
      showToast('保存图书失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    const ok = await confirm({
      title: '删除图书',
      message: `确定删除图书「${book.name}」吗？`
    });
    if (!ok) return;
    try {
      await deleteBook(book.id);
      showToast('删除成功');
      await load(page);
    } catch {
      showToast('删除失败');
    }
  };

  const handleAddToCart = async (book: Book) => {
    if (isAdmin) {
      showToast('管理员账号不能加入购物车');
      return;
    }
    try {
      await addToCart(book.id, 1);
      showToast('已加入购物车');
      // 为了确保种类数量准确，这里重新拉一次购物车列表只用于更新计数
      try {
        const cart = await (await import('../api/cartApi')).fetchCart();
        setCartCount(cart.length);
      } catch {
        // 忽略计数更新失败
      }
    } catch {
      showToast('加入购物车失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">图书列表</h2>
          <p className="text-xs text-slate-600">管理图书信息，并一键加入购物车。</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white shadow-lg shadow-sky-500/30 transition-all"
          >
            新增图书
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-card h-32 animate-pulse bg-slate-100/80" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && books.length === 0 && (
        <div className="text-sm text-slate-700 bg-white/70 border border-slate-200 px-3 py-3 rounded-md">
          暂无图书记录，点击右上角“新增图书”开始创建吧。
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="glass-card p-4 flex flex-col justify-between hover:border-sky-400/60 hover:shadow-sky-500/40 transition-all"
            >
              <div>
                <h3 className="font-medium text-base mb-1">{book.name}</h3>
                <p className="text-xs text-slate-600 mb-2">{book.author || '未知作者'}</p>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>价格：¥{book.price.toFixed(2)}</span>
                  <span>库存：{book.stock}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 text-xs">
                {!isAdmin && (
                  <button
                    onClick={() => handleAddToCart(book)}
                    disabled={book.stock <= 0}
                    className={`px-3 py-1.5 rounded-full text-white shadow-sm shadow-emerald-500/20 transition-all ${
                      book.stock <= 0
                        ? 'bg-emerald-300 cursor-not-allowed opacity-70'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    加入购物车
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => openEdit(book)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(book)}
                      className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && total > pageSize && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-700">
          <div>
            共 {total} 本图书 · 每页 {pageSize} 本
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

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-base font-semibold mb-4">
              {formMode === 'create' ? '新增图书' : '编辑图书'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 text-slate-700">书名</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-700">作者</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">价格</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseFloat(e.target.value || '0') })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">库存</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: parseInt(e.target.value || '0', 10) })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200"
                >
                  取消
                </button>
                <button
                  disabled={submitting}
                  className="px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-60"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
