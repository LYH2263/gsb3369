import React, { createContext, useCallback, useContext, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type DialogState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return ctx;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DialogState | null>(null);

  const confirm: ConfirmFn = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '确认',
        cancelText: options.cancelText ?? '取消',
        resolve
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (state) {
      state.resolve(result);
      setState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass-card max-w-sm w-full mx-4 p-5 text-sm">
            {state.title && <h3 className="text-base font-semibold mb-2">{state.title}</h3>}
            <p className="text-slate-700 mb-4">{state.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200"
              >
                {state.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white"
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

