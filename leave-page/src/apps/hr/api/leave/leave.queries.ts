import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todayYmd } from '@/shared/lib/todayYmd';
import {
    cancelLeaveRequestRecord,
    createLeaveRequestRecord,
    LEAVE_BALANCE,
    LEAVE_REQUESTS,
} from './leave.mock-data';
import { queryLeaveRequests } from './leave.query-logic';
import type {
    CreateLeaveRequestInput,
    LeaveBalance,
    LeaveRequest,
    LeaveRequestPage,
    LeaveRequestQueryParams,
} from './leave.types';

// 백엔드 없이 동작하는 포트폴리오용 mock — 로컬 배열 기반으로 지연시간만 흉내낸다.
const MOCK_DELAY_MS = 300;

const delay = <T>(value: T): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));

export const leaveKeys = {
    all: ['hr', 'leave'] as const,
    balance: () => [...leaveKeys.all, 'balance'] as const,
    list: (params: LeaveRequestQueryParams) => [...leaveKeys.all, 'list', params] as const,
};

export const useLeaveBalance = () =>
    useQuery({
        queryKey: leaveKeys.balance(),
        queryFn: (): Promise<LeaveBalance> => delay(LEAVE_BALANCE),
        staleTime: 1000 * 60,
    });

export const useLeaveRequests = (params: LeaveRequestQueryParams) =>
    useQuery({
        queryKey: leaveKeys.list(params),
        queryFn: (): Promise<LeaveRequestPage> => {
            const todayIso = todayYmd();
            return delay(queryLeaveRequests(LEAVE_REQUESTS, params, todayIso));
        },
        staleTime: 1000 * 30,
        placeholderData: keepPreviousData,
    });

export const useCreateLeaveRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateLeaveRequestInput): Promise<LeaveRequest> =>
            delay(createLeaveRequestRecord(input)),
        onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.all }),
    });
};

export const useCancelLeaveRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number): Promise<LeaveRequest> => delay(cancelLeaveRequestRecord(id)),
        onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.all }),
    });
};
