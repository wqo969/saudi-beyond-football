"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-8 space-y-3 text-start">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1 block text-sm text-on-forest/80">كلمة المرور</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-gold/50 bg-black/20 px-4 py-3 text-lg text-on-forest outline-none focus:border-gold"
          dir="ltr"
        />
      </label>
      {state.error && <p role="alert" className="text-sm text-[#f0b48a]">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-gold py-3 font-semibold text-forest-deep hover:bg-gold-soft disabled:opacity-60">
        {pending ? "جارٍ الدخول…" : "ادخل"}
      </button>
    </form>
  );
}
