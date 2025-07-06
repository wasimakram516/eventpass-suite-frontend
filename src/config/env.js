const env = {
  server: {
    url: process.env.NEXT_PUBLIC_API_URL,
    socket: process.env.NEXT_PUBLIC_WEBSOCKET_HOST,
  },
  node_env: process.env.NODE_ENV,
};

export default env;
