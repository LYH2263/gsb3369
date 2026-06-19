import React from 'react';
import { useToast } from './ToastProvider';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  static contextType = React.createContext(null);
  declare context: React.ContextType<typeof ErrorBoundary.contextType>;

  state: State = { hasError: false };

  componentDidCatch(error: Error) {
    // 在上层通过 ToastProvider 捕获异常提示
    // 这里不直接打印 console
    this.setState({ hasError: true });
    if ((window as any).__toast) {
      (window as any).__toast(`发生错误：${error.message}`);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center text-slate-900">
          <div className="glass-card px-8 py-6 text-center max-w-md">
            <h1 className="text-2xl font-semibold mb-2">页面出错了</h1>
            <p className="text-slate-600 text-sm">请刷新页面或稍后重试。</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundaryWithToast: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  (window as any).__toast = showToast;
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

