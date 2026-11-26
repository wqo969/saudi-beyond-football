"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArchive, IconHome, IconSearch, IconSettings, IconStar } from "./icons";

const ITEMS = [
  { href: "/", label: "اليوم", Icon: IconHome },
  { href: "/archive", label: "الأعداد", Icon: IconArchive },
  { href: "/search", label: "البحث", Icon: IconSearch },
  { href: "/library", label: "مكتبتي", Icon: IconStar },
  { href: "/settings", label: "المزيد", Icon: IconSettings },
];

const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : href === "/archive" ? ["/archive", "/covers", "/specials", "/issue"].some((p) => pathname.startsWith(p)) : href === "/library" ? ["/library", "/favorites", "/history", "/gifts"].some((p) => pathname.startsWith(p)) : href === "/settings" ? ["/settings", "/profile", "/notifications", "/sections", "/section", "/next"].some((p) => pathname.startsWith(p)) : pathname.startsWith(href);

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="التنقل الرئيسي" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 pt-2 text-[0.68rem] ${active ? "text-gold" : "text-muted"}`}>
                <Icon className="size-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-6 text-sm md:flex">
      {ITEMS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={isActive(href, pathname) ? "page" : undefined} className={isActive(href, pathname) ? "text-gold" : "text-on-forest/80 hover:text-on-forest"}>{label}</Link>
      ))}
    </nav>
  );
}
