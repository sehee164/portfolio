import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { todayYmd } from '@/shared/lib/todayYmd';
import { PageLayout } from '@/shared/layout/PageLayout';
import {
    Badge,
    Button,
    Card,
    DatePicker,
    EmptyState,
    Icon,
    Pagination,
    Select,
    Skeleton,
    Tabs,
    type IconName,
    type TabItem,
} from '@/shared/ui';
import leaveCalendarIllustration from '../assets/leave-calendar-illustration.png';
import leaveCalendarIllustrationDark from '../assets/leave-calendar-illustration-dark.png';
import { FloatingFilterBox } from '../components/FloatingFilterBox';
import { LeaveApplyModal } from '../components/LeaveApplyModal';
import { LeaveDetailModal } from '../components/LeaveDetailModal';
import { useLeaveBalance, useLeaveRequests } from '../api/leave/leave.queries';
import { formatPeriod, STATUS_TONE } from '../api/leave/leave.query-logic';
import type { LeaveKind, LeaveRequest, LeaveStatus, LeaveTab } from '../api/leave/leave.types';

const formatYmdDot = (iso: string): string => iso.replaceAll('-', '.');

// "다음 휴가" 처럼 좁은 칸에 넣을 때는 연도를 빼고 월.일만 — 잘라서 "..."으로 보여주면
// 정작 필요한 날짜 정보가 안 보이니, 아예 짧게 줄여서 한 줄에 다 들어가게 한다.
const formatMonthDay = (iso: string): string => iso.slice(5).replace('-', '.');
const formatShortPeriod = (r: { startDate: string; endDate: string }): string =>
    r.startDate === r.endDate
        ? formatMonthDay(r.startDate)
        : `${formatMonthDay(r.startDate)}~${formatMonthDay(r.endDate)}`;

const PAGE_SIZE = 8;

// Select/DatePicker(디자인 시스템)는 그대로 두고, 기존 `className` prop으로 내부 트리거
// 버튼(직계 자식)의 테두리·배경만 지워서 FloatingFilterBox 하나로 통합된 것처럼 보이게
// 한다 — 실험적 필터 디자인 전용, 이 페이지 바깥엔 영향 없음.
const SELECT_OVERRIDE = '[&>button]:border-transparent [&>button]:bg-transparent [&>button]:hover:border-transparent';
const SELECT_OVERRIDE_ACTIVE = '[&>button_svg]:text-primary-500';

const STATUS_OPTIONS: { value: LeaveStatus | 'all'; label: string }[] = [
    { value: 'all', label: '전체 상태' },
    { value: '진행중', label: '진행중' },
    { value: '승인', label: '승인' },
    { value: '반려', label: '반려' },
    { value: '취소', label: '취소' },
];

const KIND_OPTIONS: { value: LeaveKind | 'all'; label: string }[] = [
    { value: 'all', label: '전체 종류' },
    { value: '연차', label: '연차' },
    { value: '오전반차', label: '오전반차' },
    { value: '오후반차', label: '오후반차' },
];

const TAB_ITEMS: TabItem[] = [
    { key: 'all', label: '전체' },
    { key: 'upcoming', label: '예정 휴가' },
    { key: 'past', label: '지난 휴가' },
];

export const LeavePage = () => {
    const [tab, setTab] = useState<LeaveTab>('all');
    const [status, setStatus] = useState<LeaveStatus | 'all'>('all');
    const [kind, setKind] = useState<LeaveKind | 'all'>('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [isApplyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    const { data: balance, isLoading: isBalanceLoading } = useLeaveBalance();
    const {
        data: pageData,
        isLoading,
        isFetching,
    } = useLeaveRequests({
        tab,
        status: status === 'all' ? undefined : status,
        kind: kind === 'all' ? undefined : kind,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        page,
        size: PAGE_SIZE,
    });

    const requests = pageData?.content ?? [];
    const totalElements = pageData?.totalElements ?? 0;
    const todayIso = todayYmd();
    const isUpcoming = (r: LeaveRequest): boolean => r.startDate >= todayIso;

    const handleTabChange = (key: string) => {
        setTab(key as LeaveTab);
        setPage(1);
    };

    // 탭(전체/예정/지난)은 초기화 대상이 아니다 — 상태/종류/기간 필터만 초기화한다.
    const hasFilter = status !== 'all' || kind !== 'all' || !!filterStartDate || !!filterEndDate;

    const clearFilters = () => {
        setStatus('all');
        setKind('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setPage(1);
    };

    return (
        <PageLayout
            title="연차 관리"
            breadcrumbs={['MY', '연차']}
            actions={
                <Button
                    leftIcon={<Icon name="plus" size={16} />}
                    onClick={() => setApplyModalOpen(true)}
                >
                    연차 신청
                </Button>
            }
        >
            <Card padded={false} className="mb-4 flex min-h-[140px] items-stretch overflow-hidden">
                {isBalanceLoading || !balance ? (
                    <div className="flex flex-1 items-center gap-6 p-5">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                ) : (
                    <>
                        <div className="relative hidden flex-1 basis-1/2 flex-col justify-center gap-1.5 overflow-hidden bg-gradient-to-br from-neutral-0 via-primary-50 to-primary-100 px-6 py-5 sm:flex">
                            {/* 패널 폭이 sm 근처로 좁아질수록 이미지가 텍스트와 겹치듯 가까워지므로,
                                폭이 줄수록 투명도를 높여(불투명도를 낮춰) 자연스럽게 옅어지게 한다. */}
                            <img
                                src={leaveCalendarIllustration}
                                alt=""
                                className="pointer-events-none absolute -right-2 -bottom-3.5 h-[168px] w-auto opacity-35 [mask-image:linear-gradient(95deg,transparent_4%,rgba(0,0,0,0.65)_26%,black_58%)] min-[760px]:opacity-55 min-[880px]:opacity-70 min-[1024px]:opacity-85 dark:hidden"
                            />
                            {/* 다크 모드 전용 일러스트 — 카드 배경(neutral-0/primary-50 토큰이
                                다크에서 자동으로 짙은 남색으로 반전됨)과 자연스럽게 섞이도록
                                라이트보다 살짝 더 투명하게, 왼쪽은 더 넓게 페이드아웃한다. */}
                            <img
                                src={leaveCalendarIllustrationDark}
                                alt=""
                                className="pointer-events-none absolute -right-2 -bottom-3.5 hidden h-[168px] w-auto opacity-20 [mask-image:linear-gradient(95deg,transparent_10%,rgba(0,0,0,0.55)_32%,black_62%)] min-[760px]:opacity-35 min-[880px]:opacity-50 min-[1024px]:opacity-60 dark:block"
                            />
                            <div className="relative flex flex-col gap-1.5">
                                <span className="text-base font-bold whitespace-nowrap text-neutral-900">
                                    {formatYmdDot(balance.leaveYearStart)} ~{' '}
                                    {formatYmdDot(balance.leaveYearEnd)}
                                </span>
                                <span className="text-[13px] text-neutral-500">
                                    이번년도 사용 연차
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[34px] leading-none font-extrabold tracking-tight text-primary-600">
                                        {balance.usedLeaveDays}
                                    </span>
                                    <span className="text-base font-bold text-primary-600">일</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-1 items-center border-neutral-200 px-2 py-4 sm:basis-1/2 sm:border-l">
                            <BalanceStat
                                className="flex-1"
                                icon="calendarCheck"
                                iconClassName="text-primary-600"
                                label="연차 사용"
                                value={`${balance.fullDayDays}일`}
                            />
                            <div className="self-stretch w-px shrink-0 bg-neutral-200" />
                            <BalanceStat
                                className="flex-1"
                                icon="calendarClock"
                                iconClassName="text-success-500"
                                label="반차 사용"
                                value={`${balance.halfDayCount}건`}
                            />
                            <div className="self-stretch w-px shrink-0 bg-neutral-200" />
                            <BalanceStat
                                className={
                                    // 기간(2일 이상)일 때만 값이 길어지므로 넓게, 하루짜리/없음이면
                                    // 다른 칸과 동일한 폭으로.
                                    balance.nextLeave &&
                                    balance.nextLeave.startDate !== balance.nextLeave.endDate
                                        ? 'flex-[1.6]'
                                        : 'flex-1'
                                }
                                icon="flag"
                                iconClassName="text-violet-600"
                                label="다음 휴가"
                                value={
                                    balance.nextLeave ? formatShortPeriod(balance.nextLeave) : '없음'
                                }
                            />
                        </div>
                    </>
                )}
            </Card>

            <Card padded={false} className="flex flex-col">
                {/* Tabs 자체의 짧은 밑줄(탭 폭만큼)은 숨기고, 바로 아래 필터 영역의
                    border-t(카드 전체 폭)만 남겨서 회색 선이 두 겹으로 보이지 않게 한다. */}
                <div className="px-5 pt-4 [&>[role=tablist]]:border-b-0">
                    <Tabs value={tab} onChange={handleTabChange} items={TAB_ITEMS} />
                </div>
                {/* 연차종류+상태+기간+초기화 버튼을 합친 실제 필요 폭(~800px)이 뷰포트 기준
                    sm(640px)보다 넓어서, sm 이 뜨자마자 고정폭으로 바뀌면 flex-wrap이 줄은
                    바꾸는데 폭은 안 채우는 어중간한 상태가 생긴다 — 실측 폭에 맞춘 커스텀
                    브레이크포인트를 쓴다. 그 미만에서는 연차종류+상태가 한 줄, 기간(+초기화)이
                    또 다른 줄로 묶여 폭을 꽉 채운다. */}
                <div className="flex flex-col gap-4 border-t border-neutral-200 px-5 py-4 min-[820px]:flex-row min-[820px]:flex-wrap min-[820px]:items-end">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-0 flex-1 min-[820px]:w-[150px] min-[820px]:flex-none">
                            <FloatingFilterBox label="연차 종류" active={kind !== 'all'}>
                                <Select
                                    value={kind}
                                    onChange={(v) => {
                                        setKind(v);
                                        setPage(1);
                                    }}
                                    options={KIND_OPTIONS}
                                    renderValue={(o) => (o.value === 'all' ? '' : o.label)}
                                    className={cn(
                                        SELECT_OVERRIDE,
                                        kind !== 'all' && SELECT_OVERRIDE_ACTIVE,
                                    )}
                                />
                            </FloatingFilterBox>
                        </div>
                        <div className="min-w-0 flex-1 min-[820px]:w-[150px] min-[820px]:flex-none">
                            <FloatingFilterBox label="상태" active={status !== 'all'}>
                                <Select
                                    value={status}
                                    onChange={(v) => {
                                        setStatus(v);
                                        setPage(1);
                                    }}
                                    options={STATUS_OPTIONS}
                                    renderValue={(o) => (o.value === 'all' ? '' : o.label)}
                                    className={cn(
                                        SELECT_OVERRIDE,
                                        status !== 'all' && SELECT_OVERRIDE_ACTIVE,
                                    )}
                                />
                            </FloatingFilterBox>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="min-w-0 flex-1 min-[820px]:w-[140px] min-[820px]:flex-none">
                            <FloatingFilterBox label="시작일" active={!!filterStartDate}>
                                <DatePicker
                                    value={filterStartDate}
                                    onChange={(v) => {
                                        setFilterStartDate(v);
                                        setPage(1);
                                    }}
                                    placeholder=""
                                    className={cn(
                                        SELECT_OVERRIDE,
                                        filterStartDate && SELECT_OVERRIDE_ACTIVE,
                                    )}
                                />
                            </FloatingFilterBox>
                        </div>
                        <span className="text-neutral-400">~</span>
                        <div className="min-w-0 flex-1 min-[820px]:w-[140px] min-[820px]:flex-none">
                            <FloatingFilterBox label="종료일" active={!!filterEndDate}>
                                <DatePicker
                                    value={filterEndDate}
                                    onChange={(v) => {
                                        setFilterEndDate(v);
                                        setPage(1);
                                    }}
                                    min={filterStartDate || undefined}
                                    placeholder=""
                                    className={cn(
                                        SELECT_OVERRIDE,
                                        filterEndDate && SELECT_OVERRIDE_ACTIVE,
                                    )}
                                />
                            </FloatingFilterBox>
                        </div>
                    </div>
                    {hasFilter && (
                        <Button
                            variant="ghost"
                            leftIcon={<Icon name="rotateCcw" size={14} />}
                            onClick={clearFilters}
                            className="self-end shrink-0"
                        >
                            필터 초기화
                        </Button>
                    )}
                </div>

                <div className="border-t border-neutral-100">
                    {isLoading ? (
                        <ListSkeleton />
                    ) : requests.length === 0 ? (
                        <EmptyState
                            title="신청 내역이 없습니다"
                            description="조건에 맞는 연차 신청 내역이 없습니다."
                        />
                    ) : (
                        // 실제 <table> 을 써야 헤더와 모든 행이 컬럼 폭을 공유한다 — 행마다 독립된
                        // grid 를 쓰면 "기간" 텍스트 길이가 다를 때 행별로(그리고 헤더와도) 폭이
                        // 제각각 계산돼 정렬이 어긋난다. 모바일처럼 좁은 화면에선 overflow-x-auto 로
                        // 가로 스크롤.
                        <div
                            className={
                                'overflow-x-auto' +
                                (isFetching ? ' opacity-70 transition-opacity' : '')
                            }
                        >
                            {/* table-fixed + 퍼센트 폭 — 폭 미지정 컬럼(기간)이 남는 공간을
                                혼자 다 흡수하면 구분/종류/기간이 왼쪽에, 일수/상태/신청일이
                                오른쪽에 뭉쳐 두 덩어리로 보인다. 6개 컬럼에 비율로 폭을 나눠
                                화면이 넓어질 때 간격이 고르게 늘어나도록 한다. */}
                            <table className="w-full min-w-[680px] table-fixed border-collapse text-[13px]">
                                <thead>
                                    <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold text-neutral-500">
                                        <th className="w-[10%] py-2.5 pr-3 pl-5 text-left">
                                            구분
                                        </th>
                                        <th className="w-[13%] px-3 py-2.5 text-left">종류</th>
                                        <th className="w-[32%] py-2.5 pr-4 pl-3 text-left">기간</th>
                                        <th className="w-[10%] py-2.5 pr-3 pl-4 text-left">
                                            일수
                                        </th>
                                        <th className="w-[15%] px-3 py-2.5 text-left">상태</th>
                                        <th className="w-[20%] py-2.5 pr-5 pl-3 text-left">
                                            신청일
                                        </th>
                                        <th className="w-7 py-2.5 sm:hidden" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r, i) => (
                                        <LeaveRow
                                            key={r.id}
                                            request={r}
                                            isUpcoming={isUpcoming(r)}
                                            isLast={i === requests.length - 1}
                                            onClick={() => setSelectedRequest(r)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {totalElements > 0 && (
                    <div className="flex flex-col items-center gap-1.5 border-t border-neutral-200 p-3.5">
                        <Pagination
                            page={page}
                            total={totalElements}
                            pageSize={PAGE_SIZE}
                            onChange={setPage}
                        />
                    </div>
                )}
            </Card>
            <LeaveApplyModal
                open={isApplyModalOpen}
                onClose={() => setApplyModalOpen(false)}
                onCreated={() => {
                    setTab('all');
                    setStatus('all');
                    setKind('all');
                    setPage(1);
                }}
            />
            <LeaveDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
        </PageLayout>
    );
};

const BalanceStat = ({
    className,
    icon,
    iconClassName,
    label,
    value,
}: {
    className: string;
    icon: IconName;
    iconClassName: string;
    label: string;
    value: string;
}) => (
    <div className={cn('flex min-w-0 flex-col items-center gap-1.5 px-1', className)}>
        <Icon name={icon} size={22} className={iconClassName} />
        <span className="text-xs whitespace-nowrap text-neutral-500">{label}</span>
        <span className="w-full truncate text-center text-base font-bold text-neutral-900">
            {value}
        </span>
    </div>
);

const LeaveRow = ({
    request,
    isUpcoming,
    isLast,
    onClick,
}: {
    request: LeaveRequest;
    isUpcoming: boolean;
    isLast: boolean;
    onClick: () => void;
}) => (
    <tr
        onClick={onClick}
        className={
            'cursor-pointer hover:bg-neutral-50' +
            (isLast ? '' : ' [&>td]:border-b [&>td]:border-neutral-100')
        }
    >
        <td
            className={
                'py-3.5 pr-3 pl-5 ' +
                (isUpcoming ? 'font-medium text-primary-600' : 'text-neutral-400')
            }
        >
            {isUpcoming ? '예정' : '지난'}
        </td>
        <td className="truncate px-3 py-3.5 font-semibold text-neutral-900">{request.kind}</td>
        <td className="truncate py-3.5 pr-4 pl-3 whitespace-nowrap text-neutral-700">
            {formatPeriod(request)}
        </td>
        <td className="py-3.5 pr-3 pl-4 text-neutral-700">{request.days}일</td>
        <td className="px-3 py-3.5">
            <Badge tone={STATUS_TONE[request.status]} dot>
                {request.status}
            </Badge>
        </td>
        <td className="py-3.5 pr-5 pl-3 whitespace-nowrap text-neutral-500">
            {request.appliedAt}
        </td>
        <td className="px-3 py-3.5 align-middle sm:hidden">
            <Icon name="chevronRight" size={14} className="-translate-y-px text-neutral-400" />
        </td>
    </tr>
);

const ListSkeleton = () => (
    <div className="px-5 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 py-4">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-14" />
            </div>
        ))}
    </div>
);
