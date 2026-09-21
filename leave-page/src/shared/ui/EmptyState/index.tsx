import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/shared/ui/Icon';

interface EmptyStateProps {
    icon?: IconName;
    title: string;
    description?: string;
    action?: ReactNode;
}

export const EmptyState = ({ icon = 'inbox', title, description, action }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <Icon name={icon} size={24} />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">{title}</h3>
        {description && <p className="text-sm text-neutral-500 mb-4 max-w-sm">{description}</p>}
        {action && <div>{action}</div>}
    </div>
);
