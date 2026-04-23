const RPCClient = require('@alicloud/pop-core').RPCClient;
const crypto = require('crypto');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

const ossConfig = require('../config/oss');

exports.main = async (event, context) => {
  const { token, fileType = 'moments' } = event;

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const client = new RPCClient({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      endpoint: ossConfig.stsEndpoint,
      apiVersion: '2015-04-01'
    });

    const params = {
      RoleArn: ossConfig.roleArn,
      RoleSessionName: `user_${userId}`,
      DurationSeconds: ossConfig.durationSeconds,
      Policy: JSON.stringify({
        Version: '1',
        Statement: [{
          Effect: 'Allow',
          Action: ['oss:PutObject'],
          Resource: [`acs:oss:*:*:${ossConfig.bucket}/${fileType}/${userId}/*`]
        }]
      })
    };

    const result = await client.request('AssumeRole', params);

    const creds = result.Credentials;
    const expirationDate = new Date(Date.now() + ossConfig.durationSeconds * 1000).toISOString();

    const policy = Buffer.from(JSON.stringify({
      expiration: expirationDate,
      conditions: [
        ['content-length-range', 0, 104857600],
        ['starts-with', '$key', `${fileType}/${userId}/`]
      ]
    })).toString('base64');

    const signature = crypto.createHmac('sha1', creds.AccessKeySecret).update(policy).digest('base64');

    return success({
      accessKeyId: creds.AccessKeyId,
      accessKeySecret: creds.AccessKeySecret,
      securityToken: creds.SecurityToken,
      expiration: creds.Expiration,
      policy,
      signature,
      bucket: ossConfig.bucket,
      endpoint: ossConfig.endpoint,
      region: ossConfig.region
    });
  } catch (err) {
    console.error('Get OSS token error:', err);
    return error(err.message || '获取上传凭证失败', 500);
  }
};
