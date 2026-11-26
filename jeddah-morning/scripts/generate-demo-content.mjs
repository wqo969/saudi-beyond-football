// Generates clearly-labelled DEMO issues in content/issues/.
// Rules: every issue and article has isDemo: true; live-data sections contain templates and
// placeholders ("—") only — no invented news, scores, prices or weather readings.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "content", "issues");
mkdirSync(outDir, { recursive: true });

const AUTHOR = "هيئة التحرير (نموذج)";
const p = (text) => ({ type: "p", text });
const h = (text) => ({ type: "h", text });

const templateNote = (what) =>
  p(`هذه صفحة نموذجية توضح شكل ${what} في المجلة. لا تحتوي على بيانات حقيقية؛ وعند تفعيل مصادر المحتوى ستُملأ من مصادر موثوقة مع ذكر المصدر ووقت التحديث أسفل كل مادة.`);

const A = {
  weather: (n) => ({
    id: `weather-${n}`, section: "weather", kicker: "نموذج نشرة", title: "هكذا ستبدو نشرة طقس جدة كل صباح",
    dek: "درجات الحرارة وحال البحر والرطوبة في بطاقة واحدة هادئة — القيم أدناه فارغة عمدًا.", author: AUTHOR, readingMinutes: 1,
    body: [
      templateNote("نشرة الطقس"),
      { type: "facts", title: "جدة اليوم (قيم تجريبية فارغة)", items: [
        { label: "العظمى", value: "— °م" }, { label: "الصغرى", value: "— °م" }, { label: "الرطوبة", value: "— ٪" },
        { label: "الرياح", value: "— كم/س" }, { label: "حال البحر", value: "—" }, { label: "الشروق", value: "—" },
      ] },
      p("المصدر المقترح للمرحلة القادمة خدمة طقس مفتوحة ومجانية لا تتطلب مفتاحًا، مع إظهار وقت آخر تحديث بوضوح."),
    ],
  }),
  news: (n) => ({
    id: `news-${n}`, section: "news", kicker: "نموذج خبر رئيسي", title: "هنا يظهر عنوان الخبر الأهم في الصباح",
    dek: "مساحة لملخص من سطرين يجيب عن: ماذا حدث، ولماذا يهمك؟", author: AUTHOR, readingMinutes: 2,
    body: [
      templateNote("الخبر الرئيسي"),
      h("كيف ستُحرَّر الأخبار"),
      { type: "list", items: ["كل خبر مرتبط بمصدره الأصلي ورابطه.", "لا تُنشر أرقام أو تصريحات دون مصدر.", "تمييز واضح بين الخبر والرأي.", "مراجعة بشرية قبل النشر."] },
      p("يتسع هذا القالب لفقرتين أو ثلاث، ثم سطر «لماذا يهمك» الذي يربط الخبر بحياة القارئ اليومية."),
    ],
  }),
  football: (n) => ({
    id: `football-${n}`, section: "football", kicker: "نموذج بطاقة مباراة", title: "بطاقة المباراة كما ستظهر في العدد",
    dek: "النتيجة والهدافون وأبرز اللحظات في مساحة واحدة — الفرق والأرقام هنا رموز فقط.", author: AUTHOR, readingMinutes: 2,
    body: [
      templateNote("تغطية كرة القدم"),
      { type: "facts", title: "مباراة نموذجية", items: [
        { label: "المضيف", value: "الفريق (أ)" }, { label: "الضيف", value: "الفريق (ب)" }, { label: "النتيجة", value: "— : —" },
        { label: "الملعب", value: "—" }, { label: "الهدافون", value: "—" }, { label: "رجل المباراة", value: "—" },
      ] },
      p("يتبع البطاقة تحليل قصير بلغة صحفية، ثم جدول الترتيب عند توفر مصدر بيانات مجاني ومسموح الاستخدام."),
    ],
  }),
  fashion: (n) => ({
    id: `fashion-${n}`, section: "fashion", kicker: "مقال تجريبي", title: "الأناقة في مدينة البحر: خفة القماش وهدوء اللون",
    dek: "مقال رأي تجريبي عن مبادئ عامة في اللباس، دون علامات تجارية أو صيحات مزعومة.", author: AUTHOR, readingMinutes: 3,
    body: [
      p("في مدينة ساحلية رطبة تصبح الأناقة مسألة توازن بين الراحة والحضور. القماش الذي يتنفس، والقصّة التي لا تضيق، واللون الذي لا يصرخ."),
      p("الألوان الترابية والعاجية والزيتية تمنح المظهر هدوءًا يناسب الضوء القوي، بينما تضيف لمسة معدنية صغيرة — ساعة أو خاتم — ما يكفي من البريق."),
      { type: "quote", text: "الأناقة الحقيقية هي ما تنساه وأنت ترتديه.", cite: "مقولة متداولة" },
      h("ثلاث قواعد بسيطة"),
      { type: "list", items: ["قطعة أساسية جيدة أفضل من خمس عابرة.", "المقاس الصحيح يسبق الماركة.", "لون واحد هادئ يجمع الإطلالة."] },
    ],
  }),
  queer: (n) => ({
    id: `queer-culture-${n}`, section: "queer-culture", kicker: "عن هذا القسم", title: "ثقافة الكوير: مساحة للفن والقراءة والذاكرة",
    dek: "نص تعريفي تجريبي بطبيعة القسم وما سيقدمه.", author: AUTHOR, readingMinutes: 2,
    body: [
      p("يخصص هذا القسم لقراءات في الأدب والسينما والفنون والتاريخ الثقافي، بنبرة هادئة ومحترمة، ومن مصادر موثقة."),
      p("سيضم القسم مراجعات كتب وأفلام، وتعريفًا بأعمال فنية، ومقالات تحليلية — كلها تُراجع قبل النشر وتُرفق بمصادرها."),
      p("هذا نص تجريبي لعرض شكل القسم فقط."),
    ],
  }),
  ai: (n) => ({
    id: `ai-${n}`, section: "ai", kicker: "نموذج متابعة", title: "قالب «ما الجديد في الذكاء الاصطناعي»",
    dek: "مكان لثلاث أفكار أو أدوات تستحق الانتباه — دون إعلانات أو أخبار مخترعة.", author: AUTHOR, readingMinutes: 2,
    body: [
      templateNote("متابعة الذكاء الاصطناعي"),
      h("بنية المادة"),
      { type: "list", items: ["خبر أو إصدار مع رابط مصدره الرسمي.", "شرح مبسط: ما الذي تغيّر؟", "تجربة عملية مقترحة لمدة خمس دقائق."] },
    ],
  }),
  careers: (n) => ({
    id: `careers-${n}`, section: "careers", kicker: "نموذج فرص", title: "قائمة الفرص المهنية كما ستظهر",
    dek: "وظائف ومنح ودورات مجانية — تُعرض فقط مع رابط الجهة المعلنة.", author: AUTHOR, readingMinutes: 1,
    body: [
      templateNote("الفرص المهنية"),
      { type: "facts", title: "فرصة نموذجية", items: [{ label: "المسمى", value: "—" }, { label: "الجهة", value: "—" }, { label: "المدينة", value: "جدة" }, { label: "آخر موعد", value: "—" }] },
      p("كل فرصة تُرفق برابط إعلانها الأصلي، ولا تُعاد صياغة شروطها دون التحقق منها."),
    ],
  }),
  economy: (n) => ({
    id: `saudi-economy-${n}`, section: "saudi-economy", kicker: "نموذج مؤشرات", title: "لوحة الاقتصاد السعودي في صفحة واحدة",
    dek: "المؤشرات الرئيسية بقيم فارغة عمدًا حتى يُربط مصدر بيانات موثوق ومجاني.", author: AUTHOR, readingMinutes: 2,
    body: [
      templateNote("صفحة الاقتصاد"),
      { type: "facts", title: "مؤشرات (قيم تجريبية فارغة)", items: [
        { label: "مؤشر السوق الرئيسي", value: "—" }, { label: "التغير اليومي", value: "— ٪" }, { label: "سعر خام برنت", value: "— $" },
        { label: "سعر الصرف", value: "—" }, { label: "التضخم (آخر قراءة)", value: "— ٪" }, { label: "آخر تحديث", value: "—" },
      ] },
      p("بعد المؤشرات تأتي قراءة تحريرية قصيرة تشرح الصورة دون مبالغة أو توصيات استثمارية."),
    ],
  }),
  growth: (n) => ({
    id: `personal-growth-${n}`, section: "personal-growth", kicker: "مقال تجريبي", title: "صباح بطيء: كيف تبدأ يومك دون أن يبدأك الهاتف",
    dek: "مقال تأملي تجريبي عن عادة صغيرة تغيّر نبرة اليوم كله.", author: AUTHOR, readingMinutes: 4,
    body: [
      p("أول ما نفعله كل صباح يحدد إيقاع ما يليه. حين يكون الهاتف أول ما نلمسه، نبدأ اليوم ونحن نجيب عن أسئلة الآخرين قبل أن نسأل أنفسنا ماذا نريد."),
      p("الفكرة بسيطة: اجعل الدقائق العشر الأولى لك وحدك. كوب ماء، نافذة مفتوحة، وسطر واحد في دفتر تكتب فيه ما الذي سيجعل هذا اليوم جيدًا."),
      h("تجربة لأسبوع واحد"),
      { type: "list", items: ["اترك الهاتف خارج غرفة النوم.", "ابدأ بضوء النهار قبل ضوء الشاشة.", "اكتب ثلاث كلمات تصف يومك المأمول.", "افتح المجلة بعد ذلك، لا قبله."] },
      { type: "quote", text: "العادات الصغيرة لا تبدو مهمة حتى تتراكم.", cite: "هيئة التحرير" },
      p("لا تحتاج إلى روتين مثالي. تحتاج فقط إلى بداية تختارها أنت."),
    ],
  }),
  song: (n) => ({
    id: `song-${n}`, section: "song", kicker: "نموذج", title: "أغنية اليوم: مساحة للحن يرافق صباحك",
    dek: "هنا تظهر الأغنية المختارة مع سطرين عن سبب اختيارها ورابط استماع رسمي.", author: AUTHOR, readingMinutes: 1,
    body: [
      p("نموذج: لم تُختر أغنية حقيقية في هذا العدد التجريبي. في الأعداد الفعلية يظهر هنا اسم الأغنية والفنان وسنة الإصدار، ورابط إلى منصة استماع رسمية."),
      { type: "facts", items: [{ label: "الأغنية", value: "—" }, { label: "الفنان", value: "—" }, { label: "المزاج", value: "هادئ" }] },
    ],
  }),
  screen: (n) => ({
    id: `screen-${n}`, section: "screen", kicker: "نموذج توصية", title: "ماذا نشاهد الليلة؟ قالب التوصية",
    dek: "فيلم أو مسلسل واحد، ولماذا يستحق وقتك — دون حرق للأحداث.", author: AUTHOR, readingMinutes: 2,
    body: [
      templateNote("توصية المشاهدة"),
      { type: "facts", items: [{ label: "العمل", value: "—" }, { label: "النوع", value: "—" }, { label: "المدة", value: "—" }, { label: "أين يُعرض", value: "—" }] },
      p("تتبع البطاقة فقرة نقدية قصيرة: ما الذي يميز العمل، ولمن يناسب، وما الذي قد لا يعجبك فيه."),
    ],
  }),
  discovery: (n) => ({
    id: `discovery-${n}`, section: "discovery", kicker: "مقال تجريبي", title: "اكتشاف اليوم: متعة المشي بلا وجهة",
    dek: "فكرة صغيرة تستحق التجربة هذا الأسبوع.", author: AUTHOR, readingMinutes: 2,
    body: [
      p("ليس كل مشي رياضة، وليس كل خروج مهمة. أحيانًا يكون أجمل ما نفعله أن نمشي بلا هدف واضح، نترك الشوارع تقترح علينا طريقها."),
      p("جرّب هذا الأسبوع نزهة قصيرة في حي لا تعرفه جيدًا، والتقط صورة واحدة فقط لشيء لم تلحظه من قبل: باب قديم، نافذة خشبية، ظل نخلة على جدار."),
      p("نص تجريبي لعرض شكل قسم «اكتشاف اليوم»."),
    ],
  }),
  puzzle: (n, variant = 0) => {
    const puzzles = [
      { q: "شيء كلما أخذت منه كبر. ما هو؟", hint: "تجده في الأرض.", a: "الحفرة" },
      { q: "له أسنان ولا يعض. ما هو؟", hint: "تستخدمه كل صباح أمام المرآة.", a: "المشط" },
      { q: "ما الشيء الذي يسير بلا قدمين ويبكي بلا عينين؟", hint: "تراه في السماء.", a: "السحاب" },
    ];
    const z = puzzles[variant % puzzles.length];
    return {
      id: `puzzle-${n}`, section: "puzzle", kicker: "لغز", title: "لغز اليوم", dek: "دقيقة واحدة لتنشيط الذهن.", author: AUTHOR, readingMinutes: 1,
      body: [p("فكّر قبل أن تكشف الحل."), { type: "puzzle", question: z.q, hint: z.hint, answer: z.a }],
    };
  },
};

const demo = (articles) => articles.map((a) => ({ ...a, isDemo: true, sources: [] }));

const issues = [
  {
    slug: "2026-11-25-morning", date: "2026-11-25", edition: "morning", number: 1, title: "العدد الأول — صباح الأربعاء (تجريبي)",
    coverHeadline: "صباح بطيء في مدينة البحر", coverDek: "عدد تجريبي يعرض شكل المجلة: مقالات قصيرة، وأقسام ثابتة، ولغز في الختام.",
    coverSection: "personal-growth", status: "published", isDemo: true,
    articles: demo([A.growth(1), A.weather(1), A.news(1), A.discovery(1), A.puzzle(1, 1)]),
  },
  {
    slug: "2026-11-25-evening", date: "2026-11-25", edition: "evening", number: 2, title: "عدد الأربعاء المسائي (تجريبي)",
    coverHeadline: "ماذا نشاهد الليلة؟", coverDek: "عدد مسائي تجريبي أخف: توصية مشاهدة، وأغنية، وقراءة هادئة.",
    coverSection: "screen", status: "published", isDemo: true,
    articles: demo([A.screen(2), A.song(2), A.fashion(2), A.puzzle(2, 2)]),
  },
  {
    slug: "2026-11-26-morning", date: "2026-11-26", edition: "morning", number: 3, title: "عدد الخميس الصباحي (تجريبي)",
    coverHeadline: "الأناقة في مدينة البحر", coverDek: "عدد تجريبي كامل بالأقسام الثلاثة عشر — القوالب الإخبارية فارغة عمدًا حتى تُربط بمصادر حقيقية.",
    coverSection: "fashion", status: "published", isDemo: true, pdf: { file: "demo-2026-11-26-morning.pdf" },
    articles: demo([
      A.fashion(3), A.weather(3), A.news(3), A.football(3), A.queer(3), A.ai(3), A.careers(3),
      A.economy(3), A.growth(3), A.song(3), A.screen(3), A.discovery(3), A.puzzle(3, 0),
    ]),
  },
  {
    slug: "2026-11-26-evening", date: "2026-11-26", edition: "evening", number: 4, title: "عدد الخميس المسائي (تجريبي — مجدول)",
    coverHeadline: "مساء الخميس: قراءة على مهل", coverDek: "عدد تجريبي مجدول يظهر تلقائيًا عند السادسة مساءً بتوقيت الرياض.",
    coverSection: "discovery", status: "scheduled", publishAt: "2026-11-26T18:00:00+03:00", isDemo: true,
    articles: demo([A.discovery(4), A.screen(4), A.song(4), A.puzzle(4, 1)]),
  },
  {
    slug: "2026-11-27-morning", date: "2026-11-27", edition: "morning", number: 5, title: "مسودة الجمعة (تجريبي)",
    coverHeadline: "مسودة لا تظهر للقراء", coverDek: "عدد تجريبي بحالة مسودة لاختبار لوحة التحرير.",
    coverSection: "personal-growth", status: "draft", isDemo: true,
    articles: demo([A.growth(5)]),
  },
];

for (const issue of issues) {
  writeFileSync(path.join(outDir, `${issue.slug}.json`), JSON.stringify(issue, null, 2) + "\n");
}
console.log(`[demo] wrote ${issues.length} demo issues to content/issues/`);
