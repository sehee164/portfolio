import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/shared/lib/cn';

interface SpinnerProps {
    size?: number;
    className?: string;
}

export const Spinner = ({ size = 16, className }: SpinnerProps) => (
    <Icon name="loader" size={size} className={cn('animate-spin text-primary-500', className)} />
);
