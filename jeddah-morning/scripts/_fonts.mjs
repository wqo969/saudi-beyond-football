// Inline @font-face rules (base64) so headless Chromium renders Arabic correctly without network.
import { readFileSync } from "node:fs";
import path from "node:path";

export function fontFaces(root) {
  const f = (pkg, file) => readFileSync(path.join(root, "node_modules", "@fontsource", pkg, "files", file)).toString("base64");
  const face = (family, weight, data) => `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`;
  return [
    face("Amiri", 400, f("amiri", "amiri-arabic-400-normal.woff2")),
    face("Amiri", 700, f("amiri", "amiri-arabic-700-normal.woff2")),
    face("Naskh", 400, f("noto-naskh-arabic", "noto-naskh-arabic-arabic-400-normal.woff2")),
    face("Playfair", 600, f("playfair-display", "playfair-display-latin-600-normal.woff2")),
  ].join("\n");
}
