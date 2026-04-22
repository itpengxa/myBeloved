const RPCClient = require('@alicloud/pop-core').RPCClient;
const { success, error } = require('../../utils/response');
const { verifyToken } = require('../../utils/auth');

const ossConfig = require('../../config/oss');

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

    return success({
      accessKeyId: result.Credentials.AccessKeyId,
      accessKeySecret: result.Credentials.AccessKeySecret,
      securityToken: result.Credentials.SecurityToken,
      expiration: result.Credentials.Expiration,
      bucket: ossConfig.bucket,
      endpoint: ossConfig.endpoint,
      region: ossConfig.region
    });
  } catch (err) {
    console.error('Get OSS token error:', err);
    return error(err.message || '获取上传凭证失败', 500);
  }
};
