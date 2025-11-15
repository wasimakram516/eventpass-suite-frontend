const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

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
      // Downloads route
      {
        source: "/:slug*",
        destination: "/downloads/:slug*",
      }
    ];
  },

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
