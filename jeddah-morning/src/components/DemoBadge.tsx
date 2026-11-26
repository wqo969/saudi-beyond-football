export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-demo/50 bg-demo/10 px-2 py-0.5 font-[family-name:var(--font-ui)] text-[0.68rem] font-semibold text-demo ${className}`}
      title="هذا محتوى تجريبي لعرض التصميم — ليس خبرًا أو بيانات حقيقية"
    >
      ● تجريبي
    </span>
  );
}

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div role="note" className={`border-y border-demo/40 bg-demo/10 text-demo ${compact ? "px-4 py-1.5 text-xs" : "px-4 py-2 text-sm"} text-center font-semibold`}>
      محتوى تجريبي لعرض التصميم فقط — لا يحتوي على أخبار أو بيانات حقيقية
    </div>
  );
}
