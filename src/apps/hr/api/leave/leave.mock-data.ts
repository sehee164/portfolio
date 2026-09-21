import { todayYmd } from '@/shared/lib/todayYmd';
import { computeLeaveYearRange } from './leave.query-logic';
import type { CreateLeaveRequestInput, LeaveBalance, LeaveRequest } from './leave.types';

// 실제 입사일 API 연동 전까지의 mock 값 — 연동 시 이 상수만 실제 값으로 교체하면 된다.
const MOCK_HIRE_DATE = '2023-02-01';

// 오늘 기준 상대 날짜로 생성 — 하드코딩된 절대 날짜는 시간이 지나면
// "예정 휴가"/"지난 휴가" 탭 분류가 어긋나므로 항상 오늘 기준으로 계산한다.
const isoDaysFromToday = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export let LEAVE_REQUESTS: LeaveRequest[] = [
    {
        id: 1,
        kind: '연차',
        status: '승인',
        startDate: isoDaysFromToday(-42),
        endDate: isoDaysFromToday(-41),
        days: 2,
        reason: '가족 여행',
        appliedAt: isoDaysFromToday(-47),
        // 결재선 1명(팀장 전결)인 경우.
        approvers: [{ name: '박서연', role: '팀장' }],
    },
    {
        id: 2,
        kind: '오전반차',
        status: '승인',
        startDate: isoDaysFromToday(-30),
        endDate: isoDaysFromToday(-30),
        days: 0.5,
        reason: '병원 진료',
        appliedAt: isoDaysFromToday(-31),
        // approvers 생략 → 기본 결재선(팀장→본부장 2명) 사용.
    },
    {
        id: 3,
        kind: '연차',
        status: '반려',
        startDate: isoDaysFromToday(-20),
        endDate: isoDaysFromToday(-18),
        days: 3,
        reason: '개인 사정',
        appliedAt: isoDaysFromToday(-25),
        // 결재선 3명(팀장→본부장→대표)인 경우 — 마지막 단계에서 반려.
        approvers: [
            { name: '박서연', role: '팀장' },
            { name: '이현우', role: '본부장' },
            { name: '최윤호', role: '총괄대표' },
        ],
    },
    {
        id: 4,
        kind: '연차',
        status: '승인',
        startDate: isoDaysFromToday(-14),
        endDate: isoDaysFromToday(-14),
        days: 1,
        reason: '경조사',
        appliedAt: isoDaysFromToday(-16),
        approvers: [{ name: '박서연', role: '팀장' }],
    },
    {
        id: 5,
        kind: '연차',
        status: '취소',
        startDate: isoDaysFromToday(-7),
        endDate: isoDaysFromToday(-6),
        days: 2,
        reason: '일정 변경',
        appliedAt: isoDaysFromToday(-10),
    },
    {
        id: 6,
        kind: '연차',
        status: '진행중',
        startDate: isoDaysFromToday(5),
        endDate: isoDaysFromToday(6),
        days: 2,
        reason: '가족 여행',
        appliedAt: isoDaysFromToday(0),
        // 결재선 1명 + 진행중(아직 미승인) — 신청 취소 버튼 노출 케이스.
        approvers: [{ name: '박서연', role: '팀장' }],
    },
    {
        id: 7,
        kind: '오전반차',
        status: '진행중',
        startDate: isoDaysFromToday(12),
        endDate: isoDaysFromToday(12),
        days: 0.5,
        reason: '병원 진료',
        appliedAt: isoDaysFromToday(1),
        // approvers 생략 → 기본 결재선 2명, 둘 다 미승인.
    },
    {
        id: 8,
        kind: '연차',
        status: '승인',
        startDate: isoDaysFromToday(20),
        endDate: isoDaysFromToday(22),
        days: 3,
        reason: '휴양',
        appliedAt: isoDaysFromToday(3),
        approvers: [
            { name: '박서연', role: '팀장' },
            { name: '이현우', role: '본부장' },
            { name: '최윤호', role: '총괄대표' },
        ],
    },
    {
        id: 9,
        kind: '연차',
        status: '진행중',
        startDate: isoDaysFromToday(35),
        endDate: isoDaysFromToday(36),
        days: 2,
        reason: '개인 사정',
        appliedAt: isoDaysFromToday(4),
        // 결재선 3명 + 진행중 — 셋 다 미승인이라 신청 취소 가능.
        approvers: [
            { name: '박서연', role: '팀장' },
            { name: '이현우', role: '본부장' },
            { name: '최윤호', role: '총괄대표' },
        ],
    },
    {
        id: 10,
        kind: '연차',
        status: '승인',
        startDate: isoDaysFromToday(-60),
        endDate: isoDaysFromToday(-59),
        days: 2,
        reason: '경조사',
        appliedAt: isoDaysFromToday(-63),
    },
    {
        id: 11,
        kind: '연차',
        status: '진행중',
        startDate: isoDaysFromToday(42),
        endDate: isoDaysFromToday(43),
        days: 2,
        reason: '가족 여행',
        appliedAt: isoDaysFromToday(2),
        // 결재선 2명 중 팀장은 이미 승인, 본부장만 대기중 — 한 명이라도 승인되면
        // 신청 취소 버튼이 비활성화되는 케이스.
        approvers: [
            { name: '박서연', role: '팀장' },
            { name: '이현우', role: '본부장' },
        ],
        approvedCount: 1,
    },
];

const leaveYearRange = computeLeaveYearRange(MOCK_HIRE_DATE, todayYmd());

export const LEAVE_BALANCE: LeaveBalance = {
    leaveYearStart: leaveYearRange.start,
    leaveYearEnd: leaveYearRange.end,
    usedLeaveDays: 6,
    fullDayDays: 5,
    halfDayCount: 2,
    nextLeave: { startDate: isoDaysFromToday(5), endDate: isoDaysFromToday(6) },
};

export const createLeaveRequestRecord = (input: CreateLeaveRequestInput): LeaveRequest => {
    const sorted = [...input.entries].sort((a, b) => a.date.localeCompare(b.date));
    const days = input.entries.reduce((sum, e) => sum + (e.kind === '연차' ? 1 : 0.5), 0);
    const maxId = LEAVE_REQUESTS.reduce((max, r) => Math.max(max, r.id), 0);
    const record: LeaveRequest = {
        id: maxId + 1,
        kind: sorted.length === 1 ? sorted[0].kind : '연차',
        status: '진행중',
        startDate: sorted[0].date,
        endDate: sorted[sorted.length - 1].date,
        days,
        reason: input.reason,
        appliedAt: todayYmd(),
    };
    LEAVE_REQUESTS = [record, ...LEAVE_REQUESTS];
    return record;
};

export const cancelLeaveRequestRecord = (id: number): LeaveRequest => {
    const target = LEAVE_REQUESTS.find((r) => r.id === id);
    if (!target) throw new Error(`신청 내역을 찾을 수 없습니다. (id: ${id})`);
    const canceled: LeaveRequest = { ...target, status: '취소' };
    LEAVE_REQUESTS = LEAVE_REQUESTS.map((r) => (r.id === id ? canceled : r));
    return canceled;
};
