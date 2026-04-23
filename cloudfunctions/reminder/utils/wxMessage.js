const axios = require('axios');
const { appId, secret } = require('../config/wx');

let accessTokenCache = { token: null, expires: 0 };

async function getAccessToken() {
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expires > now) {
    return accessTokenCache.token;
  }
  const res = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`
  );
  if (res.data.errcode) {
    throw new Error(`获取access_token失败: ${res.data.errmsg}`);
  }
  accessTokenCache.token = res.data.access_token;
  accessTokenCache.expires = now + (res.data.expires_in - 300) * 1000;
  return res.data.access_token;
}

async function sendSubscribeMessage(openid, templateId, data, page = '') {
  const accessToken = await getAccessToken();
  const sendRes = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
    {
      touser: openid,
      template_id: templateId,
      page,
      data,
      miniprogram_state: 'formal',
      lang: 'zh_CN'
    }
  );
  if (sendRes.data.errcode !== 0) {
    console.error('Send message failed:', sendRes.data);
    return { success: false, errcode: sendRes.data.errcode, errmsg: sendRes.data.errmsg };
  }
  return { success: true };
}

module.exports = { sendSubscribeMessage, getAccessToken };
