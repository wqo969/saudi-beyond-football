import { defineConfig, devices } from "@playwright/test";
import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// e2e runs against a production build using a throw-away copy of content/ so tests never modify real data.
const dataRoot = process.env.JM_E2E_DATA_ROOT ?? mkdtempSync(path.join(tmpdir(), "jm-e2e-"));
if (!process.env.JM_E2E_DATA_ROOT) {
  cpSync(path.join(__dirname, "content"), path.join(dataRoot, "content"), { recursive: true });
  process.env.JM_E2E_DATA_ROOT = dataRoot; // reused by worker processes
}
const PORT = 3210;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off", locale: "ar-SA", timezoneId: "Asia/Riyadh" },
  projects: [{ name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      JM_DATA_ROOT: dataRoot,
      JM_READER_PASSWORD: "e2e-reader",
      JM_ADMIN_PASSWORD: "e2e-admin",
      JM_SESSION_SECRET: "e2e-secret-0123456789-0123456789-0123456789",
      JM_INSECURE_COOKIES: "true",
    },
  },
});
