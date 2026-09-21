import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface PageLayoutProps {
    title: ReactNode;
    description?: ReactNode;
    breadcrumbs?: string[];
    actions?: ReactNode;
    children: ReactNode;
    maxWidth?: number | 'full';
    className?: string;
    /**
     * viewport 높이 채우기 정책.
     * - 'always' (기본): 모든 브레이크포인트에서 `min-h-full` — 조직도 처럼
     *   자식이 `flex-1 min-h-0` 으로 가용 공간을 차지해야 하는 풀-스크린 페이지.
     * - 'lg-up': lg+ 에서만 채움. 작성 폼처럼 모바일은 자연 흐름이 자연스러운 경우.
     * - 'never': 어떤 브레이크포인트에서도 채우지 않음. 리스트 페이지처럼 콘텐츠
     *   길이에 따라 페이지가 자연스럽게 늘어나 main 의 scroll 로 처리되어야 할 때.
     */
    fillHeight?: 'always' | 'lg-up' | 'never';
}

// 청사진 9.1 — 모든 페이지 공통 컨테이너.
// flex-col + min-h-full 로 자식이 `flex-1 min-h-0` 만 붙이면 남은 높이를 차지할 수 있다.
// (예: 조직도 캔버스). 자연 흐름 콘텐츠는 그대로 위에서 아래로 쌓이고, 넘치면 main 의 overflow-y-auto 가 처리.
// 하단 패딩은 wrapper 의 padding 이 아닌 spacer 로 처리: 콘텐츠 overflow 시에도 main 의 scroll 끝에
// 동일한 여백이 보장된다 (wrapper padding 은 overflow 영역 밖에 위치해 스크롤 끝에서 사라지기 때문).
export const PageLayout = ({
    title,
    description,
    breadcrumbs,
    actions,
    children,
    maxWidth = 1280,
    className,
    fillHeight = 'always',
}: PageLayoutProps) => (
    <div
        className={cn(
            'px-3 pt-3 sm:px-8 sm:pt-6 flex flex-col',
            fillHeight === 'always' && 'min-h-full',
            fillHeight === 'lg-up' && 'lg:min-h-full',
            // 'never' → height 클래스 없음. 자연 흐름.
            className,
        )}
    >
        <div
            className="mx-auto w-full flex flex-col flex-1 min-h-0"
            style={{ maxWidth: maxWidth === 'full' ? '100%' : maxWidth }}
        >
            <div className="mb-3 sm:mb-6 flex items-end justify-between gap-3 sm:gap-4 flex-wrap">
                <div className="min-w-0">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="hidden sm:block mb-1 text-[12px] text-neutral-500">
                            {breadcrumbs.map((b, i) => (
                                <span key={b}>
                                    {b}
                                    {i < breadcrumbs.length - 1 && (
                                        <span className="mx-1.5 text-neutral-300">/</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                    <h1 className="text-lg sm:text-xl font-bold text-neutral-900 truncate">{title}</h1>
                    {description && (
                        <p className="hidden sm:block mt-1 text-sm text-neutral-500">{description}</p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
            {children}
            <div aria-hidden className="shrink-0 h-3 sm:h-6" />
        </div>
    </div>
);
