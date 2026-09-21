import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Portal } from '@/shared/ui/Portal';
import { cn } from '@/shared/lib/cn';

type Position = 'top' | 'right' | 'bottom' | 'left';

/**
 * 말풍선 표면.
 *   dark  기본 — 짧은 보조 설명. 화면 위에 얹히는 느낌이 분명하다.
 *   light 표면형 — 문장·사유처럼 **읽어야 하는** 내용. 카드와 같은 흰 표면이라 눈이 덜 튄다.
 */
type Variant = 'dark' | 'light';

const SURFACE: Record<Variant, string> = {
    // bg-neutral-900 / text-text-inverse 둘 다 .dark 에서 반전 →
    // 라이트: 어두운 표면 + 흰 글자, 다크: 밝은 표면 + 어두운 글자.
    dark: 'whitespace-nowrap bg-neutral-900 text-text-inverse shadow-md',
    light: 'max-w-[220px] whitespace-pre-line break-keep border border-neutral-200 bg-neutral-0 text-text-primary shadow-md',
};

interface TooltipProps {
    content: ReactNode;
    position?: Position;
    /** 트리거 래퍼(span)에 덧붙일 클래스 — 예: 전체 폭 버튼을 감쌀 때 'w-full'. */
    className?: string;
    /** 말풍선 표면. 기본은 dark. 읽는 내용(사유·설명 문장)에는 light 가 낫다. */
    variant?: Variant;
    children: ReactNode;
}

interface Coords {
    top: number;
    left: number;
}

// 트리거 rect 와 desired position 으로 화면(viewport) 기준 fixed 좌표 계산.
// position: fixed + viewport coords → Portal 로 body 직속 렌더 시 가장 단순.
const computeCoords = (rect: DOMRect, position: Position, gap: number): Coords => {
    switch (position) {
        case 'top':
            return { top: rect.top - gap, left: rect.left + rect.width / 2 };
        case 'bottom':
            return { top: rect.bottom + gap, left: rect.left + rect.width / 2 };
        case 'left':
            return { top: rect.top + rect.height / 2, left: rect.left - gap };
        case 'right':
            return { top: rect.top + rect.height / 2, left: rect.right + gap };
    }
};

const TRANSFORM_BY_POSITION: Record<Position, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
};

export const Tooltip = ({
    content,
    position = 'top',
    className,
    variant = 'dark',
    children,
}: TooltipProps) => {
    const triggerRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<Coords | null>(null);

    useEffect(() => {
        if (!open) return;
        let raf = 0;
        const update = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords(computeCoords(rect, position, 6));
        };
        const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(update);
        };
        update();
        // capture=true → 중첩 스크롤 컨테이너 변경도 감지
        window.addEventListener('scroll', schedule, true);
        window.addEventListener('resize', schedule);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', schedule, true);
            window.removeEventListener('resize', schedule);
        };
    }, [open, position]);

    return (
        <>
            <span
                ref={triggerRef}
                className={cn('inline-flex', className)}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
            >
                {children}
            </span>
            {open && coords && (
                <Portal>
                    <span
                        role="tooltip"
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            transform: TRANSFORM_BY_POSITION[position],
                        }}
                        className={cn(
                            'pointer-events-none z-[1300] rounded-md px-2 py-1 text-[12px] leading-relaxed',
                            SURFACE[variant],
                        )}
                    >
                        {content}
                    </span>
                </Portal>
            )}
        </>
    );
};
