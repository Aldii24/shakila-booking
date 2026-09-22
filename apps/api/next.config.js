import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["exceljs", "pdf-lib"],
  experimental: { cpus: 1, memoryBasedWorkersCount: false },
  outputFileTracingRoot: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  ),
};

export default nextConfig;
