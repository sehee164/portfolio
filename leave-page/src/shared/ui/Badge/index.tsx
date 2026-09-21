import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'coral' | 'info' | 'violet';
type Size = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
    size?: Size;
    dot?: boolean;
}

// 디자인 핸드오프 (ui-kit.jsx Badge): 모든 톤이 같은 neutral 배경을 쓰고, 텍스트 색만 톤별로 달라진다.
// 높이는 고정값 없이 padding + line-height 로만 결정 → 텍스트 길이에 정확히 맞춤.
const TONE_CLASS: Record<Tone, { text: string; dot: string }> = {
    default: { text: 'text-neutral-600', dot: 'bg-neutral-400' },
    primary: { text: 'text-primary-700', dot: 'bg-primary-500' },
    success: { text: 'text-success-700', dot: 'bg-success-500' },
    warning: { text: 'text-warning-700', dot: 'bg-warning-500' },
    danger: { text: 'text-danger-600', dot: 'bg-danger-500' },
    coral: { text: 'text-coral-700', dot: 'bg-coral-500' },
    info: { text: 'text-info-700', dot: 'bg-info-500' },
    violet: { text: 'text-violet-700', dot: 'bg-violet-500' },
};

const SIZE_CLASS: Record<Size, string> = {
    sm: 'px-1.5 py-px text-[10.5px] gap-[3px]',
    md: 'px-2 py-0.5 text-[11px] gap-1',
    lg: 'px-2.5 py-1 text-[12px] gap-1.5',
};

export const Badge = ({
    tone = 'default',
    size = 'md',
    dot,
    className,
    children,
    ...rest
}: BadgeProps) => {
    const t = TONE_CLASS[tone];
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-sm font-semibold leading-[1.4] whitespace-nowrap shrink-0 bg-neutral-100',
                t.text,
                SIZE_CLASS[size],
                className,
            )}
            {...rest}
        >
            {dot && <span className={cn('h-[5px] w-[5px] rounded-full', t.dot)} />}
            {children}
        </span>
    );
};
