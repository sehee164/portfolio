import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, FormField, Modal, Textarea, useToast } from '@/shared/ui';
import { useCreateLeaveRequest } from '../api/leave/leave.queries';
import { shiftYearMonth } from '../api/leave/leave.query-logic';
import type { LeaveApplyEntry, LeaveKind } from '../api/leave/leave.types';

interface LeaveApplyModalProps {
    open: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

type ApplyMode = 'single' | 'range';

const DATE_TYPE_OPTIONS: LeaveKind[] = ['연차', '오전반차', '오후반차'];
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number): string => String(n).padStart(2, '0');
const isoOf = (y: number, m: number, d: number): string => `${y}-${pad(m + 1)}-${pad(d)}`;
const daysValueOf = (kind: LeaveKind): number => (kind === '연차' ? 1 : 0.5);

interface CalendarCell {
    iso: string | null;
    day: number | null;
}

const buildCalendarCells = (year: number, month: number): CalendarCell[] => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ iso: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ iso: isoOf(year, month, d), day: d });
    return cells;
};

export const LeaveApplyModal = ({ open, onClose, onCreated }: LeaveApplyModalProps) => {
    const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
    const [mode, setMode] = useState<ApplyMode>('single');
    const [selectedDates, setSelectedDates] = useState<LeaveApplyEntry[]>([]);
    const [rangeStart, setRangeStart] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const toast = useToast();
    const createLeaveRequest = useCreateLeaveRequest();

    const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
    const selectedSet = useMemo(() => new Set(selectedDates.map((e) => e.date)), [selectedDates]);
    const totalDays = selectedDates.reduce((sum, e) => sum + daysValueOf(e.kind), 0);
    const canSubmit = selectedDates.length > 0 && reason.trim().length > 0;

    // 요약 패널 높이를 달력 박스의 실제 렌더 높이에 맞춘다 — 달력은 월에 따라
    // 4~6주(행 수)로 높이가 달라지므로 고정값 대신 매번 측정해서 따라간다.
    //
    // Modal 은 Portal(내부에서 useEffect 로 document.body 를 타겟으로 잡는 구조)을
    // 쓰기 때문에, open 이 true 로 바뀌는 바로 그 렌더에서는 Portal 이 아직 null 을
    // 반환해 달력 DOM 이 존재하지 않는다 — `useLayoutEffect(..., [open])` 로 접근하면
    // 그 순간의 ref 가 항상 null 이라 딱 한 번뿐인 기회를 놓치고 이후 재실행되지
    // 않는다. 콜백 ref 를 쓰면 React 가 실제로 DOM 에 붙이는 시점에(몇 번째 렌더든)
    // 정확히 호출되므로 이 타이밍 문제를 피할 수 있다.
    const [calendarHeight, setCalendarHeight] = useState<number>();
    const calendarObserverRef = useRef<ResizeObserver | null>(null);

    const calendarBoxRef = useCallback((el: HTMLDivElement | null) => {
        calendarObserverRef.current?.disconnect();
        calendarObserverRef.current = null;
        if (!el) return;
        // contentRect 는 content-box(패딩·보더 제외) 기준이라, border-box인 이
        // 프로젝트 기준 높이(p-4 + border 만큼)와 어긋난다 — 실제 렌더 높이인
        // getBoundingClientRect 를 써서 패널의 height 와 정확히 맞춘다.
        // 부모 행은 items-start 라 달력 박스는 항상 자기 콘텐츠만큼의 순수한
        // 높이를 갖는다(items-stretch 였다면 패널 콘텐츠 때문에 달력이 먼저
        // 부풀려진 뒤 그 값을 측정하는 순환 오류가 생긴다).
        const measure = () => setCalendarHeight(el.getBoundingClientRect().height);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        calendarObserverRef.current = observer;
    }, []);

    const resetForm = () => {
        setMode('single');
        setSelectedDates([]);
        setRangeStart(null);
        setReason('');
        const current = new Date();
        setViewYear(current.getFullYear());
        setViewMonth(current.getMonth());
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleModeChange = (next: ApplyMode) => {
        setMode(next);
        setSelectedDates([]);
        setRangeStart(null);
    };

    const shiftMonth = (delta: number) => {
        const { year, month } = shiftYearMonth(viewYear, viewMonth, delta);
        setViewYear(year);
        setViewMonth(month);
    };

    const toggleSingleDate = (iso: string) => {
        setSelectedDates((prev) => {
            const exists = prev.some((e) => e.date === iso);
            if (exists) return prev.filter((e) => e.date !== iso);
            return [...prev, { date: iso, kind: '연차' as LeaveKind }].sort((a, b) =>
                a.date.localeCompare(b.date),
            );
        });
    };

    const handleRangeClick = (iso: string) => {
        if (!rangeStart) {
            setRangeStart(iso);
            setSelectedDates([{ date: iso, kind: '연차' }]);
            return;
        }
        let start = rangeStart;
        let end = iso;
        if (end < start) [start, end] = [end, start];
        const list: LeaveApplyEntry[] = [];
        const cur = new Date(`${start}T00:00:00`);
        const endDate = new Date(`${end}T00:00:00`);
        while (cur <= endDate) {
            list.push({
                date: isoOf(cur.getFullYear(), cur.getMonth(), cur.getDate()),
                kind: '연차',
            });
            cur.setDate(cur.getDate() + 1);
        }
        setRangeStart(null);
        setSelectedDates(list);
    };

    const handleDayClick = (iso: string) => {
        if (mode === 'single') toggleSingleDate(iso);
        else handleRangeClick(iso);
    };

    const setEntryKind = (date: string, kind: LeaveKind) => {
        setSelectedDates((prev) => prev.map((e) => (e.date === date ? { ...e, kind } : e)));
    };

    const setAllKind = (kind: LeaveKind) => {
        setSelectedDates((prev) => prev.map((e) => ({ ...e, kind })));
    };

    const removeDate = (date: string) => {
        setSelectedDates((prev) => prev.filter((e) => e.date !== date));
    };

    const clearRange = () => {
        setSelectedDates([]);
        setRangeStart(null);
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        createLeaveRequest.mutate(
            { entries: selectedDates, reason: reason.trim() },
            {
                onSuccess: () => {
                    toast.success('연차 신청이 완료되었습니다.');
                    onCreated?.();
                    handleClose();
                },
            },
        );
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="연차 신청"
            width={680}
            footer={
                <>
                    <Button variant="outline" onClick={handleClose}>
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        loading={createLeaveRequest.isPending}
                    >
                        연차 신청
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start gap-4">
                    <div
                        ref={calendarBoxRef}
                        className="min-w-[260px] flex-[1.15] rounded-lg border border-neutral-200 p-4"
                    >
                        <div className="mb-3 flex gap-1 border-b border-neutral-200">
                            <button
                                type="button"
                                onClick={() => handleModeChange('single')}
                                className={
                                    'flex-1 px-3 py-2 text-center text-[13px] font-medium ' +
                                    (mode === 'single'
                                        ? 'border-b-2 border-primary-500 text-primary-600'
                                        : 'text-neutral-500')
                                }
                            >
                                날짜 선택
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('range')}
                                className={
                                    'flex-1 px-3 py-2 text-center text-[13px] font-medium ' +
                                    (mode === 'range'
                                        ? 'border-b-2 border-primary-500 text-primary-600'
                                        : 'text-neutral-500')
                                }
                            >
                                기간 지정
                            </button>
                        </div>
                        <div className="mb-2.5 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => shiftMonth(-1)}
                                className="h-8 w-8 rounded text-neutral-500 hover:bg-neutral-100"
                                aria-label="이전 달"
                            >
                                ‹
                            </button>
                            <div className="text-[15px] font-semibold text-neutral-900">
                                {viewYear}년 {viewMonth + 1}월
                            </div>
                            <button
                                type="button"
                                onClick={() => shiftMonth(1)}
                                className="h-8 w-8 rounded text-neutral-500 hover:bg-neutral-100"
                                aria-label="다음 달"
                            >
                                ›
                            </button>
                        </div>
                        <div className="mb-1 grid grid-cols-7">
                            {WEEKDAYS.map((w) => (
                                <div
                                    key={w}
                                    className="flex h-8 items-center justify-center text-xs font-medium text-neutral-500"
                                >
                                    {w}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                            {cells.map((cell, i) =>
                                cell.iso === null ? (
                                    <span key={`blank-${i}`} />
                                ) : (
                                    <button
                                        key={cell.iso}
                                        type="button"
                                        onClick={() => handleDayClick(cell.iso as string)}
                                        className={
                                            'h-9 rounded text-[13px] ' +
                                            (selectedSet.has(cell.iso)
                                                ? 'bg-primary-500 text-white'
                                                : 'text-neutral-700 hover:bg-neutral-100')
                                        }
                                    >
                                        {cell.day}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                    <div
                        className="flex min-w-[240px] flex-[1.3] flex-col overflow-hidden rounded-lg border border-neutral-200 p-3"
                        style={calendarHeight ? { height: calendarHeight } : undefined}
                    >
                        <div className="mb-3 flex shrink-0 items-center justify-between border-b border-neutral-200 pb-2.5">
                            <span className="text-[12.5px] text-neutral-500">총 신청 일수</span>
                            <span className="text-[13px] font-bold text-primary-600">
                                {selectedDates.length > 0 ? `${totalDays}일` : '-일'}
                            </span>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {selectedDates.length === 0 ? (
                                <div className="flex min-h-[80px] items-center justify-center text-center text-[12.5px] text-neutral-400">
                                    달력에서 날짜를 선택하세요
                                </div>
                            ) : mode === 'range' ? (
                                <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-neutral-900">
                                            {selectedDates[0].date} ~{' '}
                                            {selectedDates[selectedDates.length - 1].date}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearRange}
                                            className="text-neutral-400 hover:text-danger-600"
                                            aria-label="선택 해제"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="flex gap-1">
                                        {DATE_TYPE_OPTIONS.map((kind) => (
                                            <button
                                                key={kind}
                                                type="button"
                                                disabled={kind !== '연차'}
                                                onClick={() => setAllKind(kind)}
                                                className={
                                                    'flex-1 rounded px-2 py-1 text-center text-xs disabled:cursor-not-allowed disabled:text-neutral-300 ' +
                                                    (selectedDates[0].kind === kind
                                                        ? 'bg-primary-50 text-primary-600'
                                                        : 'text-neutral-500')
                                                }
                                            >
                                                {kind}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {selectedDates.map((entry) => (
                                        <div
                                            key={entry.date}
                                            className="flex flex-col gap-2 rounded-md border border-neutral-200 p-2.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-neutral-900">
                                                    {entry.date}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDate(entry.date)}
                                                    className="text-neutral-400 hover:text-danger-600"
                                                    aria-label="삭제"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="flex gap-1">
                                                {DATE_TYPE_OPTIONS.map((kind) => (
                                                    <button
                                                        key={kind}
                                                        type="button"
                                                        onClick={() =>
                                                            setEntryKind(entry.date, kind)
                                                        }
                                                        className={
                                                            'flex-1 rounded px-2 py-1 text-center text-xs ' +
                                                            (entry.kind === kind
                                                                ? 'bg-primary-50 text-primary-600'
                                                                : 'text-neutral-500')
                                                        }
                                                    >
                                                        {kind}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <p className="-mt-1 text-xs text-neutral-500">
                    {mode === 'range'
                        ? '기간 지정 모드에서는 연차만 선택할 수 있습니다.'
                        : '날짜를 개별 선택하고 각각 연차/오전반차/오후반차를 지정하세요.'}
                </p>
                <FormField label="신청 사유" required>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="휴가 사유를 입력하세요"
                    />
                </FormField>
            </div>
        </Modal>
    );
};
