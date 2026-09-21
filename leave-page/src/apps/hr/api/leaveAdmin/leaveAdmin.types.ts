import type { LeaveRequest } from '../leave/leave.types';

// 실제 직군 7종 — 조직도(org.types.ts)의 단순화된 PositionJobType(임원/사무/승무/현장 4종)과는
// 별개로, 연차 조회 화면의 직군 필터가 요구하는 전체 목록을 그대로 반영한다.
export type LeaveAdminJobType =
    | '임원직'
    | '관리직'
    | '승무직'
    | '미화직'
    | '정비직'
    | '조리직'
    | '현장직';

export interface EmployeeLeaveSummary {
    employeeId: number;
    empNo: string; // 사번
    name: string;
    // 소속 — 직군에 따라 "부서"(임원직/현장직) 또는 "영업소"(승무직/미화직/정비직/조리직) 이름이
    // 들어간다. 관리직은 부서 소속일 수도, 영업소 소속일 수도 있다(직원마다 하나만 가짐).
    affiliation: string;
    position: string;
    positionOrder: number; // 직급 순서 — 낮을수록 상위 직급 (예: 총괄대표=1)
    positionJobType: LeaveAdminJobType;
    totalUsedLeaveDays: number; // 전체 사용연차 (전체 기간 승인 신청 합계)
    thisYearUsedLeaveDays: number; // 이번년도 사용연차 (연차년도 구간 내 승인 신청 합계)
    pendingCount: number; // 상태='진행중'인 신청 건수
}

export interface EmployeeLeaveDetail extends EmployeeLeaveSummary {
    requests: LeaveRequest[]; // 최근 순 정렬된 신청 내역
}

export interface EmployeeLeaveQueryParams {
    keyword?: string; // 이름 또는 사번 검색
    affiliation?: string; // 부서 또는 영업소 이름
    jobType?: LeaveAdminJobType; // 직군 필터 — affiliation 옵션도 이 값으로 좁혀진다
    page: number;
    size: number;
}

export interface EmployeeLeaveSummaryPage {
    content: EmployeeLeaveSummary[];
    totalElements: number;
}
