/**
 * HireVify Dashboard Theme
 *
 * Aligned with the premium design system in src/styles/globals.css
 * (.premium-* CSS classes). This file exports class strings used by
 * components that consume dashboardTheme — they now match the premium
 * visual system exactly.
 */

export const dashboardTheme = {
  page: 'premium-page',
  pageShell: 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8',
  pageHeader:
    'mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm',
  pageHeaderInner:
    'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  pageTitle: 'text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl',
  pageSubtitle: 'mt-2 text-sm leading-relaxed text-slate-600',
  section: 'space-y-6',
  card: 'rounded-2xl border border-slate-200/80 bg-white shadow-sm',
  cardHeader: 'border-b border-slate-100 px-5 py-4',
  cardTitle: 'text-base font-semibold text-slate-950',
  cardDescription: 'mt-1 text-sm text-slate-500',
  cardContent: 'p-5',
  panel: 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm',
  toolbar:
    'flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
  tabBar:
    'inline-flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm',
  tab: 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950',
  activeTab: 'bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white',
  buttonPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50',
  buttonSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50',
  buttonGhost:
    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50',
  input:
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
  textarea:
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
  select:
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
  badge: 'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700',
  iconButton:
    'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950',
  emptyState:
    'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center',
  loadingState:
    'flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8',
  errorState:
    'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700',
  listItem:
    'rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm',
  table: 'w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm',
  tableHeader:
    'bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500',
  tableRow:
    'border-t border-slate-100 text-sm text-slate-700 transition-colors hover:bg-slate-50/50',
  modal:
    'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white shadow-xl',
  modalHeader: 'border-b border-slate-100 px-5 py-4',
  modalBody: 'px-5 py-4',
  modalFooter: 'border-t border-slate-100 px-5 py-4',
  mobileStack: 'flex flex-col gap-3 sm:flex-row sm:items-center',
};

export type DashboardTheme = typeof dashboardTheme;
