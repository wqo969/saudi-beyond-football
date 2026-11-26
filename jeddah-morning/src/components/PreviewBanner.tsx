import { STATUS_LABELS, type Issue } from "@/lib/schema";

export function PreviewBanner({ issue }: { issue: Issue }) {
  return (
    <div role="note" className="bg-[#7a3b12] px-4 py-1.5 text-center text-xs font-semibold text-white">
      معاينة المحرر — حالة العدد: {STATUS_LABELS[issue.status]}. لا يراه القراء بعد.
    </div>
  );
}
