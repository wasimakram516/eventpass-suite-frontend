export default {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/event/:slug*',
        destination: '/eventreg/event/:slug*',
      },
    ];
  },
};
