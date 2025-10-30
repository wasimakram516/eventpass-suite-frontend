export default {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // Handle explicit language routes
      {
        source: '/:lang(en|ar)/event/:slug*',
        destination: '/eventreg/:lang/event/:slug*',
      },
      // Fallback: missing language → default to "en"
      {
        source: '/event/:slug*',
        destination: '/eventreg/en/event/:slug*',
      },
    ];
  },
};
