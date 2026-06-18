import type { ReactNode } from 'react';

export function ModernFormShell({
 children,
 aside,
}: {
 children: ReactNode;
 aside?: ReactNode;
}) {
 return (
 <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
 <div className="space-y-5">{children}</div>
 {aside && <aside className="space-y-4">{aside}</aside>}
 </div>
 );
}

export function ModernFormSection({
 eyebrow,
 title,
 description,
 children,
}: {
 eyebrow?: string;
 title: string;
 description?: string;
 children: ReactNode;
}) {
 return (
 <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
 <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
 {eyebrow && <p className="text-xs font-semibold uppercase text-emerald-700">{eyebrow}</p>}
 <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
 {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
 </div>
 <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">{children}</div>
 </section>
 );
}

export function ModernField({
 label,
 hint,
 children,
 className = '',
}: {
 label: string;
 hint?: string;
 children: ReactNode;
 className?: string;
}) {
 return (
 <div className={`space-y-2 ${className}`}>
 <div>
 <label className="text-sm font-semibold text-slate-900">{label}</label>
 {hint && <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p>}
 </div>
 {children}
 </div>
 );
}

export function FormSuggestionCard({
 title,
 items,
}: {
 title: string;
 items: string[];
}) {
 return (
 <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
 <h4 className="font-semibold text-slate-950">{title}</h4>
 <ul className="mt-3 space-y-2 text-sm text-slate-700">
 {items.map((item) => (
 <li key={item} className="rounded-md bg-white/80 px-3 py-2">
 {item}
 </li>
 ))}
 </ul>
 </div>
 );
}
