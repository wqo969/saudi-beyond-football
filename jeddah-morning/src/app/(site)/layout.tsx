import { BottomNav } from "@/components/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <SiteHeader isAdmin={session?.role === "admin"} />
      <main className="mx-auto min-h-[70dvh] max-w-6xl pb-28 md:pb-16">{children}</main>
      <footer className="mx-auto hidden max-w-6xl border-t border-rule px-4 py-6 text-center text-xs text-muted md:block">
        صباح جدة · JEDDAH MORNING — مجلة شخصية خاصة
      </footer>
      <BottomNav />
    </>
  );
}
