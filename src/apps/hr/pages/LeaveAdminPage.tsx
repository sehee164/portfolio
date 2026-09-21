import { useMemo, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { PageLayout } from '@/shared/layout/PageLayout';
import { Button, Card, EmptyState, Icon, Pagination, Select, Skeleton } from '@/shared/ui';
import { FloatingFilterBox } from '../components/FloatingFilterBox';
import { LeaveAdminDetailModal } from '../components/LeaveAdminDetailModal';
import { BRANCH_OPTIONS, DEPARTMENT_OPTIONS } from '../api/leaveAdmin/leaveAdmin.mock-data';
import { useEmployeeLeaveSummaries } from '../api/leaveAdmin/leaveAdmin.queries';
import type { EmployeeLeaveSummary, LeaveAdminJobType } from '../api/leaveAdmin/leaveAdmin.types';

// Select/DatePicker 자체(디자인 시스템)는 안 건드리고, 이미 있는 `className` prop으로
// 내부 트리거 버튼(직계 자식)의 테두리·배경만 지워서 FloatingFilterBox 하나로 통합된
// 것처럼 보이게 한다 — 실험적 필터 디자인 전용, 이 두 페이지 바깥엔 영향 없음.
const SELECT_OVERRIDE = '[&>button]:border-transparent [&>button]:bg-transparent [&>button]:hover:border-transparent';
const SELECT_OVERRIDE_ACTIVE = '[&>button_svg]:text-primary-500';

const PAGE_SIZE = 11;

// 화면에 보이는 직군 드롭다운과 동일한 순서.
const JOB_TYPE_OPTIONS: { value: LeaveAdminJobType | 'all'; label: string }[] = [
    { value: 'all', label: '전체 직군' },
    { value: '승무직', label: '승무직' },
    { value: '관리직', label: '관리직' },
    { value: '미화직', label: '미화직' },
    { value: '현장직', label: '현장직' },
    { value: '정비직', label: '정비직' },
    { value: '임원직', label: '임원직' },
    { value: '조리직', label: '조리직' },
];

// 승무직/미화직/정비직/조리직 → 영업소 목록, 현장직/임원직 → 부서 목록,
// 관리직·전체 → 부서+영업소를 합친 목록(직원마다 부서 또는 영업소 중 하나에 소속).
const BRANCH_JOB_TYPES: LeaveAdminJobType[] = ['승무직', '미화직', '정비직', '조리직'];

export const LeaveAdminPage = () => {
    const [keyword, setKeyword] = useState('');
    // 클릭(포커스)만 해도 라벨이 뜨도록 — 값이 있을 때뿐 아니라 포커스 중에도 active 취급.
    const [keywordFocused, setKeywordFocused] = useState(false);
    const [jobType, setJobType] = useState<LeaveAdminJobType | 'all'>('all');
    const [affiliation, setAffiliation] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

    const affiliationOptions = useMemo(() => {
        const pool =
            jobType === 'all' || jobType === '관리직'
                ? [...DEPARTMENT_OPTIONS, ...BRANCH_OPTIONS]
                : BRANCH_JOB_TYPES.includes(jobType)
                  ? BRANCH_OPTIONS
                  : DEPARTMENT_OPTIONS;
        return [{ value: 'all', label: '전체' }, ...pool.map((d) => ({ value: d, label: d }))];
    }, [jobType]);

    const {
        data: pageData,
        isLoading,
        isFetching,
    } = useEmployeeLeaveSummaries({
        keyword: keyword.trim() || undefined,
        jobType: jobType === 'all' ? undefined : jobType,
        affiliation: affiliation === 'all' ? undefined : affiliation,
        page,
        size: PAGE_SIZE,
    });

    const rows = pageData?.content ?? [];
    const totalElements = pageData?.totalElements ?? 0;

    const hasFilter = keyword.length > 0 || jobType !== 'all' || affiliation !== 'all';
    const clearFilters = () => {
        setKeyword('');
        setJobType('all');
        setAffiliation('all');
        setPage(1);
    };

    return (
        <PageLayout title="직원 연차 조회" breadcrumbs={['워크', '직원 연차 조회']}>
            <Card padded={false} className="flex flex-col">
                {/* 검색+직군+소속+초기화 버튼을 합친 실제 필요 폭(~680px)이 뷰포트 기준
                    sm(640px)보다 넓어서, sm 대신 실측 폭에 맞춘 커스텀 브레이크포인트를 쓴다.
                    그 미만에서는 검색이 단독 줄, 직군+소속이 한 줄, 초기화 버튼이 또 다른 줄로 묶인다. */}
                <div className="flex flex-col gap-4 px-5 py-4 min-[700px]:flex-row min-[700px]:flex-wrap min-[700px]:items-end">
                    <div className="w-full min-[700px]:w-[180px]">
                        <FloatingFilterBox
                            label="이름/사번 검색"
                            active={keyword.length > 0 || keywordFocused}
                            inactiveLeftClassName="left-8"
                        >
                            <div className="flex h-9 items-center gap-2 px-2.5">
                                <Icon
                                    name="search"
                                    size={14}
                                    className={cn(
                                        'shrink-0',
                                        keyword.length > 0 || keywordFocused
                                            ? 'text-primary-500'
                                            : 'text-neutral-400',
                                    )}
                                />
                                <input
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value);
                                        setPage(1);
                                    }}
                                    onFocus={() => setKeywordFocused(true)}
                                    onBlur={() => setKeywordFocused(false)}
                                    className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 caret-primary-500 outline-none"
                                />
                            </div>
                        </FloatingFilterBox>
                    </div>
                    <div className="flex items-end gap-4">
                        <div className="min-w-0 flex-1 min-[700px]:w-[150px] min-[700px]:flex-none">
                            <FloatingFilterBox label="직군" active={jobType !== 'all'}>
                                <Select
                                    value={jobType}
                                    onChange={(v) => {
                                        setJobType(v);
                                        setAffiliation('all');
                                        setPage(1);
                                    }}
                                    options={JOB_TYPE_OPTIONS}
                                    renderValue={(o) => (o.value === 'all' ? '' : o.label)}
                                    className={cn(
                                        SELECT_OVERRIDE,
                                        jobType !== 'all' && SELECT_OVERRIDE_ACTIVE,
                                    )}
                                />
                            </FloatingFilterBox>
                        </div>
                        <div className="min-w-0 flex-1 min-[700px]:w-[150px] min-[700px]:flex-none">
                            <FloatingFilterBox label="소속" active={affiliation !== 'all'}>
                                <Select
                                    value={affiliation}
                                    onChange={(v) => {
                                        setAffiliation(v);
                                        setPage(1);
                                    }}
                                    options={affiliationOptions}
                                    renderValue={(o) => (o.value === 'all' ? '' : o.label)}
                                    className={cn(
                                        SELECT_OVERRIDE,
                                        affiliation !== 'all' && SELECT_OVERRIDE_ACTIVE,
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
                    ) : rows.length === 0 ? (
                        <EmptyState
                            title="직원이 없습니다"
                            description="조건에 맞는 직원이 없습니다."
                        />
                    ) : (
                        // 실제 <table> 을 써야 헤더와 모든 행이 컬럼 폭을 공유한다 — 행마다 독립된
                        // grid 를 쓰면 이름/소속 길이가 다를 때 행별로(그리고 헤더와도) 폭이 제각각
                        // 계산돼 정렬이 어긋난다. 모바일처럼 좁은 화면에선 overflow-x-auto 로 가로
                        // 스크롤.
                        <div
                            className={
                                'overflow-x-auto' +
                                (isFetching ? ' opacity-70 transition-opacity' : '')
                            }
                        >
                            {/* table-fixed + 퍼센트 폭 — 이름/소속·직급이 폭 고정 없이(min-w만)
                                남는 공간을 나눠 먹으면 사번/직군이 그 사이에 끼고 통계 3컬럼이
                                오른쪽에 몰려 세 덩어리로 보인다. "누구인지"(이름·사번·직군·
                                소속/직급)와 "얼마나 썼는지"(통계 3컬럼) 두 그룹으로만 나누고,
                                그 경계에 세로선 하나로 구분을 명확히 한다. */}
                            <table className="w-full min-w-[760px] table-fixed border-collapse text-[13px]">
                                <thead>
                                    <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold text-neutral-500">
                                        <th className="w-[11%] py-2.5 pr-3 pl-5 text-left">
                                            이름
                                        </th>
                                        <th className="w-[13%] px-3 py-2.5 text-left">사번</th>
                                        <th className="w-[11%] px-3 py-2.5 text-left">직군</th>
                                        <th className="w-[22%] px-3 py-2.5 text-left">
                                            소속/직급
                                        </th>
                                        <th className="w-[15%] border-l border-neutral-200 py-2.5 pr-3 pl-4 text-left">
                                            전체 사용연차
                                        </th>
                                        <th className="w-[15%] px-3 py-2.5 text-left">
                                            이번년도 사용연차
                                        </th>
                                        <th className="w-[13%] py-2.5 pr-5 pl-3 text-left">
                                            진행중
                                        </th>
                                        <th className="w-7 py-2.5 sm:hidden" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <EmployeeRow
                                            key={r.employeeId}
                                            summary={r}
                                            isLast={i === rows.length - 1}
                                            onClick={() => setSelectedEmployeeId(r.employeeId)}
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
            <LeaveAdminDetailModal
                employeeId={selectedEmployeeId}
                onClose={() => setSelectedEmployeeId(null)}
            />
        </PageLayout>
    );
};

const EmployeeRow = ({
    summary,
    isLast,
    onClick,
}: {
    summary: EmployeeLeaveSummary;
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
        <td className="truncate py-3.5 pr-3 pl-5 font-semibold text-neutral-900">
            {summary.name}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 text-neutral-500">{summary.empNo}</td>
        <td className="whitespace-nowrap px-3 py-3.5 text-neutral-700">
            {summary.positionJobType}
        </td>
        <td className="truncate px-3 py-3.5 text-neutral-700">
            {summary.affiliation} · {summary.position}
        </td>
        <td className="border-l border-neutral-100 py-3.5 pr-3 pl-4 text-neutral-700">
            {summary.totalUsedLeaveDays}일
        </td>
        <td className="px-3 py-3.5 font-medium text-primary-600">
            {summary.thisYearUsedLeaveDays}일
        </td>
        <td className="py-3.5 pr-5 pl-3 text-neutral-700">{summary.pendingCount}건</td>
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
