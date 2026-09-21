import type {
    ApprovalStep,
    LeaveApprover,
    LeaveRequest,
    LeaveRequestPage,
    LeaveRequestQueryParams,
    LeaveStatus,
} from './leave.types';

export const shiftYearMonth = (
    year: number,
    month: number,
    delta: number,
): { year: number; month: number } => {
    const total = year * 12 + month + delta;
    return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
};

const fmtIso = (d: Date): string => {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 연차년도 = 입사일 기념일 기준 1년 주기 (예: 2023-02-01 입사 → 매년 2/1 갱신).
// 아직 실제 입사일 데이터가 없어 mock 상수를 쓰지만, 나중에 실제 값이 들어와도
// 이 함수 시그니처(hireDate, todayIso)만 그대로 넘기면 되도록 순수 함수로 분리한다.
export const computeLeaveYearRange = (
    hireDate: string,
    todayIso: string,
): { start: string; end: string } => {
    const [, hm, hd] = hireDate.split('-').map(Number);
    const today = new Date(`${todayIso}T00:00:00`);
    let anniversaryYear = today.getFullYear();
    if (new Date(anniversaryYear, hm - 1, hd) > today) anniversaryYear -= 1;
    const start = new Date(anniversaryYear, hm - 1, hd);
    const end = new Date(anniversaryYear + 1, hm - 1, hd);
    end.setDate(end.getDate() - 1);
    return { start: fmtIso(start), end: fmtIso(end) };
};

export const STATUS_TONE: Record<LeaveStatus, 'warning' | 'success' | 'danger' | 'default'> = {
    진행중: 'warning',
    승인: 'success',
    반려: 'danger',
    취소: 'default',
};

export const formatPeriod = (r: { startDate: string; endDate: string }): string =>
    r.startDate === r.endDate ? r.startDate : `${r.startDate} ~ ${r.endDate}`;

const toDateNumber = (iso: string): number => Number(iso.replaceAll('-', ''));

type FilterParams = Pick<
    LeaveRequestQueryParams,
    'tab' | 'status' | 'kind' | 'startDate' | 'endDate'
>;

export const filterLeaveRequests = (
    records: LeaveRequest[],
    { tab, status, kind, startDate, endDate }: FilterParams,
    todayIso: string,
): LeaveRequest[] => {
    const today = toDateNumber(todayIso);
    return records.filter((r) => {
        if (tab === 'upcoming' && toDateNumber(r.startDate) < today) return false;
        if (tab === 'past' && toDateNumber(r.endDate) >= today) return false;
        if (status && r.status !== status) return false;
        if (kind && r.kind !== kind) return false;
        if (startDate && toDateNumber(r.endDate) < toDateNumber(startDate)) return false;
        if (endDate && toDateNumber(r.startDate) > toDateNumber(endDate)) return false;
        return true;
    });
};

export const sortByStartDateDesc = (records: LeaveRequest[]): LeaveRequest[] =>
    [...records].sort((a, b) => toDateNumber(b.startDate) - toDateNumber(a.startDate));

export const paginateLeaveRequests = (
    records: LeaveRequest[],
    page: number,
    size: number,
): LeaveRequestPage => {
    const start = (page - 1) * size;
    return {
        content: records.slice(start, start + size),
        totalElements: records.length,
    };
};

export const queryLeaveRequests = (
    records: LeaveRequest[],
    params: LeaveRequestQueryParams,
    todayIso: string,
): LeaveRequestPage => {
    const filtered = sortByStartDateDesc(filterLeaveRequests(records, params, todayIso));
    return paginateLeaveRequests(filtered, params.page, params.size);
};

// request.approvers 를 생략한 mock 레코드용 기본 결재선(팀장→본부장 2단계).
const DEFAULT_APPROVERS: LeaveApprover[] = [
    { name: '박서연', role: '팀장' },
    { name: '이현우', role: '본부장' },
];

const addDaysIso = (iso: string, offset: number): string => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// 결재선 길이(1명~여러 명)는 요청마다 다를 수 있어 request.approvers 를 그대로 순회한다.
export const buildApprovalTimeline = (request: LeaveRequest): ApprovalStep[] => {
    const applied: ApprovalStep = {
        name: '본인',
        role: '신청',
        at: request.appliedAt,
        kind: 'applied',
    };
    const approvers =
        request.approvers && request.approvers.length > 0 ? request.approvers : DEFAULT_APPROVERS;

    if (request.status === '승인') {
        return [
            applied,
            ...approvers.map((a, i) => ({
                ...a,
                at: addDaysIso(request.appliedAt, i + 1),
                kind: 'approved' as const,
            })),
        ];
    }
    if (request.status === '반려') {
        // 마지막 승인자 단계에서 반려된 것으로 표현 — 그 앞 단계는 모두 승인 처리.
        return [
            applied,
            ...approvers.map((a, i) => ({
                ...a,
                at: addDaysIso(request.appliedAt, i + 1),
                kind: i === approvers.length - 1 ? ('rejected' as const) : ('approved' as const),
            })),
        ];
    }
    if (request.status === '취소') {
        return [
            applied,
            { name: '본인', role: '취소', at: addDaysIso(request.appliedAt, 1), kind: 'canceled' },
        ];
    }
    // '진행중' — 앞에서부터 approvedCount 명은 이미 승인, 그다음 1명이 대기중, 나머지는 대기.
    const approvedCount = request.approvedCount ?? 0;
    return [
        applied,
        ...approvers.map((a, i) => ({
            ...a,
            at: i < approvedCount ? addDaysIso(request.appliedAt, i + 1) : null,
            kind:
                i < approvedCount
                    ? ('approved' as const)
                    : i === approvedCount
                      ? ('pending' as const)
                      : ('waiting' as const),
        })),
    ];
};
