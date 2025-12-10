const env = {
  server: {
    url: process.env.NEXT_PUBLIC_API_URL,
    socket: process.env.NEXT_PUBLIC_WEBSOCKET_HOST,
  },
  node_env: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
  aws: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
    cloudfrontUrl: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
  },
};

export default env;
