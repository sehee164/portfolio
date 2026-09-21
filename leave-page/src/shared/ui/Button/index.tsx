import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/Icon';

type Variant =
    | 'default'
    | 'secondary'
    | 'outline'
    | 'outlinePrimary'
    | 'outlineDanger'
    | 'ghost'
    | 'destructive'
    | 'coral'
    | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-xs';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const SIZE_CLASS: Record<Size, string> = {
    xs: 'h-6 px-2 text-xs gap-1 rounded-sm',
    sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-sm',
    md: 'h-9 px-4 text-sm gap-1.5 rounded-md',
    lg: 'h-10 px-6 text-sm gap-2 rounded-md',
    icon: 'h-9 w-9 rounded-md',
    'icon-sm': 'h-8 w-8 rounded-sm',
    'icon-xs': 'h-6 w-6 rounded-sm',
};

const VARIANT_CLASS: Record<Variant, string> = {
    default:
        'bg-primary-500 text-white border border-primary-500 hover:bg-primary-600 hover:border-primary-600 active:bg-primary-700',
    secondary:
        'bg-neutral-100 text-neutral-900 border border-transparent hover:bg-neutral-200',
    outline:
        'bg-neutral-0 text-neutral-900 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
    // 강조 outline — 채움 없이 보더+텍스트로만 색을 준다(솔리드보다 덜 쨍하게).
    outlinePrimary:
        'bg-neutral-0 text-primary-700 border border-primary-300 hover:bg-primary-50 hover:border-primary-400',
    // danger 팔레트는 50/100/500/600/700 만 정의 → 300/400 은 생성 안 됨. 정의된 shade 사용.
    outlineDanger:
        'bg-neutral-0 text-danger-600 border border-danger-500 hover:bg-danger-50 hover:border-danger-600',
    ghost:
        'bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-100 hover:text-neutral-900',
    destructive: 'bg-danger-500 text-white border border-danger-500 hover:bg-danger-600',
    coral: 'bg-coral-500 text-white border border-coral-500 hover:bg-coral-600',
    link: 'bg-transparent text-primary-600 border border-transparent hover:underline underline-offset-2 px-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'default',
            size = 'md',
            loading = false,
            leftIcon,
            rightIcon,
            disabled,
            className,
            children,
            ...rest
        },
        ref,
    ) => (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                SIZE_CLASS[size],
                VARIANT_CLASS[variant],
                className,
            )}
            {...rest}
        >
            {loading ? <Icon name="loader" size={14} className="animate-spin" /> : leftIcon}
            {children}
            {!loading && rightIcon}
        </button>
    ),
);
Button.displayName = 'Button';
