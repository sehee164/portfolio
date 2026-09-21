import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padded?: boolean;
    hover?: boolean;
}

export const Card = ({ padded = true, hover, className, children, ...rest }: CardProps) => (
    <div
        className={cn(
            'bg-neutral-0 rounded-lg border border-neutral-200 shadow-xs',
            padded && 'p-6',
            hover && 'transition-shadow hover:shadow-sm',
            className,
        )}
        {...rest}
    >
        {children}
    </div>
);
