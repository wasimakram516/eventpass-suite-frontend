const nextConfig = {
  async rewrites() {
    return [
      // Handle explicit language routes
      {
        source: "/:lang(en|ar)/event/:slug*",
        destination: "/eventreg/:lang/event/:slug*",
      },
      // Fallback: missing language → default to "en"
      {
        source: "/event/:slug*",
        destination: "/eventreg/en/event/:slug*",
      },
    ];
  },

  // Turbopack (default in Next.js 16) handles TTF/OTF natively — no rule needed.
  // Keep webpack config for non-Turbopack builds (next build).
  turbopack: {},

  webpack(config) {
    config.module.rules.push({
      test: /\.(ttf|otf)$/i,
      type: "asset/resource",
      generator: {
        filename: "static/fonts/[name][ext]",
      },
    });
    return config;
  },
};

export default nextConfig;
