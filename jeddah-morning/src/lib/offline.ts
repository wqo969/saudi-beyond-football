import type { Issue } from "./schema";

/** Every URL needed to read an issue offline (pages + data). */
export function issueOfflineUrls(issue: Issue): string[] {
  const base = `/issue/${issue.slug}`;
  return [
    "/",
    base,
    `${base}/read`,
    ...issue.articles.map((a) => `${base}/a/${a.id}`),
    ...(issue.pdf ? [`${base}/pdf`, `/api/pdf/${issue.slug}`] : []),
    "/search",
    "/favorites",
    "/api/search-index",
  ];
}
