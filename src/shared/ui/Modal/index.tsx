import { useEffect, type ReactNode } from 'react';
import { Icon } from '@/shared/ui/Icon';
import { Portal } from '@/shared/ui/Portal';
import { cn } from '@/shared/lib/cn';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    width?: number;
    /** 모달 박스(bg-neutral-0 rounded-xl 박스)에 덧붙일 클래스. 화면이 클 때 더 넓어지게
     * 하려면 `min-[900px]:!w-[720px]` 처럼 `!` 로 width 인라인 스타일을 이겨야 한다. */
    className?: string;
    hideClose?: boolean;
    closeOnBackdrop?: boolean;
    /** Escape 키로 닫기 허용 여부. 강제 확인이 필요한 모달은 false. 기본 true. */
    closeOnEsc?: boolean;
    /** 다른 모달(예: SettingsModal z-[1300]) 위에 스택할 때 명시. 기본 50. */
    zIndex?: number;
}

export const Modal = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    width = 480,
    className,
    hideClose,
    closeOnBackdrop = true,
    closeOnEsc = true,
    zIndex = 50,
}: ModalProps) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose, closeOnEsc]);

    if (!open) return null;

    return (
        <Portal>
        <div
            role="dialog"
            aria-modal
            // 다크모드 토큰 반전(neutral-900 → 거의 흰색) 으로 라이트 색 오버레이가 생기는 걸 방지
            // — 다크에선 literal black 으로 dim 시킨다. 라이트는 기존 외관 유지.
            // z-index 는 임의 값 주입을 허용하기 위해 inline style 로 처리 (Tailwind 동적 클래스 회피).
            style={{ zIndex }}
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={cn(
                    'flex flex-col rounded-xl bg-neutral-0 shadow-overlay max-h-[90vh] max-w-full overflow-hidden animate-[fadeIn_120ms_var(--ease-standard)]',
                    className,
                )}
                style={{ width }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {(title || !hideClose) && (
                    <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200">
                        <div className="flex flex-col gap-1 min-w-0">
                            {title && (
                                <h2 className="text-base font-bold text-neutral-900">{title}</h2>
                            )}
                            {description && (
                                <p className="text-[13px] text-neutral-500">{description}</p>
                            )}
                        </div>
                        {!hideClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
                                aria-label="닫기"
                            >
                                <Icon name="x" size={16} />
                            </button>
                        )}
                    </div>
                )}
                <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto text-sm text-neutral-700">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t border-neutral-200 bg-neutral-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
        </Portal>
    );
};
