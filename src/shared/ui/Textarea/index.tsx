import {
    forwardRef,
    useLayoutEffect,
    useRef,
    type MutableRefObject,
    type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/shared/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
    /**
     * 입력 길이에 맞춰 높이를 자동으로 늘린다 — 내용이 길어져도 스크롤이 생기지 않고 쭉 펼쳐진다.
     * rows 가 최소 높이(처음 보이는 줄 수)를 정한다.
     */
    autoGrow?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ error, className, disabled, autoGrow, value, ...rest }, ref) => {
        // autoGrow 높이 측정을 위해 내부 ref 를 두고, 외부로 전달된 ref 와 동시에 채운다.
        const innerRef = useRef<HTMLTextAreaElement>(null);
        const setRefs = (node: HTMLTextAreaElement | null) => {
            innerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as MutableRefObject<HTMLTextAreaElement | null>).current = node;
        };

        // 값이 바뀔 때마다 height='auto' 로 먼저 줄였다가 scrollHeight 만큼 다시 늘린다.
        // 'auto' 선행 측정 덕분에 텍스트를 지웠을 때도 정상적으로 줄어든다. rows 가 최소 높이라
        // 빈 입력에서도 scrollHeight 가 rows 높이 이상이라 그 아래로는 줄지 않는다.
        useLayoutEffect(() => {
            if (!autoGrow) return;
            const el = innerRef.current;
            if (!el) return;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }, [autoGrow, value]);

        return (
            <textarea
                ref={setRefs}
                disabled={disabled}
                value={value}
                className={cn(
                    'w-full rounded-md border bg-neutral-0 px-3 py-2 text-sm outline-none transition-colors',
                    'placeholder:text-neutral-400 disabled:bg-neutral-50 disabled:cursor-not-allowed',
                    'focus:ring-2',
                    // 스크롤 없이 높이로만 늘어나도록 — 내부 스크롤/수동 리사이즈 핸들 제거.
                    autoGrow && 'resize-none overflow-hidden',
                    error
                        ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30'
                        : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/30',
                    className,
                )}
                {...rest}
            />
        );
    },
);
Textarea.displayName = 'Textarea';
