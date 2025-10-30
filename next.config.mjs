export default {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/:lang(en|ar)/event/:slug*',
        destination: '/eventreg/:lang/event/:slug*',
      },
      {
        source: '/event/:slug*',
        destination: '/eventreg/event/:slug*',
      },
    ];
  },
};
