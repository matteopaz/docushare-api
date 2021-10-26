require('dotenv').config();
const nm_polyfill = require("node-module-polyfill");
require("esbuild").build({
    bundle: true,
    platform: "node",
    entryPoints: ["src/index.ts"],
    outfile: "dist/worker.js",
    target: "esnext",
    sourcemap: "external",
    plugins: [
        nm_polyfill()
    ]
});