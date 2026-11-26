# CLAUDE.md — دليل استكمال العمل بين الجلسات

> اقرأ هذا الملف أولًا في كل جلسة جديدة، ثم PROGRESS.md وDECISIONS.md.

## المشروع في سطرين
«صباح جدة — JEDDAH MORNING»: مجلة رقمية شخصية عربية (PWA) بعدد صباحي ومسائي (JEDDAH AFTER DARK) وأعداد خاصة. قلبها **محرك تحريري ديناميكي** يجعل كل عدد مختلفًا بصريًا وتحريريًا عن السابق.

## قواعد غير قابلة للتفاوض
1. **تكلفة صفر** — راجع COST_POLICY.md قبل إضافة أي خدمة. لا API مدفوع، لا فوترة، لا بطاقة.
2. **العزل** — كل العمل داخل `jeddah-morning/`. لا تلمس ملفات المستودع الأخرى (`index.html`، `media/`… تخص مشروعًا آخر)، ولا مشاريع Supabase القائمة (`ajlan-engineer-portal-v1-dev`، `shein-ai-shopper-staging`)، ولا أتمتة ChatGPT.
3. **الصدق التحريري** — لا أخبار/أسعار/نتائج/مقابلات مخترعة. المحتوى التجريبي `isDemo: true` دائمًا. راجع EDITORIAL_POLICY.md.
4. **لا نشر خارجي** (Vercel، Supabase، تفعيل CI، دفع إلى GitHub عند الرفض) دون موافقة صريحة من المالك.
5. **الوظيفة لا تُعد مكتملة** إن كانت واجهة بلا عمل حقيقي. ميّز: مكتمل / تجريبي / غير مربوط.

## الأوامر
```bash
cd jeddah-morning
npm install
npm run dev                 # http://localhost:3000  (demo-reader / demo-admin في التطوير)
npm run check               # typecheck + lint + unit + build
npm run build && npm run test:e2e
npm run content:demo        # إعادة توليد الأعداد السبعة التجريبية
```

## الخريطة الذهنية للكود
| المسار | المسؤولية |
|---|---|
| `src/lib/schema.ts` | مخطط Zod: العدد، المقال، الكتل، المفاجأة، التصميم، الحالات الثماني |
| `src/lib/sections.ts` | 20 قسمًا (13 أساسية صباحية + المسائية والمميزة)، علم `live` يفرض المصادر |
| `src/lib/personas.ts` | الشخصيات الأسبوعية السبع، هويات الأعداد الخاصة وAfter Dark |
| `src/lib/engine/layouts.ts` | مكتبة القوالب (27) وقواعد الملاءمة `fit` |
| `src/lib/engine/planner.ts` | المخطِّط: الترتيب، الغلاف، اللوحة، القوالب، منع التكرار، تقرير الجِدّة |
| `src/lib/engine/palettes.ts` | 15 لوحة ثانوية + تكييف الوضع الليلي + فحص التباين |
| `src/lib/engine/memory.ts` | الذاكرة التحريرية وكشف التكرار |
| `src/components/magazine/*` | مُصيّرات الصفحات (أغلفة، مقالات، فهرس، افتتاحية، مفاجأة، خاتمة) |
| `src/components/FlipReader.tsx` | قارئ المجلة |
| `src/lib/content/*` | مستودع المحتوى (محلي الآن، Supabase لاحقًا) + `getAllPlans` |
| `src/proxy.ts` | بوابة الدخول |
| `scripts/generate-demo-content.mjs` | مصدر الأعداد التجريبية |

## كيف تضيف قالبًا جديدًا
1. أضف تعريفًا في `LAYOUTS` (`layouts.ts`) مع دالة `fit` صارمة (0 = ممنوع لهذا المحتوى).
2. أضف المُصيّر في `components/magazine/articles.tsx` وسجّله في `MagazinePage.tsx`.
3. `npm test` — اختبار المكتبة يفشل إن نسيت المُصيّر.

## الإنتاج
- التخزين: Vercel Blob **خاص** (`JM_CONTENT_BACKEND=blob`). محليًا لاختبار نفس المسار: `blob-fs`.
- لا تضع محتوى حقيقيًا أو أسرارًا في المستودع (عام).
- النشر: DEPLOY.md. خط الإنتاج اليومي: AUTOMATION.md و`ops/daily-issue-prompt.md`.

## الحالة
انظر PROGRESS.md. P0–P10 منفذة؛ P11 متوقف على رمز Vercel.
