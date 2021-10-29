import { build } from "esbuild";

build({
  bundle: true,
  platform: "browser",
  entryPoints: ["src/index.ts"],
  outfile: "dist/worker.js",
  target: "esnext",
  sourcemap: "external",
});
