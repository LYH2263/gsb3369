import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BookListPage } from './BookListPage';
import { CartPage } from './CartPage';
import { OrdersPage } from './OrdersPage';
import AuthPage from './AuthPage';
import { ToastProvider } from '../components/ToastProvider';
import { ErrorBoundaryWithToast } from '../components/ErrorBoundary';
import { CountsProvider, useCounts } from '../components/CountsProvider';
import { ConfirmDialogProvider } from '../components/ConfirmDialogProvider';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** 管理员不显示购物车页，直接重定向到首页 */
const CartRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { cartCount } = useCounts();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen gradient-bg text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">图书商城</h1>
            <p className="text-sm text-slate-600">轻盈科技感的在线图书购物体验</p>
            {user && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
                <span>当前用户：{user.username}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100">{user.role}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-rose-600 hover:text-rose-700"
                >
                  退出
                </button>
              </div>
            )}
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {[
              { to: '/', label: '图书' },
              ...(user?.role !== 'ADMIN' ? [{ to: '/cart', label: '购物车' }] : []),
              { to: '/orders', label: '订单' }
            ].map((item) => {
              const active =
                (item.to === '/' && location.pathname === '/') ||
                (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-3 py-1.5 rounded-full transition-all border ${
                    active
                      ? 'bg-sky-600 text-white border-sky-400/50 shadow-lg shadow-sky-500/30'
                      : 'bg-white/70 border-slate-200/70 hover:bg-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.to === '/cart' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center border border-white shadow-sm">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="glass-card p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4">{children}</div>
        </main>

        <footer className="mt-6 text-center text-xs text-slate-500 mt-auto">
          简易 SSM 图书商城
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <ErrorBoundaryWithToast>
        <AuthProvider>
          <ConfirmDialogProvider>
            <CountsProvider>
              <Routes>
                <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Routes>
                          <Route index element={<BookListPage />} />
                          <Route path="cart" element={<CartRoute><CartPage /></CartRoute>} />
                          <Route path="orders" element={<OrdersPage />} />
                        </Routes>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </CountsProvider>
          </ConfirmDialogProvider>
        </AuthProvider>
      </ErrorBoundaryWithToast>
    </ToastProvider>
  );
};

export default App;

