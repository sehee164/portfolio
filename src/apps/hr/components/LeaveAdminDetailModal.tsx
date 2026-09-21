import { Fragment, useState } from 'react';
import { todayYmd } from '@/shared/lib/todayYmd';
import { Avatar, Badge, Button, Icon, Modal, Skeleton } from '@/shared/ui';
import { useEmployeeLeaveDetail } from '../api/leaveAdmin/leaveAdmin.queries';
import { formatPeriod, STATUS_TONE } from '../api/leave/leave.query-logic';
import { LeaveDetailModal } from './LeaveDetailModal';
import type { LeaveRequest } from '../api/leave/leave.types';

interface LeaveAdminDetailModalProps {
    employeeId: number | null;
    onClose: () => void;
}

export const LeaveAdminDetailModal = ({ employeeId, onClose }: LeaveAdminDetailModalProps) => {
    const { data: detail, isLoading, isError } = useEmployeeLeaveDetail(employeeId);
    const [year, setYear] = useState(() => Number(todayYmd().slice(0, 4)));
    const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

    // 다른 직원의 상세를 열 때마다 연도 선택을 올해 기준으로 초기화한다(렌더 중 상태 조정 —
    // effect 로 하면 리렌더가 한 번 더 생긴다. https://react.dev/learn/you-might-not-need-an-effect).
    const [prevEmployeeId, setPrevEmployeeId] = useState(employeeId);
    if (employeeId !== prevEmployeeId) {
        setPrevEmployeeId(employeeId);
        setYear(Number(todayYmd().slice(0, 4)));
    }

    if (employeeId === null) return null;

    return (
        <Fragment>
        <Modal
            open
            onClose={onClose}
            title="직원 연차 상세"
            width={560}
            // 화면이 넉넉할 때는 좀 더 여유 있게 — !w- 로 인라인 width 스타일을 이긴다.
            className="min-[900px]:!w-[720px] min-[1400px]:!w-[840px]"
            footer={
                <Button variant="outline" onClick={onClose}>
                    닫기
                </Button>
            }
        >
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : isError || !detail ? (
                <div className="py-8 text-center text-[13px] text-neutral-400">
                    직원 정보를 찾을 수 없습니다.
                </div>
            ) : (
                (() => {
                    const requestYears = detail.requests.map((r) => Number(r.startDate.slice(0, 4)));
                    const minYear = requestYears.length ? Math.min(...requestYears) : year;
                    const maxYear = requestYears.length ? Math.max(...requestYears) : year;
                    const yearRequests = detail.requests.filter((r) =>
                        r.startDate.startsWith(String(year)),
                    );
                    const yearUsedDays = yearRequests
                        .filter((r) => r.status === '승인')
                        .reduce((sum, r) => sum + r.days, 0);
                    return (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3 min-[440px]:flex-row min-[440px]:items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar name={detail.name} size={48} />
                                    <div className="min-w-0">
                                        <div className="truncate text-base font-bold text-neutral-900 min-[900px]:text-lg">
                                            {detail.name}
                                        </div>
                                        <div className="truncate text-[13px] text-neutral-500 min-[900px]:text-sm">
                                            {detail.affiliation} · {detail.position}
                                        </div>
                                    </div>
                                </div>
                                {/* 440px 미만의 아주 좁은 화면에서만 이름 줄 아래로 내려가고, 그 이상에서는
                                    ml-auto 로 오른쪽에 붙는다 — 통계 박스가 이름을 밀어내지 않도록.
                                    뷰포트 기준 sm(640px)은 모달 자체 폭(560px)보다 넓어 불필요하게 일찍
                                    쌓이므로, 실제 필요한 폭에 맞춘 커스텀 브레이크포인트를 쓴다. */}
                                <div className="flex items-center gap-2 min-[440px]:ml-auto min-[440px]:shrink-0">
                                    <div className="flex flex-1 flex-col items-start gap-0.5 rounded-lg bg-neutral-50 px-3 py-1.5 min-[440px]:flex-none">
                                        <span className="text-xs whitespace-nowrap text-neutral-500 min-[900px]:text-[13px]">
                                            전체 사용연차
                                        </span>
                                        <span className="text-base font-bold text-neutral-900 min-[900px]:text-lg">
                                            {detail.totalUsedLeaveDays}일
                                        </span>
                                    </div>
                                    <div className="flex flex-1 flex-col items-start gap-0.5 rounded-lg bg-primary-50 px-3 py-1.5 min-[440px]:flex-none">
                                        <span className="text-xs whitespace-nowrap text-neutral-500 min-[900px]:text-[13px]">
                                            이번년도 사용연차
                                        </span>
                                        <span className="text-base font-bold text-primary-600 min-[900px]:text-lg">
                                            {detail.thisYearUsedLeaveDays}일
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        {/* 440px 미만(세로로 쌓이는 좁은 화면)에서는 제목을 생략하고
                                            "해당 연도 사용 N일" + 연도 이동만 한 줄로 보여준다. */}
                                        <span className="hidden text-[13px] font-semibold text-neutral-900 min-[440px]:inline min-[900px]:text-sm min-[1400px]:text-base">
                                            전체 연차 신청 이력
                                        </span>
                                        {detail.requests.length > 0 && (
                                            <span className="text-xs text-neutral-500 min-[900px]:text-[13px] min-[1400px]:text-sm">
                                                해당 연도 사용{' '}
                                                <span className="font-semibold text-primary-600">
                                                    {yearUsedDays}일
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    {detail.requests.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                disabled={year <= minYear}
                                                onClick={() => setYear((y) => y - 1)}
                                                aria-label="이전 연도"
                                                className="min-[1400px]:h-9 min-[1400px]:w-9"
                                            >
                                                <Icon
                                                    name="chevronLeft"
                                                    size={14}
                                                    className="min-[1400px]:w-4 min-[1400px]:h-4"
                                                />
                                            </Button>
                                            <span className="w-12 text-center text-[13px] font-medium whitespace-nowrap text-neutral-700 min-[900px]:text-sm min-[1400px]:w-16 min-[1400px]:text-base">
                                                {year}년
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                disabled={year >= maxYear}
                                                onClick={() => setYear((y) => y + 1)}
                                                aria-label="다음 연도"
                                                className="min-[1400px]:h-9 min-[1400px]:w-9"
                                            >
                                                <Icon
                                                    name="chevronRight"
                                                    size={14}
                                                    className="min-[1400px]:w-4 min-[1400px]:h-4"
                                                />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {/* 실제 <table> 을 써야 헤더와 모든 행이 컬럼 폭을 공유한다 — 행마다
                                    독립된 grid 를 쓰면 "기간" 텍스트 길이가 다를 때 행별로 폭이
                                    제각각 계산돼 정렬이 어긋난다. 모바일처럼 좁은 화면에선
                                    overflow-x-auto 로 가로 스크롤(터치 스와이프도 네이티브 모멘텀
                                    스크롤로 자연스럽게 동작). */}
                                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                                    {/* 데이터 유무/연도와 무관하게 높이 고정(흔들리지 않도록) — 다만
                                        화면이 넓어져 모달이 커질 때는(위 className min-[900px]/
                                        [1400px]) 세로도 같이 여유로워지도록 높이 자체를 키워서 행이
                                        더 보이게 한다. thead 는 sticky 로 스크롤해도 고정. */}
                                    <div className="h-64 overflow-y-auto min-[900px]:h-80 min-[1400px]:h-96">
                                        {/* table-fixed + 퍼센트 폭 — 기간에 폭 지정이 없으면 남는
                                            공간을 혼자 흡수해 종류/기간이 왼쪽에, 일수/상태/신청일이
                                            오른쪽에 몰려 두 덩어리로 보인다. 단순 나열형 리스트라
                                            신원/통계 그룹 구분 없이 5개 컬럼 전부 퍼센트로 고르게
                                            나눈다. */}
                                        <table className="w-full min-w-[480px] table-fixed border-collapse text-[12px] min-[900px]:text-[13px]">
                                            <thead>
                                                <tr className="sticky top-0 z-10 bg-neutral-50">
                                                    <th className="w-[15%] border-b border-neutral-200 px-3 py-2 text-left text-[11px] font-bold text-neutral-500 min-[900px]:text-xs">
                                                        종류
                                                    </th>
                                                    <th className="w-[40%] border-b border-neutral-200 px-3 py-2 text-left text-[11px] font-bold text-neutral-500 min-[900px]:text-xs">
                                                        기간
                                                    </th>
                                                    <th className="w-[12%] border-b border-neutral-200 px-3 py-2 text-left text-[11px] font-bold text-neutral-500 min-[900px]:text-xs">
                                                        일수
                                                    </th>
                                                    <th className="w-[16%] border-b border-neutral-200 px-3 py-2 text-left text-[11px] font-bold text-neutral-500 min-[900px]:text-xs">
                                                        상태
                                                    </th>
                                                    <th className="w-[17%] border-b border-neutral-200 px-3 py-2 text-left text-[11px] font-bold text-neutral-500 min-[900px]:text-xs">
                                                        신청일
                                                    </th>
                                                    <th className="w-7 border-b border-neutral-200 px-3 py-2 sm:hidden" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yearRequests.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="h-64 text-center text-[13px] text-neutral-400 min-[900px]:h-80 min-[900px]:text-sm min-[1400px]:h-96"
                                                        >
                                                            {detail.requests.length === 0
                                                                ? '신청 내역이 없습니다.'
                                                                : `${year}년 신청 내역이 없습니다.`}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    yearRequests.map((r, i) => (
                                                        <tr
                                                            key={r.id}
                                                            onClick={() => setViewingRequest(r)}
                                                            className={
                                                                'cursor-pointer hover:bg-neutral-50' +
                                                                (i === yearRequests.length - 1
                                                                    ? ''
                                                                    : ' [&>td]:border-b [&>td]:border-neutral-100')
                                                            }
                                                        >
                                                            <td className="truncate px-3 py-2.5 font-medium text-neutral-900">
                                                                {r.kind}
                                                            </td>
                                                            <td className="truncate px-3 py-2.5 whitespace-nowrap text-neutral-700">
                                                                {formatPeriod(r)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-neutral-700">
                                                                {r.days}일
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <Badge tone={STATUS_TONE[r.status]} dot>
                                                                    {r.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-2.5 whitespace-nowrap text-neutral-500">
                                                                {r.appliedAt}
                                                            </td>
                                                            <td className="px-3 py-2.5 align-middle sm:hidden">
                                                                <Icon
                                                                    name="chevronRight"
                                                                    size={14}
                                                                    className="-translate-y-px text-neutral-400"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}
        </Modal>
        <LeaveDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />
        </Fragment>
    );
};
