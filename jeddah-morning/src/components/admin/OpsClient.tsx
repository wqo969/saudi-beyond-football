"use client";
import { useState, useTransition } from "react";
import { restoreBackupAction, setAutomationAction } from "@/app/admin/ops-actions";

export function AutomationToggle({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-4 flex items-center gap-3 rounded border border-rule p-4">
      <span className={`size-3 rounded-full ${enabled ? "bg-forest-soft" : "bg-demo"}`} />
      <span className="flex-1 text-sm">{enabled ? "الأتمتة تعمل: الفحص اليومي والإشعارات." : "الأتمتة موقوفة: لا إشعارات آلية؛ النشر اليدوي متاح."}</span>
      <button type="button" disabled={pending} onClick={() => start(() => setAutomationAction(!enabled))} className="rounded-full border border-rule px-4 py-1.5 text-sm" data-testid="automation-toggle">
        {enabled ? "أوقف الأتمتة" : "شغّل الأتمتة"}
      </button>
    </div>
  );
}

export function RestoreBackup() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <label className="mt-4 block text-sm">
      <span className="text-muted">استعادة من ملف نسخة احتياطية:</span>
      <input
        type="file"
        accept="application/json"
        className="mt-1 block"
        disabled={pending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f || !confirm("استعادة الأعداد من الملف؟ الأعداد بنفس المعرّف ستُستبدل (مع حفظ الإصدار السابق).")) return;
          start(async () => {
            const r = await restoreBackupAction(await f.text());
            setMsg(r.ok ? `استُعيد ${r.restored} عددًا` : `أخطاء: ${(r.errors ?? []).join("، ")}`);
          });
        }}
      />
      {msg && <span role="status" className="mt-1 block">{msg}</span>}
    </label>
  );
}
