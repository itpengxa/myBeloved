module.exports = {
  accessKeyId: process.env.OSS_ACCESS_KEY,
  accessKeySecret: process.env.OSS_ACCESS_SECRET,
  roleArn: process.env.OSS_ROLE_ARN,
  bucket: process.env.OSS_BUCKET,
  endpoint: process.env.OSS_ENDPOINT,
  region: process.env.OSS_REGION,
  stsEndpoint: 'https://sts.aliyuncs.com',
  durationSeconds: 3600
};
