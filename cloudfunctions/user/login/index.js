const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { signToken } = require('../utils/auth');
const axios = require('axios');

const APPID = process.env.WX_APPID;
const SECRET = process.env.WX_SECRET;

exports.main = async (event, context) => {
  const { code, userInfo } = event;

  if (!code) {
    return error('缺少code参数', 400);
  }

  try {
    const wxRes = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
    );

    if (wxRes.data.errcode) {
      return error(`微信登录失败: ${wxRes.data.errmsg}`, 400);
    }

    const { openid, session_key, unionid } = wxRes.data;

    const db = await pool.getConnection();
    try {
      let [rows] = await db.execute('SELECT * FROM users WHERE openid = ?', [openid]);
      let userId;
      let isNew = false;

      if (rows.length === 0) {
        const [result] = await db.execute(
          'INSERT INTO users (openid, unionid, nickname, avatar_url, gender) VALUES (?, ?, ?, ?, ?)',
          [openid, unionid, userInfo?.nickName || null, userInfo?.avatarUrl || null, userInfo?.gender || 0]
        );
        userId = result.insertId;
        isNew = true;

        await db.execute(
          'INSERT INTO notify_settings (user_id) VALUES (?)',
          [userId]
        );
      } else {
        userId = rows[0].id;
        if (userInfo) {
          await db.execute(
            'UPDATE users SET nickname = ?, avatar_url = ?, gender = ? WHERE id = ?',
            [userInfo.nickName, userInfo.avatarUrl, userInfo.gender, userId]
          );
        }
      }

      const token = signToken({ userId, openid });

      return success({ token, userId, isNew });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Login error:', err);
    return error(err.message || '登录失败');
  }
};
