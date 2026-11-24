import type { NextConfig } from "next";

// Files in /public are served with `max-age=0, must-revalidate` by default, so
// returning visitors re-request every icon on every page. These change rarely
// and are not content-hashed, so cache them for a day and let the browser keep
// using a stale copy for a week while it re-checks in the background.
const STATIC_ASSET_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:dir(tag-icons|icons)/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      },
      {
        source: '/:file(spentum-logo\\.webp|spentum\\.png|shared-household\\.svg|swipe-left\\.png|swipe-right\\.png)',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      },
    ];
  },
};

export default nextConfig;
