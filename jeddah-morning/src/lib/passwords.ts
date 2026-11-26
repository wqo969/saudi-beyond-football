/** PBKDF2-SHA256 password hashing with Web Crypto (works in Node and edge runtimes). */
const ITER = 210_000;
const enc = new TextEncoder();

const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, "base64"));

async function derive(password: string, salt: Uint8Array, iter: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, iter = ITER): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${b64(salt)}$${b64(await derive(password, salt, iter))}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iterS, saltS, hashS] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterS || !saltS || !hashS) return false;
  const got = await derive(password, unb64(saltS), Number(iterS));
  const want = unb64(hashS);
  if (got.length !== want.length) return false;
  let d = 0;
  for (let i = 0; i < got.length; i++) d |= got[i] ^ want[i];
  return d === 0;
}

export const DEMO_PASSWORDS = ["demo-reader", "demo-admin"];

/** Policy for production passwords. */
export function passwordProblems(pw: string): string[] {
  const p: string[] = [];
  if (pw.length < 12) p.push("١٢ حرفًا على الأقل");
  if (DEMO_PASSWORDS.includes(pw)) p.push("لا يُسمح بكلمات مرور النسخة التجريبية");
  if (/^(.)\1+$/.test(pw)) p.push("كلمة مرور ضعيفة");
  return p;
}
