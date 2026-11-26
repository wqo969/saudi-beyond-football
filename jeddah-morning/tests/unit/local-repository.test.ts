import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { LocalRepository } from "@/lib/content/local";
import { IssueSchema } from "@/lib/schema";

const root = mkdtempSync(path.join(tmpdir(), "jm-repo-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const issue = IssueSchema.parse({
  slug: "2026-12-01-evening", date: "2026-12-01", edition: "evening", number: 7, title: "t", coverHeadline: "c",
  articles: [{ id: "a", section: "discovery", title: "x", body: [{ type: "p", text: "y" }] }],
});

describe("LocalRepository", () => {
  const repo = new LocalRepository({ root, writable: true });
  it("saves, lists, reads and deletes issues", async () => {
    await repo.saveIssue(issue);
    expect((await repo.listIssues()).map((i) => i.slug)).toEqual([issue.slug]);
    expect((await repo.getIssue(issue.slug))?.updatedAt).toBeTruthy();
    await repo.deleteIssue(issue.slug);
    expect(await repo.getIssue(issue.slug)).toBeNull();
  });
  it("refuses unsafe slugs and pdf names", async () => {
    expect(await repo.getIssue("../../etc/passwd")).toBeNull();
    expect(await repo.readPdf("../x.pdf")).toBeNull();
    await expect(repo.savePdf("../x.pdf", new Uint8Array([1]))).rejects.toThrow();
  });
  it("stores and reads PDFs", async () => {
    await repo.savePdf("a-1.pdf", new Uint8Array([37, 80, 68, 70]));
    expect(Array.from((await repo.readPdf("a-1.pdf"))!)).toEqual([37, 80, 68, 70]);
  });
  it("read-only mode rejects writes", async () => {
    const ro = new LocalRepository({ root, writable: false });
    await expect(ro.saveIssue(issue)).rejects.toThrow();
  });
});
