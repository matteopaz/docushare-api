require("dotenv").config();
require("esbuild").build({
    bundle: true,
    platform: "node",
    entryPoints: ["src/index.ts"],
    outfile: "dist/worker.js",
    target: "esnext",
    sourcemap: "external",
});