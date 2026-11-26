import type { IssuePlan } from "@/lib/engine/planner";
import type { Issue } from "@/lib/schema";
import { MagazinePage } from "./MagazinePage";

/** A planned cover rendered at phone proportions; `scale` shrinks it for archives. */
export function CoverFrame({ issue, plan, scale = 1, className = "" }: { issue: Issue; plan: IssuePlan; scale?: number; className?: string }) {
  const W = 390;
  const H = 700;
  if (scale === 1)
    return (
      <div className={`jm-p-${plan.palette.id} overflow-hidden ${className}`} style={{ minHeight: "min(78dvh, 760px)" }}>
        <div className="flex min-h-[inherit] flex-col [&>article]:flex-1">
          <MagazinePage issue={issue} plan={plan} page={plan.pages[0]} pageNo={0} />
        </div>
      </div>
    );
  return (
    <div className={`relative overflow-hidden shadow-lg ${className}`} style={{ width: W * scale, height: H * scale }} aria-hidden="true">
      <div className={`jm-p-${plan.palette.id} pointer-events-none absolute right-0 top-0 flex origin-top-right flex-col [&>article]:flex-1`} style={{ width: W, height: H, transform: `scale(${scale})` }} inert>
        <MagazinePage issue={issue} plan={plan} page={plan.pages[0]} pageNo={0} />
      </div>
    </div>
  );
}
