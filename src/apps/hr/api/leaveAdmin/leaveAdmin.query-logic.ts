import type { LeaveRequest } from '../leave/leave.types';
import type {
    EmployeeLeaveQueryParams,
    EmployeeLeaveSummary,
    EmployeeLeaveSummaryPage,
    LeaveAdminJobType,
} from './leaveAdmin.types';

export const deriveEmployeeLeaveSummary = (
    base: {
        employeeId: number;
        empNo: string;
        name: string;
        affiliation: string;
        position: string;
        positionOrder: number;
        positionJobType: LeaveAdminJobType;
    },
    requests: LeaveRequest[],
    leaveYearRange: { start: string; end: string },
): EmployeeLeaveSummary => {
    const approved = requests.filter((r) => r.status === '승인');
    const totalUsedLeaveDays = approved.reduce((sum, r) => sum + r.days, 0);
    const thisYearUsedLeaveDays = approved
        .filter((r) => r.startDate >= leaveYearRange.start && r.startDate <= leaveYearRange.end)
        .reduce((sum, r) => sum + r.days, 0);
    const pendingCount = requests.filter((r) => r.status === '진행중').length;
    return {
        ...base,
        totalUsedLeaveDays,
        thisYearUsedLeaveDays,
        pendingCount,
    };
};

type FilterParams = Pick<EmployeeLeaveQueryParams, 'keyword' | 'affiliation' | 'jobType'>;

export const filterEmployeeLeaveSummaries = (
    summaries: EmployeeLeaveSummary[],
    { keyword, affiliation, jobType }: FilterParams,
): EmployeeLeaveSummary[] =>
    summaries.filter((s) => {
        if (keyword) {
            const k = keyword.trim();
            const matches = s.name.includes(k) || s.empNo.toLowerCase().includes(k.toLowerCase());
            if (!matches) return false;
        }
        if (affiliation && s.affiliation !== affiliation) return false;
        if (jobType && s.positionJobType !== jobType) return false;
        return true;
    });

// 직급 순(positionOrder 오름차순, 총괄대표 등 상위 직급이 먼저) 정렬.
export const sortByPositionOrder = (summaries: EmployeeLeaveSummary[]): EmployeeLeaveSummary[] =>
    [...summaries].sort((a, b) => a.positionOrder - b.positionOrder);

export const paginateEmployeeLeaveSummaries = (
    summaries: EmployeeLeaveSummary[],
    page: number,
    size: number,
): EmployeeLeaveSummaryPage => {
    const start = (page - 1) * size;
    return {
        content: summaries.slice(start, start + size),
        totalElements: summaries.length,
    };
};

export const queryEmployeeLeaveSummaries = (
    summaries: EmployeeLeaveSummary[],
    params: EmployeeLeaveQueryParams,
): EmployeeLeaveSummaryPage => {
    const filtered = sortByPositionOrder(filterEmployeeLeaveSummaries(summaries, params));
    return paginateEmployeeLeaveSummaries(filtered, params.page, params.size);
};
