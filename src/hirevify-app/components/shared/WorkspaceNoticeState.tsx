interface WorkspaceNoticeStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  fullScreen?: boolean;
  className?: string;
}

/** A neutral, actionable boundary for a route whose local context is missing. */
export function WorkspaceNoticeState({
  title,
  description,
  actionLabel,
  onAction,
  fullScreen = true,
  className = '',
}: WorkspaceNoticeStateProps) {
  return (
    <div
      className={`${fullScreen ? 'min-h-screen' : 'min-h-[18rem]'} flex items-center justify-center bg-[#f3f7f4] px-5 py-12 text-[#14231b] ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#d7e3dc] bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dcefe5] text-xl font-semibold text-[#07513b]" aria-hidden="true">
          i
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#617067] sm:text-base">
          {description}
        </p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0b7655] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#085e45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a9470] focus-visible:ring-offset-2"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
