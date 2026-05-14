import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Note: This tells Serwist where to generate the service worker
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Keeps dev environment fast
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This ensures Next.js looks for files correctly
  distDir: '.next',
};

// Export the configuration wrapped in the PWA initializer
export default withSerwist(nextConfig);