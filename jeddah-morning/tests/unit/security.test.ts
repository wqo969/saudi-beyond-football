import { afterEach, describe, expect, it } from "vitest";
import { hashPassword, passwordProblems, verifyPassword } from "@/lib/passwords";
import { pipelineKeyValid } from "@/lib/pipeline-auth";

describe("password hashing (PBKDF2-SHA256)", () => {
  it("verifies the right password only, with unique salts", async () => {
    const h1 = await hashPassword("correct horse battery", 1000);
    const h2 = await hashPassword("correct horse battery", 1000);
    expect(h1).not.toBe(h2);
    expect(await verifyPassword("correct horse battery", h1)).toBe(true);
    expect(await verifyPassword("correct horse batterx", h1)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
  });
  it("rejects demo and weak production passwords", () => {
    expect(passwordProblems("demo-admin").length).toBeGreaterThan(0);
    expect(passwordProblems("short").length).toBeGreaterThan(0);
    expect(passwordProblems("aaaaaaaaaaaaaaaa").length).toBeGreaterThan(0);
    expect(passwordProblems("a-long-unique-pass-2026")).toEqual([]);
  });
});

describe("pipeline key", () => {
  afterEach(() => delete process.env.JM_PIPELINE_KEY);
  it("requires a configured key of ≥32 chars and an exact match", () => {
    expect(pipelineKeyValid("anything")).toBe(false);
    process.env.JM_PIPELINE_KEY = "short";
    expect(pipelineKeyValid("short")).toBe(false);
    process.env.JM_PIPELINE_KEY = "k".repeat(40);
    expect(pipelineKeyValid("k".repeat(40))).toBe(true);
    expect(pipelineKeyValid("k".repeat(39) + "x")).toBe(false);
    expect(pipelineKeyValid(null)).toBe(false);
  });
});
