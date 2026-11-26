import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { BlobRepository } from "@/lib/content/blob";
import { FsStore } from "@/lib/content/blob-store";
import { IssueSchema } from "@/lib/schema";

const root = mkdtempSync(path.join(tmpdir(), "jm-blob-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const issue = IssueSchema.parse({
  slug: "2026-12-01-morning", date: "2026-12-01", edition: "morning", number: 1, title: "t", coverHeadline: "c",
  articles: [{ id: "a", section: "discovery", title: "x", body: [{ type: "p", text: "y" }] }],
});

describe("BlobRepository (private object store code path)", () => {
  const invalidated: string[] = [];
  const repo = new BlobRepository(new FsStore(root), undefined, (t) => invalidated.push(...t));

  it("saves, lists and reads issues, invalidating caches", async () => {
    await repo.saveIssue(issue);
    expect((await repo.listIssues()).map((i) => i.slug)).toEqual([issue.slug]);
    expect((await repo.getIssue(issue.slug))?.title).toBe("t");
    expect(invalidated).toContain(`issue:${issue.slug}`);
  });

  it("keeps every previous version and can restore one", async () => {
    await repo.saveIssue({ ...issue, title: "t2" });
    await repo.saveIssue({ ...issue, title: "t3" });
    const versions = await repo.listVersions(issue.slug);
    expect(versions.length).toBe(2);
    const oldest = await repo.readVersion(issue.slug, versions[versions.length - 1]);
    expect(oldest?.title).toBe("t");
  });

  it("soft-deletes into history", async () => {
    await repo.deleteIssue(issue.slug);
    expect(await repo.getIssue(issue.slug)).toBeNull();
    expect((await repo.listVersions(issue.slug)).some((v) => v.startsWith("deleted-"))).toBe(true);
  });

  it("stores PDFs and media and refuses unsafe names", async () => {
    await repo.savePdf("x-1.pdf", new Uint8Array([37, 80, 68, 70]));
    expect((await repo.readPdf("x-1.pdf"))?.length).toBe(4);
    await repo.saveMedia("img-1.jpg", new Uint8Array([1, 2, 3]), "image/jpeg");
    expect((await repo.readMedia("img-1.jpg"))?.length).toBe(3);
    expect(await repo.readMedia("../secret.jpg")).toBeNull();
    await expect(repo.savePdf("../x.pdf", new Uint8Array([1]))).rejects.toThrow();
    expect(await repo.readVersion(issue.slug, "../../kv/auth")).toBeNull();
  });
});
