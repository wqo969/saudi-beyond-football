import Link from "next/link";
import { DesktopNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="pt-safe sticky top-0 z-40 bg-forest text-on-forest shadow-[0_1px_0_0_var(--gold)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-3" aria-label="صباح جدة — الرئيسية">
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold leading-none">صباح جدة</span>
          <span className="latin-caps hidden text-gold sm:inline">Jeddah Morning</span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link href="/admin" className="rounded-full border border-gold/60 px-3 py-1 text-xs text-gold hover:bg-gold/10">
              التحرير
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
