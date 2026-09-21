import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { cn } from '@/shared/lib/cn';
import { ToastContext, type ToastContextValue, type ToastTone as Tone } from './context';

interface ToastItem {
    id: string;
    tone: Tone;
    message: string;
    duration: number;
}

const DEFAULT_DURATION: Record<Tone, number> = {
    success: 2000,
    info: 2000,
    warning: 3000,
    error: 4000,
};

const TONE_STYLE: Record<Tone, { bg: string; icon: IconName }> = {
    success: { bg: 'bg-success-50 text-success-700 border-success-200', icon: 'check' },
    info: { bg: 'bg-info-50 text-info-700 border-info-200', icon: 'info' },
    warning: { bg: 'bg-warning-50 text-warning-700 border-warning-200', icon: 'warn' },
    error: { bg: 'bg-danger-50 text-danger-700 border-danger-200', icon: 'warn' },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<ToastItem[]>([]);

    const toast = useCallback((tone: Tone, message: string, duration?: number) => {
        const id = Math.random().toString(36).slice(2);
        setItems((prev) => [...prev, { id, tone, message, duration: duration ?? DEFAULT_DURATION[tone] }]);
    }, []);

    const value: ToastContextValue = {
        toast,
        success: (m) => toast('success', m),
        info: (m) => toast('info', m),
        warning: (m) => toast('warning', m),
        error: (m) => toast('error', m),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-[1200] flex flex-col gap-2 pointer-events-none">
                        {items.map((it) => (
                            <ToastBubble
                                key={it.id}
                                item={it}
                                onClose={() =>
                                    setItems((prev) => prev.filter((x) => x.id !== it.id))
                                }
                            />
                        ))}
                    </div>,
                    document.body,
                )}
        </ToastContext.Provider>
    );
};

interface ToastBubbleProps {
    item: ToastItem;
    onClose: () => void;
}

const ToastBubble = ({ item, onClose }: ToastBubbleProps) => {
    useEffect(() => {
        const t = setTimeout(onClose, item.duration);
        return () => clearTimeout(t);
    }, [item.duration, onClose]);

    const { bg, icon } = TONE_STYLE[item.tone];
    return (
        <div
            className={cn(
                'pointer-events-auto inline-flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm shadow-md min-w-[240px] max-w-md',
                bg,
            )}
            role="status"
        >
            <Icon name={icon} size={16} />
            <span className="flex-1">{item.message}</span>
            <button
                type="button"
                onClick={onClose}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-current opacity-60 hover:opacity-100"
                aria-label="닫기"
            >
                <Icon name="x" size={12} />
            </button>
        </div>
    );
};
