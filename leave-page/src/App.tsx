import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Icon, ToastProvider } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { LeavePage } from '@/apps/hr/pages/LeavePage';
import { LeaveAdminPage } from '@/apps/hr/pages/LeaveAdminPage';

// 이 파일은 포트폴리오용 최소 껍데기(chrome)일 뿐, 실제 원본 회사 앱의 라우팅/사이드바를
// 대신하지 않는다 — 두 탭으로 페이지를 전환하는 정도로 충분하다.
// 실제 디자인 결과물은 LeavePage / LeaveAdminPage 두 페이지다.
const queryClient = new QueryClient();

type TabKey = 'leave' | 'leaveAdmin';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'leave', label: '연차관리' },
    { key: 'leaveAdmin', label: '직원 연차 조회' },
];

// 다크 모드 토글 — 원본 앱의 useThemeStore/ThemeToggle을 그대로 옮기는 대신,
// 이 포트폴리오 껍데기에서만 쓸 최소 버전(localStorage 저장 + <html>.dark 토글)으로 구현.
const useDarkMode = () => {
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    return [isDark, setIsDark] as const;
};

function App() {
    const [tab, setTab] = useState<TabKey>('leave');
    const [isDark, setIsDark] = useDarkMode();

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <div className="flex h-full min-h-screen flex-col bg-neutral-50">
                    <header className="flex items-center gap-1 border-b border-neutral-200 bg-neutral-0 px-4 py-2.5 sm:px-8">
                        <span className="mr-4 text-sm font-bold text-neutral-900">
                            연차관리 UI 포트폴리오
                        </span>
                        <nav className="flex items-center gap-1">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                                        tab === t.key
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            type="button"
                            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
                            onClick={() => setIsDark((v) => !v)}
                            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
                        </button>
                    </header>
                    <main className="min-h-0 flex-1">
                        {tab === 'leave' ? <LeavePage /> : <LeaveAdminPage />}
                    </main>
                </div>
            </ToastProvider>
        </QueryClientProvider>
    );
}

export default App;
