import type { Metadata } from "next";
import { NotificationsClient } from "@/components/library/NotificationsClient";
import { PushToggle } from "@/components/PushToggle";
import { listVisibleIssues } from "@/lib/content";
import { pushStatus } from "@/lib/notifications";

export const metadata: Metadata = { title: "الإشعارات" };

export default async function NotificationsPage() {
  const issues = (await listVisibleIssues()).slice(0, 20).map((i) => ({ slug: i.slug, title: i.title, at: i.publishAt ?? `${i.date}T07:30:00+03:00`, edition: i.edition, surprise: !!i.surprise }));
  const push = pushStatus();
  return (
    <div className="px-4 pt-6 md:max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الإشعارات</h1>
      {push.enabled ? <PushToggle /> : (
        <p className="mt-2 rounded border border-rule bg-paper-2 p-3 text-xs leading-6 text-muted">إشعارات الجهاز غير مفعّلة على هذا الخادم؛ تظهر هنا إشعارات داخل التطبيق.</p>
      )}
      <NotificationsClient issues={issues} />
    </div>
  );
}
