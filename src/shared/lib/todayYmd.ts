const pad = (n: number): string => String(n).padStart(2, '0');

/** 로컬 타임존 기준 오늘 날짜를 'YYYY-MM-DD' 로 반환. DatePicker `min`(과거 비활성) 등에 사용. */
export const todayYmd = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
