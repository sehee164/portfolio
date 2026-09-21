import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FloatingFilterBoxProps {
    label: string;
    /** true면 실제 값이 선택된 상태 — 라벨이 위 테두리로 올라가고 파란 포인트가 들어간다. */
    active: boolean;
    className?: string;
    /** 비활성(가운데) 상태일 때 라벨의 가로 위치 클래스. 왼쪽에 아이콘이 있는 필드(검색 등)는
     * 라벨이 아이콘과 겹치지 않게 여기에 'left-8' 같은 값을 넘긴다. 기본 'left-2.5'. */
    inactiveLeftClassName?: string;
    children: ReactNode;
}

/**
 * 연차관리 / 직원 연차 조회 페이지 전용 실험적 필터 박스.
 * 디자인 시스템의 Select/DatePicker 는 그대로 두고, 그 컴포넌트들이 이미 제공하는
 * `className` prop(내부 트리거 버튼의 부모 div에 적용됨)으로 버튼 테두리/배경만
 * `[&>button]:...` 오버라이드해서 이 박스 하나로 통합된 것처럼 보이게 한다.
 */
export const FloatingFilterBox = ({
    label,
    active,
    className,
    inactiveLeftClassName = 'left-2.5',
    children,
}: FloatingFilterBoxProps) => (
    <div
        className={cn(
            'relative rounded-md border bg-neutral-0 transition-colors duration-200',
            active
                ? 'border-primary-500 hover:border-primary-600'
                : 'border-neutral-200 hover:border-neutral-300',
            className,
        )}
    >
        <span
            className={cn(
                'pointer-events-none absolute z-10 bg-[inherit] px-1 transition-all duration-200 ease-out',
                active
                    ? 'top-0 left-2.5 -translate-y-1/2 text-[11px] font-medium text-primary-600'
                    : cn('top-1/2 -translate-y-1/2 text-sm text-neutral-500', inactiveLeftClassName),
            )}
        >
            {label}
        </span>
        {children}
    </div>
);
