# النشر على Vercel Hobby (مجاني)

التطبيق مُعد للنشر دون أن يمر أي سر عبر المحادثة أو المستودع:
- كلمات المرور **تختارها أنت** في صفحة `/setup` مرة واحدة، وتُحفظ مشفّرة.
- مفتاح الجلسات ومفتاح خط الإنتاج ومفاتيح الإشعارات **تُولّد على الخادم** وتُحفظ في التخزين الخاص.
- المحتوى في **Vercel Blob خاص** (كل قراءة وكتابة تتطلب مصادقة)، لا في المستودع العام.

## الطريقة (أ): من لوحة Vercel — نحو ٥ دقائق
1. ادخل vercel.com بحساب Hobby المجاني. **لا تضف بطاقة دفع.**
2. **Add New → Project → Import** مستودع `wqo969/saudi-beyond-football`.
   - Branch: `claude/jeddah-morning-magazine-0j369r` (أو `main` بعد الدمج)
   - **Root Directory: `jeddah-morning`** · Framework: Next.js (يُكتشف تلقائيًا)
3. قبل Deploy أضف في **Environment Variables**:
   | الاسم | القيمة |
   |---|---|
   | `JM_CONTENT_BACKEND` | `blob` |
   | `JM_SETUP_CODE` | عبارة تختارها أنت (١٢ حرفًا أو أكثر) — تُستخدم مرة واحدة |
   | `CRON_SECRET` | أي نص عشوائي طويل (يحمي نقطة الفحص اليومي) |
4. **Deploy**.
5. بعد النشر: **Storage → Create → Blob** → اختر **Private** → اسم `jeddah-morning-private` → **Connect** بالمشروع (يضيف `BLOB_READ_WRITE_TOKEN` تلقائيًا) → **Redeploy**.
6. افتح `https://<اسم-المشروع>.vercel.app/setup`، أدخل رمز الإعداد، واختر كلمة مرور القارئ وكلمة مرور المحرر.
7. ادخل كمحرر ← **غرفة التحرير ← الأمان ← اعرض المفتاح**، وانسخ مفتاح خط الإنتاج إلى إعدادات بيئة Claude Code (Network secrets، المضيف: نطاق تطبيقك، الرأس: `x-jm-pipeline-key`) ليعمل النشر اليومي.

## الطريقة (ب): آليًا بالسكربت
```bash
cd jeddah-morning
VERCEL_TOKEN=<token> node scripts/deploy-vercel.mjs
```
ينشئ المشروع ومخزن Blob الخاص ويربطهما ويضبط الإعدادات وينشر، ثم يطبع رمز إعداد لمرة واحدة في الطرفية المحلية فقط.

## التحقق بعد النشر
- `https://<app>.vercel.app/` يحوّل إلى `/login` (المحتوى محمي).
- `/api/search-index` و`/api/pdf/...` ترجع 401 دون دخول.
- `X-Robots-Tag: noindex` في الرؤوس.
- Vercel → Settings → Cron Jobs: مهمتان يوميتان (07:35 و22:35 بتوقيت الرياض تقريبًا).

## التكلفة
Hobby مجاني للاستخدام الشخصي غير التجاري؛ عند بلوغ الحدود تتوقف الميزة مؤقتًا ولا تُفوتر. لا تفعّل Pro ولا تضف بطاقة.
