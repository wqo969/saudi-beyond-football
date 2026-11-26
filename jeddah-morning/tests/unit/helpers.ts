import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { compareIssuesAsc } from "@/lib/publishing";
import { IssueSchema, type Issue } from "@/lib/schema";

export const ISSUES_DIR = path.join(__dirname, "..", "..", "content", "issues");

export function loadDemoIssues(): Issue[] {
  return readdirSync(ISSUES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => IssueSchema.parse(JSON.parse(readFileSync(path.join(ISSUES_DIR, f), "utf8"))))
    .sort(compareIssuesAsc);
}
