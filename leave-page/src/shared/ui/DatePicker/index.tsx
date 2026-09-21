import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/shared/lib/cn';

interface DatePickerProps {
    value?: string; // YYYY-MM-DD
    onChange?: (value: string) => void;
    /** RHF Controller `field.onBlur` 와 직접 연결. */
    onBlur?: () => void;
    /** 선택 가능한 최소 날짜('YYYY-MM-DD', 포함). 이전 날짜는 비활성. */
    min?: string;
    /** 선택 가능한 최대 날짜('YYYY-MM-DD', 포함). 이후 날짜는 비활성. */
    max?: string;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    error?: boolean;
    className?: string;
}

const SIZE_CLASS = {
    sm: 'h-8 text-[13px] px-2.5',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-sm px-3.5',
};

const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEK_KR = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (v?: string): Date | null => {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};
const sameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
// 연도 빠른 선택 그리드의 페이지 시작 연도(12년 단위). MonthYearPicker 와 동일 규칙.
const yearPageStart = (y: number) => Math.floor(y / 12) * 12;

// 청사진 10.4 — 디자인 핸드오프의 6 모드(년/월/일 + range) 중 단일 date 모드 우선 구현.
// 나머지 모드는 차후 추가.
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(({
    value,
    onChange,
    onBlur,
    min,
    max,
    placeholder = '날짜 선택',
    size = 'md',
    disabled,
    error,
    className,
}, ref) => {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    // RHF / 부모가 trigger 를 직접 포커싱할 수 있게 노출.
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, []);
    const selected = parse(value);
    const today = new Date();
    // 최소 선택일(포함). 셀/오늘 비교는 자정 기준이라 parse() 결과와 동일 정밀도.
    const minDate = parse(min);
    const maxDate = parse(max);
    const outOfRange = (d: Date) => (!!minDate && d < minDate) || (!!maxDate && d > maxDate);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayDisabled = outOfRange(todayMid);

    const [open, setOpen] = useState(false);
    const [viewY, setViewY] = useState(() => (selected ?? today).getFullYear());
    const [viewM, setViewM] = useState(() => (selected ?? today).getMonth());
    // 'day' = 일 선택 캘린더, 'year' = 헤더 연도 클릭 시 뜨는 12년 빠른 선택 그리드.
    const [panel, setPanel] = useState<'day' | 'year'>('day');
    const [yearPageY, setYearPageY] = useState(() => yearPageStart((selected ?? today).getFullYear()));
    // 포털 팝업 좌표(viewport 기준, position: fixed). 모달 overflow 에 잘리지 않게 body 로 띄운다.
    const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

    // 트리거 위치에 맞춰 팝업 좌표 계산. 화면 우측/하단을 넘으면 보정(아래 공간 부족 시 위로 뒤집기).
    const POPUP_W = 288; // w-72
    const POPUP_H = 340; // 대략 높이(헤더+7주+퀵액션)
    const updatePos = () => {
        const t = triggerRef.current;
        if (!t) return;
        const r = t.getBoundingClientRect();
        const left = Math.min(r.left, window.innerWidth - POPUP_W - 8);
        const below = r.bottom + 4;
        const flipUp = below + POPUP_H > window.innerHeight && r.top - 4 - POPUP_H > 0;
        setPos({
            top: flipUp ? r.top - 4 - POPUP_H : below,
            left: Math.max(8, left),
            width: r.width,
        });
    };

    useLayoutEffect(() => {
        if (open) updatePos();
    }, [open]);

    // 팝업을 닫으면 다음 열림 때 항상 일 캘린더부터 시작.
    useEffect(() => {
        if (!open) setPanel('day');
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (wrapRef.current?.contains(target)) return;
            if (popupRef.current?.contains(target)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        const onReflow = () => updatePos();
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        // 캡처 단계로 스크롤을 받아 내부 스크롤 컨테이너(모달 본문 등)에서도 위치를 따라간다.
        window.addEventListener('scroll', onReflow, true);
        window.addEventListener('resize', onReflow);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onReflow, true);
            window.removeEventListener('resize', onReflow);
        };
    }, [open]);

    const firstDay = new Date(viewY, viewM, 1).getDay();
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(viewY, viewM, i));

    const shift = (delta: number) => {
        const m = viewM + delta;
        if (m < 0) {
            setViewY(viewY - 1);
            setViewM(11);
        } else if (m > 11) {
            setViewY(viewY + 1);
            setViewM(0);
        } else {
            setViewM(m);
        }
    };

    return (
        <div ref={wrapRef} className={cn('relative inline-block w-full', className)}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                onBlur={onBlur}
                className={cn(
                    'inline-flex w-full items-center justify-between gap-2 rounded-md border bg-neutral-0 outline-none transition-colors',
                    SIZE_CLASS[size],
                    error
                        ? 'border-danger-500 focus-visible:ring-2 focus-visible:ring-danger-500/30'
                        : 'border-neutral-200 focus-visible:ring-2 focus-visible:ring-primary-500/30 hover:border-neutral-300',
                    disabled && 'bg-neutral-50 cursor-not-allowed opacity-60',
                )}
            >
                <span className={cn('truncate text-left', !selected && 'text-neutral-400')}>
                    {selected ? fmt(selected) : placeholder}
                </span>
                <Icon name="calendar" size={14} className="text-neutral-400" />
            </button>

            {open && pos && createPortal(
                <div
                    ref={popupRef}
                    style={{ top: pos.top, left: pos.left }}
                    className="fixed z-[1500] w-72 rounded-md border border-neutral-200 bg-neutral-0 shadow-md p-3"
                >
                    {/* Header — 좌/우 chevron + 가운데 라벨(클릭 시 연도 그리드). */}
                    <div className="flex items-center justify-between mb-2">
                        <button
                            type="button"
                            onClick={() =>
                                panel === 'year' ? setYearPageY((y) => y - 12) : shift(-1)
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
                            aria-label={panel === 'year' ? '이전 12년' : '이전 달'}
                        >
                            <Icon name="chevronLeft" size={14} />
                        </button>
                        {panel === 'year' ? (
                            <div className="text-sm font-semibold text-neutral-900">
                                {yearPageY} - {yearPageY + 11}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setYearPageY(yearPageStart(viewY));
                                    setPanel('year');
                                }}
                                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
                                aria-label="연도 빠른 선택"
                            >
                                {viewY}년 {MONTHS_KR[viewM]}
                                <Icon name="chevronDown" size={12} className="text-neutral-400" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() =>
                                panel === 'year' ? setYearPageY((y) => y + 12) : shift(1)
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
                            aria-label={panel === 'year' ? '다음 12년' : '다음 달'}
                        >
                            <Icon name="chevronRight" size={14} />
                        </button>
                    </div>

                    {panel === 'year' ? (
                        /* Year grid — 3×4(12년). 연도 클릭 시 해당 연도로 이동 후 일 캘린더 복귀. */
                        <div className="grid grid-cols-3 gap-1.5">
                            {Array.from({ length: 12 }).map((_, i) => {
                                const y = yearPageY + i;
                                const yearDisabled =
                                    (!!minDate && y < minDate.getFullYear()) ||
                                    (!!maxDate && y > maxDate.getFullYear());
                                const isSelected = selected?.getFullYear() === y;
                                const isThisYear = today.getFullYear() === y;
                                return (
                                    <button
                                        key={y}
                                        type="button"
                                        disabled={yearDisabled}
                                        onClick={() => {
                                            if (yearDisabled) return;
                                            setViewY(y);
                                            setPanel('day');
                                        }}
                                        className={cn(
                                            'h-9 rounded text-[13px] transition-colors',
                                            yearDisabled
                                                ? 'text-neutral-300 cursor-not-allowed'
                                                : isSelected
                                                  ? 'bg-primary-500 text-white font-semibold'
                                                  : isThisYear
                                                    ? 'text-primary-700 font-semibold hover:bg-primary-50'
                                                    : 'text-neutral-700 hover:bg-neutral-100',
                                        )}
                                    >
                                        {y}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            {/* Weekdays */}
                            <div className="grid grid-cols-7 mb-1">
                                {WEEK_KR.map((d, i) => (
                                    <div
                                        key={d}
                                        className={cn(
                                            'h-7 flex items-center justify-center text-[11px] font-medium',
                                            i === 0
                                                ? 'text-danger-500'
                                                : i === 6
                                                  ? 'text-info-500'
                                                  : 'text-neutral-500',
                                        )}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {cells.map((d, i) =>
                                    d ? (
                                        <button
                                            key={i}
                                            type="button"
                                            disabled={outOfRange(d)}
                                            onClick={() => {
                                                if (outOfRange(d)) return;
                                                onChange?.(fmt(d));
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                'h-8 rounded text-[13px] transition-colors',
                                                outOfRange(d)
                                                    ? 'text-neutral-300 cursor-not-allowed'
                                                    : sameDay(d, selected)
                                                      ? 'bg-primary-500 text-white font-semibold'
                                                      : sameDay(d, today)
                                                        ? 'text-primary-700 font-semibold hover:bg-primary-50'
                                                        : 'text-neutral-700 hover:bg-neutral-100',
                                            )}
                                        >
                                            {d.getDate()}
                                        </button>
                                    ) : (
                                        <span key={i} className="h-8" />
                                    ),
                                )}
                            </div>
                        </>
                    )}

                    {/* Quick actions */}
                    <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            disabled={todayDisabled}
                            onClick={() => {
                                if (todayDisabled) return;
                                onChange?.(fmt(today));
                                setOpen(false);
                            }}
                            className={cn(
                                'text-[12px]',
                                todayDisabled
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : 'text-primary-600 hover:underline',
                            )}
                        >
                            오늘
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange?.('');
                                    setOpen(false);
                                }}
                                className="text-[12px] text-neutral-500 hover:text-neutral-900"
                            >
                                지우기
                            </button>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
});

DatePicker.displayName = 'DatePicker';
