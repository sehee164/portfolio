import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { cn } from '@/shared/lib/cn';

export type CalloutTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

// 톤별 전체 클래스 문자열 — Tailwind JIT 가 정적으로 스캔하도록 동적 조합 금지.
// 색 shade 는 토큰에 정의된 50/100/600/700 만 사용한다.
const TONE: Record<CalloutTone, { box: string; icon: string; defaultIcon: IconName }> = {
    danger: {
        box: 'bg-danger-50 border-danger-100 text-danger-700',
        icon: 'text-danger-600',
        defaultIcon: 'warn',
    },
    warning: {
        box: 'bg-warning-50 border-warning-100 text-warning-700',
        icon: 'text-warning-600',
        defaultIcon: 'warn',
    },
    info: {
        box: 'bg-info-50 border-info-100 text-info-700',
        icon: 'text-info-600',
        defaultIcon: 'info',
    },
    success: {
        box: 'bg-success-50 border-success-100 text-success-700',
        icon: 'text-success-600',
        defaultIcon: 'check',
    },
    neutral: {
        box: 'bg-bg-subtle border-neutral-200 text-neutral-700',
        icon: 'text-neutral-500',
        defaultIcon: 'info',
    },
};

interface CalloutProps {
    /** 색/기본 아이콘을 결정. 안심·정보=info/success, 주의=warning, 파괴적=danger. */
    tone?: CalloutTone;
    /** 좌측 아이콘. 생략 시 톤별 기본 아이콘. null 이면 아이콘 없음. */
    icon?: IconName | null;
    /** 한 줄 강조 제목(선택). 본문 위에 굵게. */
    title?: ReactNode;
    children?: ReactNode;
    className?: string;
}

/**
 * 모달·패널 안에서 "중요한 한 덩어리"를 표면 위로 띄워 강조하는 콜아웃 박스.
 * 긴 안내문을 회색 평문으로 흘리는 대신, 톤(색)과 아이콘으로 핵심을 즉시 인지시킨다.
 */
export const Callout = ({ tone = 'neutral', icon, title, children, className }: CalloutProps) => {
    const t = TONE[tone];
    const iconName = icon === null ? null : (icon ?? t.defaultIcon);
    return (
        <div
            className={cn(
                'flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed',
                t.box,
                className,
            )}
        >
            {iconName && (
                <Icon name={iconName} size={16} className={cn('mt-0.5 shrink-0', t.icon)} />
            )}
            <div className="min-w-0 flex-1">
                {title && <p className="mb-0.5 font-semibold">{title}</p>}
                {children}
            </div>
        </div>
    );
};
