import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/ui';
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

function App() {
    const [tab, setTab] = useState<TabKey>('leave');

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
