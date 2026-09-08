import path from "node:path";
import { fileURLToPath } from "node:url";

/* global process */
/** @type {import("next").NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_MODE: process.env.APP_MODE,
    NEXT_PUBLIC_TURNSTILE_MODE: process.env.TURNSTILE_MODE,
  },
  output: "standalone",
  experimental: { cpus: 1, memoryBasedWorkersCount: false },
  outputFileTracingRoot: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  ),
};

export default nextConfig;
