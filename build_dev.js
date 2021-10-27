import { config } from 'dotenv';
import { build } from 'esbuild';

config();
build({
    bundle: true,
    platform: "node",
    entryPoints: ["src/index.ts"],
    outfile: "dist/worker.js",
    target: "esnext",
    sourcemap: "external",
});