import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';

interface ResponsiveContainerProps {
 children: ReactNode;
 className?: string;
 narrow?: boolean;
}

export function ResponsiveContainer({ children, className, narrow = false }: ResponsiveContainerProps) {
 return (
 <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', narrow? 'max-w-5xl': 'max-w-7xl', className)}>
 {children}
 </div>
 );
}

interface PageHeaderProps {
 title: string;
 description?: string;
 eyebrow?: string;
 icon?: LucideIcon;
 actions?: ReactNode;
 onBack?: () => void;
 className?: string;
}

export function PageHeader({ title, description, eyebrow, icon: Icon, actions, onBack, className }: PageHeaderProps) {
 return (
 <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
 <div className="flex min-w-0 items-start gap-3">
 {onBack && <BackButton onClick={onBack} className="mt-1" />}
 {Icon && (
 <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 sm:flex">
 <Icon className="h-5 w-5" />
 </div>
 )}
 <div className="min-w-0">
 {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-normal text-emerald-700">{eyebrow}</p>}
 <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{title}</h1>
 {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
 </div>
 </div>
 {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
 </div>
 );
}

interface SectionCardProps {
 children: ReactNode;
 className?: string;
}

export function SectionCard({ children, className }: SectionCardProps) {
 return (
 <Card className={cn('border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5', className)}>
 {children}
 </Card>
 );
}

interface StatCardProps {
 label: string;
 value: ReactNode;
 icon: LucideIcon;
 tone?: 'emerald' | 'blue' | 'violet' | 'amber' | 'slate';
 onClick?: () => void;
}

const statToneClasses = {
 emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
 blue: 'bg-blue-50 text-blue-700 ring-blue-100',
 violet: 'bg-violet-50 text-violet-700 ring-violet-100',
 amber: 'bg-amber-50 text-amber-700 ring-amber-100',
 slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function StatCard({ label, value, icon: Icon, tone = 'emerald', onClick }: StatCardProps) {
 const content = (
 <CardContent className="p-5 sm:p-6">
 <div className="flex items-center justify-between gap-4">
 <div className="min-w-0">
 <p className="text-sm font-medium text-slate-600">{label}</p>
 <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{value}</p>
 </div>
 <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1', statToneClasses[tone])}>
 <Icon className="h-5 w-5" />
 </div>
 </div>
 </CardContent>
 );

 if (onClick) {
 return (
 <button
 type="button"
 onClick={onClick}
 className="group w-full rounded-lg text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
 >
 <SectionCard className="h-full transition group-hover:border-emerald-200 group-hover:shadow-md">
 {content}
 </SectionCard>
 </button>
 );
 }

 return <SectionCard className="h-full">{content}</SectionCard>;
}

interface EmptyStateProps {
 icon: LucideIcon;
 title: string;
 description?: string;
 action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
 return (
 <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
 <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
 <Icon className="h-5 w-5" />
 </div>
 <h3 className="text-base font-semibold text-slate-950">{title}</h3>
 {description && <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{description}</p>}
 {action && <div className="mt-5">{action}</div>}
 </div>
 );
}

interface LoadingStateProps {
 label?: string;
 className?: string;
}

export function LoadingState({ label = 'Loading...', className }: LoadingStateProps) {
 return (
 <div className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center', className)}>
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
 <Loader2 className="h-6 w-6 animate-spin" />
 </div>
 <p className="text-sm font-medium text-slate-600">{label}</p>
 </div>
 );
}

interface BackButtonProps {
 onClick: () => void;
 label?: string;
 className?: string;
}

export function BackButton({ onClick, label = 'Back', className }: BackButtonProps) {
 return (
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={onClick}
 aria-label={label}
 className={cn('h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950', className)}
 >
 <ArrowLeft className="h-5 w-5" />
 </Button>
 );
}

interface MobileActionBarProps {
 children: ReactNode;
 className?: string;
}

export function MobileActionBar({ children, className }: MobileActionBarProps) {
 return (
 <div className={cn('fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:hidden', className)}>
 <div className="mx-auto flex max-w-lg gap-2">{children}</div>
 </div>
 );
}

interface DashboardGridProps {
 children: ReactNode;
 className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
 return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>;
}
