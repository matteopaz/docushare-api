import { build } from 'esbuild';


build({
    bundle: true,
    platform: 'neutral',
    entryPoints: ["src/index.ts"],
    outfile: "dist/worker.js",
    target: "esnext",
    sourcemap: "external",
});