// className 결합 유틸 — Tailwind class를 조건부로 합치는 보조 함수.
export type ClassValue = string | number | false | null | undefined;

export const cn = (...classes: ClassValue[]): string =>
    classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ');
