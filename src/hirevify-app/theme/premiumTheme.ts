/**
 * HireVify Premium Theme System
 * 
 * A unified design system for all non-home pages.
 * Provides consistent colors, spacing, typography, and component styles
 * across the entire recruiter and candidate dashboard experience.
 */

export const premiumTheme = {
  // === Color Palette ===
  colors: {
    // Primary - Sophisticated deep blue with teal undertones
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    
    // Accent - Rich emerald green
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    
    // Neutral - Slate gray scale
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    
    // Success - Emerald
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Warning - Amber
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error - Rose
    error: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
    
    // Info - Sky blue
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
    },
  },

  // === Typography ===
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
    },
  },

  // === Spacing (8pt grid) ===
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },

  // === Border Radius ===
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // === Shadows ===
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // === Animation ===
  transitions: {
    fast: '150ms ease',
    DEFAULT: '200ms ease',
    slow: '300ms ease',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// === Component Classes ===
// These classes define the premium SaaS look for reusable components

export const premiumClasses = {
  // === Page Layout ===
  page: {
    container: 'min-h-screen bg-slate-50/50',
    header: 'sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-sm',
    content: 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8',
  },
  
  // === Cards ===
  card: {
    base: 'rounded-2xl border border-slate-200/80 bg-white shadow-sm',
    elevated: 'rounded-2xl border border-slate-200/80 bg-white shadow-md',
    interactive: 'rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md',
    flat: 'rounded-xl border border-slate-100 bg-white',
  },
  
  // === Buttons ===
  button: {
    primary: 'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    secondary: 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    ghost: 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    accent: 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    danger: 'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    icon: 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
    iconGhost: 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
  },
  
  // === Form Elements ===
  input: {
    base: 'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
    error: 'border-red-300 focus:border-red-400 focus:ring-red-100',
  },
  
  select: {
    base: 'flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-200/50 focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50',
  },
  
  textarea: {
    base: 'flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  },
  
  label: {
    base: 'text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  },
  
  // === Navigation ===
  nav: {
    sidebar: 'flex h-full flex-col border-r border-slate-200/80 bg-white',
    sidebarItem: 'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900',
    sidebarItemActive: 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white',
    tab: 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900',
    tabActive: 'bg-slate-900 text-white',
  },
  
  // === Tables ===
  table: {
    container: 'w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm',
    header: 'bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500',
    row: 'border-t border-slate-100 text-sm text-slate-700 transition-colors hover:bg-slate-50/50',
    cell: 'px-5 py-4',
  },
  
  // === Badges ===
  badge: {
    base: 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
    default: 'border-slate-200 bg-slate-100 text-slate-700',
    primary: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  
  // === Status ===
  status: {
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    screening: 'bg-amber-50 text-amber-700 border-amber-200',
    interview: 'bg-purple-50 text-purple-700 border-purple-200',
    offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    hired: 'bg-green-50 text-green-700 border-green-200',
  },
  
  // === States ===
  empty: {
    container: 'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center',
    icon: 'mx-auto h-12 w-12 text-slate-300',
    title: 'mt-4 text-lg font-semibold text-slate-900',
    description: 'mt-2 text-sm text-slate-500',
    action: 'mt-6',
  },
  
  loading: {
    container: 'flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8',
    spinner: 'h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600',
    skeleton: 'animate-pulse rounded-lg bg-slate-100',
  },
  
  error: {
    container: 'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700',
    icon: 'h-5 w-5 shrink-0',
  },
  
  // === Page Headers ===
  pageHeader: {
    container: 'mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm',
    eyebrow: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
    title: 'text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl',
    subtitle: 'mt-2 text-sm leading-relaxed text-slate-600',
    actions: 'flex flex-wrap items-center gap-3',
  },
  
  // === Stat Cards ===
  statCard: {
    container: 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md',
    label: 'text-sm font-medium text-slate-500',
    value: 'mt-2 text-3xl font-bold tracking-tight text-slate-900',
    trend: 'mt-1 text-xs font-medium',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-600',
  },
  
  // === Action Cards ===
  actionCard: {
    container: 'group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md',
    icon: 'mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white',
    title: 'text-base font-semibold text-slate-900',
    description: 'mt-1 text-sm text-slate-500',
    arrow: 'absolute right-4 top-4 h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-600',
  },
  
  // === Sidebar/Panel ===
  panel: {
    container: 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm',
    header: 'mb-4 flex items-center justify-between border-b border-slate-100 pb-4',
    title: 'text-base font-semibold text-slate-900',
  },
  
  // === Modal ===
  modal: {
    overlay: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
    container: 'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-xl',
    header: 'border-b border-slate-100 px-6 py-4',
    title: 'text-lg font-semibold text-slate-900',
    body: 'px-6 py-4',
    footer: 'border-t border-slate-100 px-6 py-4',
  },
  
  // === Tooltip ===
  tooltip: {
    container: 'z-50 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg',
  },
  
  // === Progress ===
  progress: {
    track: 'h-2 overflow-hidden rounded-full bg-slate-100',
    fill: 'h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500',
  },
  
  // === Avatar ===
  avatar: {
    container: 'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-600',
    image: 'h-full w-full object-cover',
    placeholder: 'flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500',
  },
  
  // === Divider ===
  divider: {
    base: 'border-t border-slate-200',
    withText: 'relative flex items-center gap-4 before:flex-1 before:border-t before:border-slate-200 after:flex-1 after:border-t after:border-slate-200',
  },
};

export type PremiumTheme = typeof premiumTheme;
export type PremiumClasses = typeof premiumClasses;
