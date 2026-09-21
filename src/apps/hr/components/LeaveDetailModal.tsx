import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge, Button, ConfirmModal, Modal, Tooltip, useToast } from '@/shared/ui';
import { useCancelLeaveRequest } from '../api/leave/leave.queries';
import { buildApprovalTimeline, formatPeriod, STATUS_TONE } from '../api/leave/leave.query-logic';
import type { ApprovalStep, LeaveRequest } from '../api/leave/leave.types';

interface LeaveDetailModalProps {
    request: LeaveRequest | null;
    onClose: () => void;
}

const STEP_LABEL: Record<ApprovalStep['kind'], string> = {
    applied: '신청완료',
    approved: '승인',
    pending: '대기중',
    waiting: '대기',
    rejected: '반려',
    canceled: '회수',
};

const STEP_DOT_TONE: Record<ApprovalStep['kind'], string> = {
    applied: 'bg-success-500',
    approved: 'bg-success-500',
    pending: 'bg-warning-500',
    waiting: 'bg-neutral-300',
    rejected: 'bg-danger-500',
    canceled: 'bg-neutral-400',
};

const STEP_TEXT_TONE: Record<ApprovalStep['kind'], string> = {
    applied: 'text-success-700',
    approved: 'text-success-700',
    pending: 'text-warning-700',
    waiting: 'text-neutral-400',
    rejected: 'text-danger-600',
    canceled: 'text-neutral-500',
};

export const LeaveDetailModal = ({ request, onClose }: LeaveDetailModalProps) => {
    const toast = useToast();
    const cancelMut = useCancelLeaveRequest();
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    if (!request) return null;
    const timeline = buildApprovalTimeline(request);
    const isPending = request.status === '진행중';
    // 진행중이어도 승인자 중 한 명이라도 이미 승인했으면(kind === 'approved') 취소 버튼을 막는다.
    const canCancel = isPending && timeline.every((step) => step.kind !== 'approved');

    const handleCancel = async () => {
        setConfirmCancelOpen(false);
        try {
            await cancelMut.mutateAsync(request.id);
            toast.success('신청을 취소했습니다.');
            onClose();
        } catch {
            toast.error('신청 취소에 실패했습니다.');
        }
    };

    return (
        <>
            <Modal open={true} onClose={onClose} title="휴가 상세" width={460}>
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-1.5">
                        <Badge tone={STATUS_TONE[request.status]} dot>
                            {request.status}
                        </Badge>
                        <Badge tone="default">{request.kind}</Badge>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] items-baseline gap-x-4 gap-y-3">
                        <div className="text-[13px] text-neutral-500">휴가 기간</div>
                        <div className="text-sm font-medium text-neutral-900">
                            {formatPeriod(request)}
                        </div>
                        <div className="text-[13px] text-neutral-500">휴가 일수</div>
                        <div className="text-sm font-medium text-neutral-900">{request.days}일</div>
                        <div className="text-[13px] text-neutral-500">신청일자</div>
                        <div className="text-sm font-medium text-neutral-900">{request.appliedAt}</div>
                    </div>
                    <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-5">
                        <div className="text-[13px] text-neutral-500">사유</div>
                        <div className="text-sm leading-relaxed text-neutral-700">{request.reason}</div>
                    </div>
                    <div className="border-t border-neutral-100 pt-5">
                        <div className="mb-4.5 text-[13px] font-semibold text-neutral-900">
                            승인자 이력
                        </div>
                        {/* 결재선이 길어지면(승인자 다수) 모달 전체가 늘어지지 않도록 이 목록만
                            최대 높이를 잡고 세로 스크롤한다. */}
                        <div className="flex max-h-[280px] flex-col overflow-y-auto pr-1">
                            {timeline.map((step, i) => (
                                <div key={`${step.role}-${i}`} className="flex gap-3">
                                    <div className="flex flex-col items-center pt-1.5">
                                        <span
                                            className={`h-2 w-2 shrink-0 rounded-full ${STEP_DOT_TONE[step.kind]}`}
                                        />
                                        {i < timeline.length - 1 && (
                                            <span className="mt-1.5 w-px flex-1 bg-neutral-200" />
                                        )}
                                    </div>
                                    <div className="flex flex-1 items-start justify-between gap-3 pb-5.5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-sm font-semibold text-neutral-900">
                                                    {step.name}
                                                </span>
                                                <span className="text-[13px] text-neutral-500">
                                                    {step.role}
                                                </span>
                                            </div>
                                            <span className="font-mono text-xs text-neutral-400">
                                                {step.at ?? '-'}
                                            </span>
                                        </div>
                                        <span
                                            className={`text-[13px] font-semibold whitespace-nowrap ${STEP_TEXT_TONE[step.kind]}`}
                                        >
                                            {STEP_LABEL[step.kind]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div
                        className={cn(
                            'flex border-t border-neutral-100 pt-4',
                            isPending ? 'justify-between' : 'justify-end',
                        )}
                    >
                        {isPending &&
                            (canCancel ? (
                                <Button
                                    variant="outlineDanger"
                                    onClick={() => setConfirmCancelOpen(true)}
                                    disabled={cancelMut.isPending}
                                >
                                    신청 취소
                                </Button>
                            ) : (
                                <Tooltip content="승인자가 있는 경우 신청 취소가 불가능합니다.">
                                    <Button variant="outline" disabled>
                                        신청 취소
                                    </Button>
                                </Tooltip>
                            ))}
                        <Button variant="outline" disabled>
                            결재문서 바로가기
                        </Button>
                    </div>
                </div>
            </Modal>
            <ConfirmModal
                open={confirmCancelOpen}
                onClose={() => setConfirmCancelOpen(false)}
                onConfirm={handleCancel}
                title="신청 취소"
                description="취소 후에는 되돌릴 수 없습니다."
                message="이 휴가 신청을 취소하시겠습니까?"
                confirmLabel="신청 취소"
                tone="danger"
                confirmLoading={cancelMut.isPending}
            />
        </>
    );
};
