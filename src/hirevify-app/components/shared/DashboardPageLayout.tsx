import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { dashboardTheme } from '../../theme/dashboardTheme';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';

interface DashboardPageLayoutProps {
 title: ReactNode;
 subtitle?: ReactNode;
 eyebrow?: ReactNode;
 actions?: ReactNode;
 children: ReactNode;
 onBack?: () => void;
 backLabel?: string;
 className?: string;
 shellClassName?: string;
 headerClassName?: string;
}

export function DashboardPageLayout({
 title,
 subtitle,
 eyebrow,
 actions,
 children,
 onBack,
 backLabel = 'Back to Dashboard',
 className,
 shellClassName,
 headerClassName,
}: DashboardPageLayoutProps) {
 return (
 <div className={cn(dashboardTheme.page, className)}>
 <header className={cn(dashboardTheme.pageHeader, headerClassName)}>
 <div className={dashboardTheme.pageHeaderInner}>
 <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
 {onBack && (
 <Button variant="ghost" onClick={onBack} className={dashboardTheme.buttonGhost}>
 <ArrowLeft className="mr-2 h-4 w-4" />
 {backLabel}
 </Button>
 )}
 <div className="min-w-0">
 {eyebrow && <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{eyebrow}</p>}
 <h1 className={dashboardTheme.pageTitle}>{title}</h1>
 {subtitle && <p className={dashboardTheme.pageSubtitle}>{subtitle}</p>}
 </div>
 </div>
 {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
 </div>
 </header>
 <main className={cn(dashboardTheme.pageShell, shellClassName)}>
 {children}
 </main>
 </div>
 );
}
