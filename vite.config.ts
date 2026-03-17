import { readFileSync } from "fs";
import { createRequire } from "module";
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

const require = createRequire(import.meta.url);

const stripGoogleFontsImport = (): Plugin => ({
  name: "strip-google-fonts-import",
  enforce: "pre",
  async transform(code, id) {
    if (id.endsWith("app.css")) {
      // Inline adwavecss with the Google Fonts @import stripped out
      const adwavePath = require.resolve("adwavecss/dist/styles.css");
      let adwave = readFileSync(adwavePath, "utf-8");
      adwave = adwave.replace(/@import\s+url\(["']https:\/\/fonts\.googleapis\.com\/[^"']+["']\);?\n?/g, "");
      return code.replace('@import "adwavecss/dist/styles.css";', adwave);
    }
  },
});

export default defineConfig(async () => ({
  plugins: [stripGoogleFontsImport(), tailwindcss(), svelte()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
