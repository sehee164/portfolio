import { cn } from '@/shared/lib/cn';

// ─────────────────────────────────────────────────────────────
// Skeleton — 콘텐츠 로딩(cold-load) 자리표시용 shimmer 블록.
// 너비/높이/모서리는 consumer가 Tailwind className으로 지정한다.
// ─────────────────────────────────────────────────────────────

interface SkeletonProps {
    className?: string;
    // 아바타 등 원형 자리표시. true 면 rounded-full.
    circle?: boolean;
}

// 기본 atom — 단일 shimmer 블록. 모든 composite 가 이걸로 조립된다.
export const Skeleton = ({ className, circle }: SkeletonProps) => (
    <div
        aria-hidden
        className={cn(
            'animate-pulse bg-neutral-100',
            circle ? 'rounded-full' : 'rounded',
            className,
        )}
    />
);

interface SkeletonTextProps {
    // 렌더할 텍스트 줄 수.
    lines?: number;
    className?: string;
    // 줄 간 간격 클래스 (기본 gap-2).
    gapClassName?: string;
}

// 여러 줄 텍스트 자리표시 — 마지막 줄은 짧게 둬 자연스러운 문단처럼 보인다.
export const SkeletonText = ({ lines = 3, className, gapClassName = 'gap-2' }: SkeletonTextProps) => (
    <div className={cn('flex flex-col', gapClassName, className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')}
            />
        ))}
    </div>
);

interface SkeletonTableProps {
    // 표시할 데이터 행 수.
    rows?: number;
    // 열 수.
    columns?: number;
    // 헤더 행 노출 여부.
    header?: boolean;
    className?: string;
}

// 테이블 자리표시 — 헤더 행 + N개 데이터 행. 실제 표 높이와 어긋나지 않도록 행 높이를 고정.
export const SkeletonTable = ({
    rows = 8,
    columns = 6,
    header = true,
    className,
}: SkeletonTableProps) => (
    <div className={cn('w-full', className)}>
        {header && (
            <div className="flex items-center gap-4 border-b border-neutral-200 px-4 py-3.5">
                {Array.from({ length: columns }).map((_, c) => (
                    <Skeleton key={c} className="h-4 flex-1" />
                ))}
            </div>
        )}
        {Array.from({ length: rows }).map((_, r) => (
            <div
                key={r}
                className="flex h-12 items-center gap-4 border-b border-neutral-100 px-4"
            >
                {Array.from({ length: columns }).map((_, c) => (
                    <Skeleton key={c} className="h-4 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

interface SkeletonCardGridProps {
    // 표시할 카드 수.
    count?: number;
    className?: string;
}

// 카드 그리드 자리표시 — 1/2/3열 반응형(템플릿 피커 등). 카드마다 제목·설명·버튼 행을 흉내낸다.
export const SkeletonCardGrid = ({ count = 12, className }: SkeletonCardGridProps) => (
    <div
        className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className)}
    >
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4"
            >
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-2/3" />
                <SkeletonText lines={2} />
                <Skeleton className="mt-2 h-9 w-full" />
            </div>
        ))}
    </div>
);
