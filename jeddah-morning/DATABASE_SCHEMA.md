# مخطط البيانات

## الآن (P0–P3): ملفات محلية
`content/issues/<slug>.json` يطابق `IssueSchema` (Zod) في `src/lib/schema.ts`. ملفات PDF: `storage/pdfs/` (مرفوعة، مستثناة من git) ثم `content/pdfs/` (التجريبية).

### Issue
| الحقل | النوع | ملاحظات |
|---|---|---|
| slug | `YYYY-MM-DD-(morning|evening|special)[-x]` | مفتاح |
| date, edition, special, number | | `special` إلزامي للأعداد الخاصة |
| title, coverHeadline, coverDek, coverStory, coverSection | | `coverStory` يجب أن يكون مقالًا في العدد |
| persona | معرف شخصية | اختياري؛ افتراضيًا حسب يوم الأسبوع |
| status | 8 حالات | draft → editorial-review → fact-check → design-review → approved → scheduled → published → archived |
| publishAt | ISO بإزاحة | إلزامي للمجدول |
| isDemo | bool | |
| editorsLetter | {title, body[], signature} | |
| surprise | {kind, title, intro, text, questions, results, items} | wallpaper/quiz/challenge/reflection/card/facts |
| closingLine | نص | |
| design | {coverLayout?, palette?, seed?, lockOrder, frozen?} | `frozen` لقطة الخطة عند الاعتماد/النشر |
| pdf | {file, pages?} | |
| corrections | [{at, text}] | |
| articles | Article[] | |

### Article
`id, section, kind (news/analysis/opinion/feature/service/template), kicker, title, dek, author, readingMinutes, isDemo, layout?, followUp, sources[{name,url,publishedAt}], memory[{kind,key}], body[Block]`

### Block (11 نوعًا)
`p, h, quote{cite}, list, facts{title,items[label,value]}, stats{items[value,label,note]}, timeline{items[when,text]}, qa{items[q,a]}, gallery{items[caption,seed]}, puzzle{question,hint,answer,explanation}, link{label,url}`

### قيود يفرضها المخطط
- مصدر إلزامي للمواد الحقيقية في الأقسام الحية، وللمقابلات.
- معرفات مقالات فريدة، وslug يطابق التاريخ والنوع، ومنع تجاوز المسارات في أسماء PDF.

## الإنتاج: Vercel Blob خاص (D-018)
| المسار | المحتوى |
|---|---|
| `index/issues.json` | فهرس الأعداد `{slug, updatedAt}` |
| `issues/<slug>.json` | العدد الحالي (يطابق `IssueSchema`) |
| `history/<slug>/<ts>.json` | كل إصدار سابق + نسخة الحذف (`deleted-…`) — سجل الإصدارات والاستعادة |
| `pdfs/<slug>.pdf` | نسخة PDF |
| `media/<name>` | الصور التحريرية المرخصة |
| `kv/auth.json` | تجزئات كلمات المرور + إصدار الجلسة |
| `kv/secrets.json` | سر الجلسات، مفتاح خط الإنتاج، مفاتيح VAPID (مولّدة على الخادم) |
| `kv/push-subscriptions.json`، `kv/notified.json` | اشتراكات الأجهزة وسجل منع الإشعار المكرر |
| `kv/ops-YYYY-MM.json` | سجل العمليات والأخطاء |
| `kv/sources.json`، `kv/automation.json`، `kv/login-attempts.json` | المصادر الموثوقة، مفتاح الأتمتة، القفل (عناوين IP مجزأة فقط) |

المخزن **خاص**: كل قراءة وكتابة تتطلب `BLOB_READ_WRITE_TOKEN` الذي يحقنه Vercel في الخادم فقط. لا رابط عام لأي ملف؛ الصور وPDF تُخدم عبر مسارات تتحقق من الجلسة.

## مرجع مستقبلي: Supabase Postgres (غير مستخدم — D-018)
`supabase/migrations/0001_init.sql` (مكتوب، **غير مطبّق**):

| الجدول | الغرض |
|---|---|
| `jm_members` | ربط مستخدم Supabase Auth بدور reader/admin |
| `jm_issues` | الأعداد (الحقول المركبة jsonb) |
| `jm_articles` | المقالات مع الترتيب والكتل jsonb |
| `jm_memory` | فهرس الذاكرة التحريرية |
| `jm_publish_log` | سجل محاولات النشر؛ فهرس فريد على النجاح يمنع النشر المزدوج |
| `jm_audit_log` | سجل العمليات (بلا بيانات حساسة) |
| `jm_favorites` | مزامنة المفضلة (اختيارية) |
| `jm_push_subscriptions` | اشتراكات Web Push |
| Storage `jm-pdfs` | دلو خاص، روابط موقّعة قصيرة العمر |

**RLS** على كل الجداول: المجهول لا يرى شيئًا؛ القارئ يرى المرئي فقط (`jm_is_visible`)؛ المحرر يقرأ ويكتب الكل؛ البيانات الشخصية لصاحبها فقط.

## البيانات الشخصية على الجهاز (localStorage، بادئة `jm:`)
المفضلة، المجموعات، السجل، التقييمات، الملف الشخصي والاهتمامات، تفضيلات القراءة، مواضع القراءة، المفاجآت (تقدم التحديات، ملاحظات التأمل)، آخر زيارة للإشعارات. تُصدَّر وتُحذف من `/profile`.
