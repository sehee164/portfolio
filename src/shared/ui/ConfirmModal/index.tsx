import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Callout, type CalloutTone } from '@/shared/ui/Callout';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    /** 헤더 제목 — 명사형 동작 라벨 (예: "댓글 삭제") */
    title: ReactNode;
    /** 제목 아래 부제 — 동작의 결과/주의 (예: "복구할 수 없습니다") */
    description?: ReactNode;
    /** 본문 — 사용자에게 묻는 질문 문장 (예: "댓글을 삭제하시겠습니까?") */
    message?: ReactNode;
    /**
     * 본문 아래 강조 콜아웃 — 꼭 짚어야 할 핵심 정보/주의를 색·아이콘으로 띄운다.
     * 생략 가능. 일상적·저위험 확인엔 넣지 말 것(과한 장식은 오히려 마찰).
     */
    highlight?: ReactNode;
    /** highlight 콜아웃 톤. 생략 시 tone='danger' 면 danger, 아니면 info. */
    highlightTone?: CalloutTone;
    /** 확인 버튼 라벨 (기본: 확인) */
    confirmLabel?: string;
    /** 취소 버튼 라벨 (기본: 취소) */
    cancelLabel?: string;
    /** 파괴적 동작(삭제 등)이면 'danger' — 확인 버튼이 빨간색 */
    tone?: 'default' | 'danger';
    /**
     * 확인 동작이 진행 중(API 요청 등)임을 표시. true 면 확인 버튼이 로딩+비활성,
     * 취소/배경/ESC 닫기도 막아 이중 실행을 방지한다.
     */
    confirmLoading?: boolean;
    width?: number;
    /** 다른 모달(예: SettingsModal z-[1300]) 위에 스택할 때 명시. 기본 50. */
    zIndex?: number;
}

// 공용 확인 모달 — 삭제처럼 되돌릴 수 없는 동작 직전에 사용자 확인을 받는다.
// 본문(body)은 질문(message) + 선택적 강조 콜아웃(highlight)의 2단 구조.
export const ConfirmModal = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    message,
    highlight,
    highlightTone,
    confirmLabel = '확인',
    cancelLabel = '취소',
    tone = 'default',
    confirmLoading = false,
    width = 420,
    zIndex,
}: ConfirmModalProps) => (
    <Modal
        open={open}
        // 진행 중에는 배경/ESC 로 닫히지 않도록 막는다(요청 중 이탈 방지).
        onClose={confirmLoading ? () => {} : onClose}
        title={title}
        description={description}
        width={width}
        zIndex={zIndex}
        footer={
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} disabled={confirmLoading}>
                    {cancelLabel}
                </Button>
                <Button
                    variant={tone === 'danger' ? 'destructive' : 'default'}
                    onClick={onConfirm}
                    loading={confirmLoading}
                    disabled={confirmLoading}
                >
                    {confirmLabel}
                </Button>
            </div>
        }
    >
        {(message || highlight) && (
            <div className="flex flex-col gap-3">
                {message && (
                    <p className="text-[15px] font-semibold leading-relaxed text-neutral-900">
                        {message}
                    </p>
                )}
                {highlight && (
                    <Callout tone={highlightTone ?? (tone === 'danger' ? 'danger' : 'info')}>
                        {highlight}
                    </Callout>
                )}
            </div>
        )}
    </Modal>
);
