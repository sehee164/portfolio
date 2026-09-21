import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FormFieldProps {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    /** 외곽 컨테이너 className 추가 — flex-1 같은 레이아웃 클래스 전달용. */
    className?: string;
    children: ReactNode;
}

export const FormField = ({
    label,
    required,
    hint,
    error,
    className,
    children,
}: FormFieldProps) => (
    <div className={cn('flex flex-col gap-1.5', className)}>
        <label className="text-[13px] font-medium text-neutral-700">
            {label}
            {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
        {children}
        {(hint || error) && (
            <span
                className={`text-[12px] ${error ? 'text-danger-600' : 'text-neutral-500'}`}
            >
                {error || hint}
            </span>
        )}
    </div>
);
