import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// There is a stray package-lock.json in the home directory, outside this
// repo. Without an explicit root, Turbopack searches upwards, finds it and
// warns. Pinning the root to this folder keeps builds predictable.
const root = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root },
};

export default nextConfig;
