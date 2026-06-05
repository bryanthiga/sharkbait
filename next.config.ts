import type { NextConfig } from "next";

// Content-Security-Policy
// 'unsafe-inline' is still required because public/index.html contains a
// large inline <style> block and an inline <script>. Moving those into
// external files (or switching to nonce/hash-based CSP) is a future
// improvement. Even with 'unsafe-inline', this CSP blocks loading scripts/
// styles/connections from non-whitelisted origins, which materially shrinks
// the attack surface for any XSS sink that tries to fetch external code.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://api.mapbox.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "img-src 'self' data: blob: https://api.mapbox.com https://*.tiles.mapbox.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.supabase.co https://cdn.jsdelivr.net https://news.google.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
