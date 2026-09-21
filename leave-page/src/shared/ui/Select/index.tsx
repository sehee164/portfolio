import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
    type ReactElement,
    type ReactNode,
    type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/shared/lib/cn';

export interface SelectOption<T = string> {
    value: T;
    label: string;
    disabled?: boolean;
}

interface SelectProps<T = string> {
    value?: T;
    onChange?: (value: T) => void;
    /** Controller/onBlur 연동용. react-hook-form `field.onBlur` 를 그대로 넘기면 됨. */
    onBlur?: () => void;
    options: SelectOption<T>[];
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    error?: boolean;
    /** 선택값이 있을 때 호버하면 초기화(X) 버튼을 노출한다. onClear 와 함께 사용. */
    clearable?: boolean;
    /** clearable 일 때 X 버튼 클릭 시 호출 — 보통 onChange 로 빈 값을 넣어 초기화한다. */
    onClear?: () => void;
    /** 드롭다운 항목을 커스텀 렌더(예: 뱃지 UI). 미지정 시 label 텍스트만 표시. */
    renderOption?: (option: SelectOption<T>) => ReactNode;
    /** 트리거의 선택값을 커스텀 렌더. 미지정 시 label 텍스트만 표시. */
    renderValue?: (option: SelectOption<T>) => ReactNode;
    className?: string;
}

const SIZE_CLASS = {
    sm: 'h-8 text-[13px] px-2.5',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-sm px-3.5',
};

interface MenuPosition {
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    placement: 'top' | 'bottom';
}

const VIEWPORT_PADDING = 8;
const MIN_MENU_HEIGHT = 120;

// forwardRef + generic 호환을 위해 inner 함수에 ref 를 받고, 바깥에서 generic 캐스트로 노출.
// (react 의 forwardRef 시그니처가 generic 함수를 직접 받지 못해 흔히 쓰는 우회.)
const SelectInner = <T extends string | number = string>(
    {
        value,
        onChange,
        onBlur,
        options,
        placeholder = '선택',
        size = 'md',
        disabled,
        error,
        clearable,
        onClear,
        renderOption,
        renderValue,
        className,
    }: SelectProps<T>,
    ref: Ref<HTMLButtonElement>,
) => {
    const [open, setOpen] = useState(false);
    const [focusIdx, setFocusIdx] = useState<number>(-1);
    const [pos, setPos] = useState<MenuPosition | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // RHF Controller / 직접 ref 모두에서 trigger 포커싱 가능하도록 노출.
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, []);

    const selected = options.find((o) => o.value === value);

    // 메뉴 열린 동안 trigger 기준으로 좌표·placement·maxHeight 를 viewport 안에 들어오게 계산.
    useLayoutEffect(() => {
        if (!open) return;
        const updatePos = () => {
            const trigger = triggerRef.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            const spaceBelow = vh - rect.bottom - VIEWPORT_PADDING;
            const spaceAbove = rect.top - VIEWPORT_PADDING;
            // 기본 placement 는 아래. 아래 공간이 부족하고 위가 더 넓으면 위로 뒤집기.
            const placement: 'top' | 'bottom' =
                spaceBelow < MIN_MENU_HEIGHT && spaceAbove > spaceBelow ? 'top' : 'bottom';
            const maxHeight = Math.max(
                MIN_MENU_HEIGHT,
                placement === 'top' ? spaceAbove : spaceBelow,
            );
            // 좌우 overflow 방지 (trigger 가 viewport 우측 끝에 가까운 경우).
            const left = Math.max(
                VIEWPORT_PADDING,
                Math.min(rect.left, vw - rect.width - VIEWPORT_PADDING),
            );
            const top = placement === 'top' ? rect.top - 4 : rect.bottom + 4;
            setPos({ left, top, width: rect.width, maxHeight, placement });
        };
        updatePos();
        // scroll/resize 동안에도 anchor 따라가야 함. scroll 은 capture 단계에서 받아
        // 내부 스크롤 컨테이너 변경도 잡는다.
        window.addEventListener('scroll', updatePos, true);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos, true);
            window.removeEventListener('resize', updatePos);
        };
    }, [open]);

    // 외부 클릭·ESC 로 닫기. 포탈로 띄운 메뉴 내부 클릭은 wrapRef contains 가 false 라서
    // menuRef contains 도 같이 체크해야 옵션 선택 직전에 닫히지 않는다.
    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (wrapRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handleKey = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            setFocusIdx((idx) => {
                const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
                return Math.max(0, Math.min(options.length - 1, next));
            });
        } else if (e.key === 'Enter' && open && focusIdx >= 0) {
            e.preventDefault();
            const opt = options[focusIdx];
            if (opt && !opt.disabled) {
                onChange?.(opt.value);
                setOpen(false);
            }
        }
    };

    return (
        <div ref={wrapRef} className={cn('relative inline-block w-full', className)}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                onKeyDown={handleKey}
                onBlur={onBlur}
                className={cn(
                    'group inline-flex w-full items-center justify-between gap-2 rounded-md border bg-neutral-0 outline-none transition-colors',
                    SIZE_CLASS[size],
                    error
                        ? 'border-danger-500 focus-visible:ring-2 focus-visible:ring-danger-500/30'
                        : 'border-neutral-200 focus-visible:ring-2 focus-visible:ring-primary-500/30 hover:border-neutral-300',
                    disabled && 'bg-neutral-50 cursor-not-allowed opacity-60',
                )}
            >
                <span className={cn('flex min-w-0 truncate text-left', !selected && 'text-neutral-400')}>
                    {selected
                        ? (renderValue ?? renderOption)?.(selected) ?? selected.label
                        : placeholder}
                </span>
                {/* 선택값이 있고 clearable 이면 X(초기화) 버튼을 항상 노출한다.
                    (호버 전용이면 터치/모바일에서 해제할 방법이 없어, 항상 보이게 둔다.)
                    중첩 button 금지(트리거가 button)라 span[role=button] 으로 처리하고,
                    클릭이 트리거 토글로 번지지 않게 stopPropagation. chevron 은 그대로 유지. */}
                {clearable && selected && !disabled ? (
                    <span className="flex items-center gap-0.5 shrink-0">
                        <span
                            role="button"
                            tabIndex={-1}
                            aria-label="선택 초기화"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear?.();
                                setOpen(false);
                            }}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                        >
                            <Icon name="x" size={13} />
                        </span>
                        <Icon name="chevronDown" size={14} className="text-neutral-400" />
                    </span>
                ) : (
                    <Icon name="chevronDown" size={14} className="text-neutral-400 shrink-0" />
                )}
            </button>
            {open &&
                pos &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="listbox"
                        style={{
                            position: 'fixed',
                            left: pos.left,
                            top: pos.top,
                            width: pos.width,
                            maxHeight: pos.maxHeight,
                            ...(pos.placement === 'top' ? { transform: 'translateY(-100%)' } : null),
                        }}
                        // z-[1500] — DatePicker 캘린더 팝오버와 동일 레이어. 필드 편집 드로어(z-[1300])·
                        // 설정 모달(z-[1300]) 등 오버레이 안에서 열려도 메뉴가 뒤로 깔리지 않아야 한다.
                        className="z-[1500] overflow-hidden rounded-md border border-neutral-200 bg-neutral-0 shadow-md"
                    >
                        <ul
                            className="overflow-y-auto py-1"
                            style={{ maxHeight: pos.maxHeight }}
                        >
                            {options.map((o, idx) => {
                                const active = o.value === value;
                                const focused = idx === focusIdx;
                                return (
                                    <li
                                        key={String(o.value)}
                                        role="option"
                                        aria-selected={active}
                                        aria-disabled={o.disabled}
                                        onMouseEnter={() => setFocusIdx(idx)}
                                        onClick={() => {
                                            if (o.disabled) return;
                                            onChange?.(o.value);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            'flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer',
                                            o.disabled
                                                ? 'opacity-50 cursor-not-allowed'
                                                : focused
                                                  ? 'bg-primary-50 text-primary-700'
                                                  : 'text-neutral-700 hover:bg-neutral-50',
                                        )}
                                    >
                                        <span className="flex min-w-0 truncate">
                                            {renderOption ? renderOption(o) : o.label}
                                        </span>
                                        {active && (
                                            <Icon
                                                name="check"
                                                size={14}
                                                className="text-primary-500"
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>,
                    document.body,
                )}
        </div>
    );
};

// generic 보존을 위해 forwardRef 결과를 generic 함수 시그니처로 재선언.
export const Select = forwardRef(SelectInner) as <
    T extends string | number = string,
>(
    props: SelectProps<T> & { ref?: Ref<HTMLButtonElement> },
) => ReactElement | null;
