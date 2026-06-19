import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './contexts/AuthContext';
import { CountsProvider } from './components/CountsProvider';
import { ConfirmDialogProvider } from './components/ConfirmDialogProvider';

export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ConfirmDialogProvider>
          <CountsProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </CountsProvider>
        </ConfirmDialogProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
