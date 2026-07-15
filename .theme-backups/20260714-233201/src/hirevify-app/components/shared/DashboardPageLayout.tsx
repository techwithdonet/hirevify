import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
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
    <div className={cn('premium-page workspace-page', className)}>
      <header className={cn('premium-header workspace-page-header', headerClassName)}>
        <div className="premium-header-inner">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="premium-btn-ghost"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Button>
            )}
            <div className="min-w-0">
              {eyebrow && <p className="premium-eyebrow">{eyebrow}</p>}
              <h1 className="premium-title">{title}</h1>
              {subtitle && <p className="premium-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </header>
      <main className={cn('premium-content workspace-page-content', shellClassName)}>
        {children}
      </main>
    </div>
  );
}
