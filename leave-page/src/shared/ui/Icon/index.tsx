import { ICONS, type IconName } from './icons';

interface IconProps {
    name: IconName;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

// lucide-react 컴포넌트를 IconName key 로 lookup 해서 렌더.
// 호출부는 <Icon name="..." size={...} /> 형태를 그대로 유지한다.
export const Icon = ({ name, size = 16, strokeWidth = 2, className }: IconProps) => {
    const Component = ICONS[name];
    if (!Component) return null;
    return (
        <Component
            size={size}
            strokeWidth={strokeWidth}
            className={['inline-block shrink-0', className].filter(Boolean).join(' ')}
            aria-hidden
        />
    );
};

export type { IconName };
