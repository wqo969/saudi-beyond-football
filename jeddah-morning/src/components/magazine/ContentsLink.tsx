"use client";

/** Inside the reader, contents entries jump without reloading; elsewhere they are plain links. */
export function ContentsLink({ href, page, className, children }: { href: string; page: number; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      data-no-swipe
      onClick={(e) => {
        if (document.querySelector("[data-reader]")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("jm:goto", { detail: page }));
        }
      }}
    >
      {children}
    </a>
  );
}
