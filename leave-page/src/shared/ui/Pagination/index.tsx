import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Select } from '@/shared/ui/Select';

interface PaginationProps {
    page: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
    /** 지정 시 페이지 크기 선택 드롭다운을 함께 노출(onPageSizeChange 와 짝). */
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
}

export const Pagination = ({
    page,
    total,
    pageSize,
    onChange,
    pageSizeOptions,
    onPageSizeChange,
}: PaginationProps) => {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const windowSize = 5;
    const start = Math.max(1, Math.min(page - Math.floor(windowSize / 2), pages - windowSize + 1));
    const end = Math.min(pages, start + windowSize - 1);
    const items = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const nav = (
        <div className="inline-flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                aria-label="이전 페이지"
            >
                <Icon name="chevronLeft" size={14} />
            </Button>
            {items.map((n) => (
                <Button
                    key={n}
                    variant={n === page ? 'default' : 'ghost'}
                    size="icon-sm"
                    onClick={() => onChange(n)}
                >
                    {n}
                </Button>
            ))}
            <Button
                variant="ghost"
                size="icon-sm"
                disabled={page >= pages}
                onClick={() => onChange(page + 1)}
                aria-label="다음 페이지"
            >
                <Icon name="chevronRight" size={14} />
            </Button>
        </div>
    );

    // 크기 선택 미사용 시 기존 동작(페이지 네비게이션만) 그대로.
    if (!pageSizeOptions || pageSizeOptions.length === 0 || !onPageSizeChange) {
        return nav;
    }

    return (
        <div className="inline-flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                <span className="whitespace-nowrap">페이지당</span>
                <Select
                    size="sm"
                    value={String(pageSize)}
                    onChange={(v) => onPageSizeChange(Number(v))}
                    options={pageSizeOptions.map((n) => ({
                        value: String(n),
                        label: `${n}개`,
                    }))}
                    className="w-[124px]"
                />
            </div>
            {nav}
        </div>
    );
};
