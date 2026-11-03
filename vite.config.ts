import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";

// Writes every built asset into dist/sw.js so the first install caches the whole app,
// and derives the cache VERSION from the asset names so each build replaces the old cache.
function precache(): Plugin {
  return {
    name: "huyou-precache",
    apply: "build",
    closeBundle() {
      const dist = "dist";
      const assets = readdirSync(join(dist, "assets")).map((f) => `./assets/${f}`);
      const files = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png", ...assets];
      const version = createHash("sha1").update(assets.join()).digest("hex").slice(0, 10);
      const sw = join(dist, "sw.js");
      writeFileSync(
        sw,
        readFileSync(sw, "utf8")
          .replace('"huyou-dev"', JSON.stringify(`huyou-${version}`))
          .replace("/* PRECACHE */ []", JSON.stringify(files)),
      );
    },
  };
}

// Relative base so the build works from any static host path (see CLAUDE.md → Deploy).
export default defineConfig({ base: "./", plugins: [precache()] });
