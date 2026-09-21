import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    /** 포탈 대상 컨테이너. 기본값은 document.body. */
    container?: Element | null;
    /** 명명된 마운트 포인트가 필요한 경우 — id 로 지정한 요소를 찾아 사용 (없으면 자동 생성). */
    containerId?: string;
    children: ReactNode;
}

const getOrCreateContainer = (id: string): HTMLElement => {
    const existing = document.getElementById(id);
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
};

/**
 * 공통 Portal 래퍼 — React.createPortal 의 얇은 추상화.
 * 사용처: Tooltip, Modal, Popover, Dropdown 등 overflow/transform 이 있는 조상으로부터 자유로워야 하는 UI 요소.
 *
 * 부모가 `overflow: hidden` 이거나 `transform` 을 가진 경우, 일반 absolute/fixed 포지셔닝이 잘리거나
 * containing block 이 의도와 달라지는데, Portal 로 document.body 직속으로 렌더링하면 이 문제가 해소된다.
 */
export const Portal = ({ container, containerId, children }: PortalProps) => {
    const [target, setTarget] = useState<Element | null>(() => container ?? null);

    // 컨테이너 결정은 DOM 을 직접 만지는 작업(getOrCreateContainer 가 엘리먼트를 생성)이라
    // 렌더 중으로 끌어올릴 수 없다 — effect 안에서 setState 하는 것이 이 경우 옳은 형태다.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (container) {
            setTarget(container);
            return;
        }
        if (typeof document === 'undefined') return;
        if (containerId) {
            setTarget(getOrCreateContainer(containerId));
            return;
        }
        setTarget(document.body);
    }, [container, containerId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!target) return null;
    return createPortal(children, target);
};
