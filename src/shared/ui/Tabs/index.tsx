import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { cn } from '@/shared/lib/cn';

export interface TabItem {
    key: string;
    label: ReactNode;
    count?: number;
}

interface TabsProps {
    value: string;
    onChange: (key: string) => void;
    items: TabItem[];
    dense?: boolean;
}

interface IndicatorRect {
    left: number;
    width: number;
}

export const Tabs = ({ value, onChange, items, dense }: TabsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
    const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
    const [animate, setAnimate] = useState(false);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const activeBtn = tabRefs.current.get(value);
        if (!container || !activeBtn) return;
        const containerRect = container.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        setIndicator({
            left: btnRect.left - containerRect.left,
            width: btnRect.width,
        });
    }, [value, items]);

    // 첫 위치 측정 직후 다음 프레임부터 트랜지션 활성화 — 마운트 시 0→실제 위치로 튀는 깜박임 방지.
    useEffect(() => {
        if (!indicator || animate) return;
        const id = requestAnimationFrame(() => setAnimate(true));
        return () => cancelAnimationFrame(id);
    }, [indicator, animate]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative inline-flex items-center border-b border-neutral-200',
                dense ? 'gap-0.5' : 'gap-1',
            )}
            role="tablist"
        >
            {items.map((it) => {
                const active = it.key === value;
                return (
                    <button
                        key={it.key}
                        ref={(el) => {
                            tabRefs.current.set(it.key, el);
                        }}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(it.key)}
                        className={cn(
                            'relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors',
                            active
                                ? 'text-primary-700'
                                : 'text-neutral-500 hover:text-neutral-900',
                        )}
                    >
                        {it.label}
                        {typeof it.count === 'number' && (
                            <span
                                className={cn(
                                    'ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                                    active
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-neutral-100 text-neutral-600',
                                )}
                            >
                                {it.count}
                            </span>
                        )}
                    </button>
                );
            })}
            {indicator && (
                <span
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute bottom-[-1px] h-0.5 rounded-full bg-primary-500',
                        animate &&
                            'transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                    )}
                    style={{ left: indicator.left, width: indicator.width }}
                />
            )}
        </div>
    );
};
