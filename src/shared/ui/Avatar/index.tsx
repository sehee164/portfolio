import { cn } from '@/shared/lib/cn';
import { Spinner } from '@/shared/ui/Spinner';

interface AvatarProps {
    name?: string;
    size?: number;
    src?: string;
    /**
     * 이미지를 받아오는 중인지. true 이고 아직 src 가 없으면 이니셜 대신 다운로드 중임을 알리는
     * 스피너를 보여준다 — "이니셜 → 실제 이미지" 로 바뀌며 깜박이는 현상을 막고 로딩 상태를 명시.
     * 이니셜은 사진이 정말 없거나(에러 포함) loading 이 false 일 때만 노출. 기본 false(기존 동작 유지).
     */
    loading?: boolean;
    className?: string;
}

// 디자인 핸드오프 기준: 첫 글자(성씨) + 중립 회색 배경. 컬러 해시 팔레트 사용 안 함.
const initial = (name?: string): string => {
    if (!name) return '?';
    const trimmed = name.trim();
    return trimmed.length === 0 ? '?' : trimmed[0];
};

export const Avatar = ({ name, size = 28, src, loading = false, className }: AvatarProps) => {
    // 로딩 중(아직 src 없음): 이니셜 대신 다운로드 중임을 알리는 스피너 — 이니셜이 실제
    // 이미지로 교체되며 깜박이는 것을 방지. src 도착/사진없음/에러 시에만 내용을 채운다.
    const showSpinner = !src && loading;
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center font-bold shrink-0 overflow-hidden rounded-full bg-neutral-100 text-neutral-600',
                className,
            )}
            style={{
                width: size,
                height: size,
                fontSize: Math.max(10, Math.round(size * 0.4)),
                background: src ? 'transparent' : undefined,
            }}
            aria-label={name}
        >
            {src ? (
                <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : showSpinner ? (
                <Spinner size={Math.max(12, Math.round(size * 0.4))} />
            ) : (
                initial(name)
            )}
        </span>
    );
};
