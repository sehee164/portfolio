import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EMPLOYEE_LEAVE_RECORDS } from './leaveAdmin.mock-data';
import { queryEmployeeLeaveSummaries } from './leaveAdmin.query-logic';
import type {
    EmployeeLeaveDetail,
    EmployeeLeaveQueryParams,
    EmployeeLeaveSummaryPage,
} from './leaveAdmin.types';

// 백엔드 없이 동작하는 포트폴리오용 mock — 로컬 배열 기반으로 지연시간만 흉내낸다.
const MOCK_DELAY_MS = 300;

const delay = <T,>(value: T): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));

export const leaveAdminKeys = {
    all: ['hr', 'leaveAdmin'] as const,
    list: (params: EmployeeLeaveQueryParams) => [...leaveAdminKeys.all, 'list', params] as const,
    detail: (employeeId: number) => [...leaveAdminKeys.all, 'detail', employeeId] as const,
};

export const useEmployeeLeaveSummaries = (params: EmployeeLeaveQueryParams) =>
    useQuery({
        queryKey: leaveAdminKeys.list(params),
        queryFn: (): Promise<EmployeeLeaveSummaryPage> => {
            const summaries = EMPLOYEE_LEAVE_RECORDS.map(({ requests, ...summary }) => {
                void requests;
                return summary;
            });
            return delay(queryEmployeeLeaveSummaries(summaries, params));
        },
        staleTime: 1000 * 30,
        placeholderData: keepPreviousData,
    });

export const useEmployeeLeaveDetail = (employeeId: number | null) =>
    useQuery({
        queryKey: leaveAdminKeys.detail(employeeId ?? -1),
        queryFn: (): Promise<EmployeeLeaveDetail> => {
            const found = EMPLOYEE_LEAVE_RECORDS.find((e) => e.employeeId === employeeId);
            if (!found) throw new Error('직원을 찾을 수 없습니다');
            return delay(found);
        },
        enabled: employeeId !== null,
        staleTime: 1000 * 30,
    });
