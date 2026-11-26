"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArchive, IconHome, IconSearch, IconSettings, IconStar } from "./icons";

const ITEMS = [
  { href: "/", label: "الرئيسية", Icon: IconHome },
  { href: "/archive", label: "الأرشيف", Icon: IconArchive },
  { href: "/search", label: "البحث", Icon: IconSearch },
  { href: "/favorites", label: "المفضلة", Icon: IconStar },
  { href: "/settings", label: "الإعدادات", Icon: IconSettings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="التنقل الرئيسي" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 pt-2 text-[0.68rem] ${active ? "text-forest-soft dark:text-gold" : "text-muted"}`}>
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
      {ITEMS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "text-gold" : "text-on-forest/80 hover:text-on-forest"}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
