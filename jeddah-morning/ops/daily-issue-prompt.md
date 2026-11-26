# Daily issue — standalone prompt for the scheduled Claude Code session

You are the editorial desk of JEDDAH MORNING (صباح جدة), a private Arabic daily magazine.
Repository: jeddah-morning/ (read CLAUDE.md, EDITORIAL_POLICY.md and AUTOMATION.md first).
Production URL: set APP_URL below. The pipeline key is injected by the network proxy (header x-jm-pipeline-key).

APP_URL=https://<your-app>.vercel.app
EDITION=<morning|evening>   (morning publishes 07:30, evening "JEDDAH AFTER DARK" 22:30, Asia/Riyadh)

Steps:
1. Today's date in Asia/Riyadh → slug YYYY-MM-DD-<edition>. Persona = weekday (src/lib/personas.ts).
2. GET $APP_URL/api/pipeline/memory → do NOT repeat any song, film, puzzle, discovery, expression or concept listed.
3. Research with WebSearch (standard; extended for news). Use only facts that appear in dated sources; keep the URL and date.
   Never invent news, prices, scores, quotes, interviews or availability. If something can't be verified, say so in the text.
4. Write issue.json following content/templates/issue.template.json:
   - morning: all 13 core sections + 1–2 persona sections; evening: recap, behind-headlines, developments, culture, screen, tomorrow, song, puzzle (+ quotes/opinion).
   - every live-section article: kind news/analysis, sources[] with url + publishedAt; isDemo false.
   - editorsLetter, surprise, closingLine, memory keys, status "scheduled", publishAt 07:30 / 22:30 +03:00.
   - Images only from Wikimedia Commons with CC0/CC BY/CC BY-SA/public domain, with credit, license, sourceUrl.
5. node scripts/publish-issue.mjs --base $APP_URL --file issue.json [--media media/]
6. If any step fails: fix and retry up to 3 times; otherwise report the failure (the editor can publish manually from /admin).
Never commit issue content to the public repository.
