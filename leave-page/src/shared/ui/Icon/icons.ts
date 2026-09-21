// lucide-react 컴포넌트 매핑 테이블.
// 이 포트폴리오 프로젝트에서 실제로 쓰이는 아이콘만 남겨 트리밍한 버전.
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Flag,
    Inbox,
    Loader,
    Moon,
    Plus,
    RotateCcw,
    Search,
    Sun,
    TriangleAlert,
    Info,
    X,
} from 'lucide-react';

export const ICONS = {
    // Layout / Nav
    search: Search, // 돋보기 — 검색
    inbox: Inbox, // 받은함 — 빈 목록 기본 아이콘
    calendar: Calendar, // 달력 — 날짜 선택
    calendarCheck: CalendarCheck, // 체크 표시된 달력 — 연차(종일 사용)
    calendarClock: CalendarClock, // 시계 표시된 달력 — 반차(부분 시간 사용)

    // Actions
    plus: Plus, // 더하기 — 추가
    check: Check, // 체크 표시 — 확인/성공
    x: X, // X — 닫기/취소
    rotateCcw: RotateCcw, // 반시계 회전 화살표 — 필터 초기화
    loader: Loader, // 원형 로딩 — 진행 중

    // Direction
    chevronDown: ChevronDown, // 아래 꺾쇠 — 드롭다운 펼침
    chevronLeft: ChevronLeft, // 왼쪽 꺾쇠 — 이전
    chevronRight: ChevronRight, // 오른쪽 꺾쇠 — 다음/이동

    // Misc
    flag: Flag, // 깃발 — 다음 휴가
    warn: TriangleAlert, // 삼각형 안의 ! — 경고/위험
    info: Info, // 원 안의 i — 안내
    sun: Sun, // 해 — 라이트 모드
    moon: Moon, // 달 — 다크 모드
} as const;

export type IconName = keyof typeof ICONS;
