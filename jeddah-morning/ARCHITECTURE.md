# المعمارية — صباح جدة

## نظرة عامة
```
         ┌──────────── المتصفح / PWA (آيفون، أندرويد، تابلت، كمبيوتر) ───────────┐
         │ FlipReader · MagazinePage · Art · المكتبة والتخصيص (localStorage) · SW │
         └───────────────▲───────────────────────────────────────▲──────────────┘
                         │ HTML/RSC                               │ كاش دون إنترنت
┌────────────────────────┴───────────────────────────────────────┴───────────────┐
│ Next.js 16 (App Router)                                                          │
│  proxy.ts ─► بوابة الجلسة والأدوار                                               │
│  app/(site) · app/(immersive) · app/admin · app/api                              │
│  lib/content ─► ContentRepository (local الآن | supabase لاحقًا)                 │
│  lib/engine  ─► planner · layouts · palettes · memory · random                  │
│  lib/schema (Zod) · personas · sections · publishing · personalization           │
└────────────────────────┬─────────────────────────────────────────────────────────┘
                         │
      content/issues/*.json · content/pdfs · storage/pdfs      (P5: Supabase Postgres + Storage)
```

## مبدأ «مصدر واحد، ثلاث نسخ»
العدد ملف منظم واحد. المحرك يولد خطة (`IssuePlan`)، ومنها:
1. **النسخة التفاعلية** (القارئ) — كل صفحة تُصيَّر بقالبها.
2. **النسخة المختصرة** (`/brief`) — سطر لكل مادة بترتيب الخطة.
3. **المقال المستقل** — يُصيَّر بنفس القالب المخطط.
4. **PDF** — يُقرأ ويُستورد الآن؛ الإنتاج الآلي من نفس الخطة في P7.

## التقنيات
Next.js 16.4 · TypeScript · Tailwind CSS 4 · Zod 4 · pdfjs-dist 6 · Fontsource · Vitest · Playwright · axe-core. كلها مفتوحة المصدر ومجانية. لا SDK لخدمات مدفوعة.

## المسارات
| المسار | الوظيفة |
|---|---|
| `/` | غلاف اليوم، التبديل، الافتتاحية، في هذا العدد، مختارات لك، أعداد سابقة |
| `/issue/[slug]` | الغلاف + الفهرس التفاعلي + الإجراءات |
| `/issue/[slug]/read` | القارئ |
| `/issue/[slug]/a/[id]` | المقال بقالبه |
| `/issue/[slug]/brief`، `/surprise`، `/rate`، `/pdf` | المختصرة، المفاجأة، التقييم، PDF |
| `/archive`، `/covers`، `/specials`، `/sections`، `/section/[key]` | الأرشيف والأغلفة والأعداد الخاصة والأقسام |
| `/search`، `/library`، `/favorites`، `/history`، `/gifts` | البحث والمكتبة الشخصية |
| `/notifications`، `/settings`، `/profile`، `/next` | الإشعارات والإعدادات والملف والتشويق |
| `/admin`، `/admin/issues/new`، `/admin/issues/[slug]`، `/admin/import` | غرفة التحرير |
| `/api/pdf/[slug]`، `/api/search-index`، `/api/admin/upload-pdf`، `/api/push/subscribe`، `/api/cron/publish` | الواجهات البرمجية |

## الوثائق المرتبطة
EDITORIAL_ENGINE.md (المحرك) · DESIGN_SYSTEM.md · DATABASE_SCHEMA.md · SECURITY.md · AUTOMATION.md · CONTENT_MEMORY.md · TEST_PLAN.md · DECISIONS.md · ROADMAP.md.
