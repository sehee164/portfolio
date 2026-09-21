export type LeaveStatus = '진행중' | '승인' | '반려' | '취소';
export type LeaveKind = '연차' | '오전반차' | '오후반차';
export type LeaveTab = 'all' | 'upcoming' | 'past';

export interface LeaveApprover {
    name: string;
    role: string;
}

export interface LeaveRequest {
    id: number;
    kind: LeaveKind;
    status: LeaveStatus;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    days: number;
    reason: string;
    appliedAt: string; // YYYY-MM-DD
    /** 결재선 — 부서/직급마다 승인 단계 수가 다르다(1명 ~ 여러 명). 생략 시 기본 결재선 사용. */
    approvers?: LeaveApprover[];
    /** status가 '진행중'일 때만 의미 있음 — 결재선 앞에서부터 이미 승인한 인원 수. 생략 시 0. */
    approvedCount?: number;
}

export interface LeaveBalance {
    leaveYearStart: string; // YYYY-MM-DD
    leaveYearEnd: string; // YYYY-MM-DD
    usedLeaveDays: number;
    fullDayDays: number;
    halfDayCount: number;
    nextLeave: { startDate: string; endDate: string } | null;
}

export interface LeaveRequestQueryParams {
    tab: LeaveTab;
    status?: LeaveStatus;
    kind?: LeaveKind;
    startDate?: string; // YYYY-MM-DD, 기간 검색 시작(포함)
    endDate?: string; // YYYY-MM-DD, 기간 검색 끝(포함)
    page: number;
    size: number;
}

export interface LeaveRequestPage {
    content: LeaveRequest[];
    totalElements: number;
}

export interface LeaveApplyEntry {
    date: string; // YYYY-MM-DD
    kind: LeaveKind;
}

export interface CreateLeaveRequestInput {
    entries: LeaveApplyEntry[];
    reason: string;
}

export interface ApprovalStep {
    name: string;
    role: string;
    at: string | null; // null = 아직 처리 안 됨
    kind: 'applied' | 'approved' | 'pending' | 'waiting' | 'rejected' | 'canceled';
}
