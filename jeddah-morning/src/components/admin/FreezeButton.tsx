"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { freezeDesignAction } from "@/app/admin/actions";

export function FreezeButton({ slug, frozen }: { slug: string; frozen: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await freezeDesignAction(slug, !frozen); router.refresh(); })} className="rounded-full border border-rule px-3 py-1 text-xs disabled:opacity-50" title="التجميد يثبت الإخراج الحالي فلا يتغير لاحقًا">
      {frozen ? "إلغاء تجميد التصميم" : "تجميد التصميم"}
    </button>
  );
}
