import { describe, expect, it } from "vitest";
import { passwordMatches, roleForPassword, safeNext, signSession, verifySession } from "@/lib/auth";

const secret = "test-secret-0123456789-0123456789-abc";
const future = Math.floor(Date.now() / 1000) + 3600;

describe("session tokens", () => {
  it("round-trips a valid session", async () => {
    const t = await signSession({ role: "admin", exp: future }, secret);
    expect(await verifySession(t, secret)).toEqual({ role: "admin", exp: future, v: 1 });
  });
  it("rejects wrong secret, tampering, expiry and garbage", async () => {
    const t = await signSession({ role: "reader", exp: future }, secret);
    expect(await verifySession(t, secret + "x")).toBeNull();
    const [payload, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ role: "admin", exp: future })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`, secret)).toBeNull();
    expect(await verifySession(`${payload}.${sig.slice(0, -2)}AA`, secret)).toBeNull();
    const old = await signSession({ role: "reader", exp: 1000 }, secret);
    expect(await verifySession(old, secret)).toBeNull();
    expect(await verifySession("nonsense", secret)).toBeNull();
    expect(await verifySession(t, null)).toBeNull();
  });
});

describe("passwords", () => {
  const cfg = { readerPassword: "r-pass", adminPassword: "a-pass", secret, usingDevDefaults: false };
  it("maps passwords to roles", async () => {
    expect(await roleForPassword("a-pass", cfg)).toBe("admin");
    expect(await roleForPassword("r-pass", cfg)).toBe("reader");
    expect(await roleForPassword("nope", cfg)).toBeNull();
    expect(await passwordMatches("", null)).toBe(false);
  });
});

describe("safeNext", () => {
  it("only allows local paths", () => {
    expect(safeNext("/archive?x=1")).toBe("/archive?x=1");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("/login")).toBe("/");
    expect(safeNext(undefined)).toBe("/");
  });
});
