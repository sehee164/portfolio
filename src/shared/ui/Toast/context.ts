import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastContextValue {
    toast: (tone: ToastTone, message: string, duration?: number) => void;
    success: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// ToastProvider(컴포넌트)와 파일을 나눈 이유: 컴포넌트 파일이 컴포넌트 외의
// 값을 export 하면 Fast Refresh 가 동작하지 않는다.
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
