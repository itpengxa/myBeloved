const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token } = event;

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(`
        SELECT p.*,
               u1.nickname as user_nickname, u1.avatar_url as user_avatar,
               u2.nickname as partner_nickname, u2.avatar_url as partner_avatar
        FROM partners p
        LEFT JOIN users u1 ON p.user_id = u1.id
        LEFT JOIN users u2 ON p.partner_id = u2.id
        WHERE (p.user_id = ? OR p.partner_id = ?)
        ORDER BY p.created_at DESC
        LIMIT 1
      `, [userId, userId]);

      if (rows.length === 0) {
        return success({ bindStatus: -1 });
      }

      const row = rows[0];
      const isUser = row.user_id === userId;
      const partnerId = isUser ? row.partner_id : row.user_id;
      const partnerNickname = isUser ? row.partner_nickname : row.user_nickname;
      const partnerAvatar = isUser ? row.partner_avatar : row.user_avatar;

      let loveDays = 0;
      if (row.bind_at) {
        loveDays = Math.floor((Date.now() - new Date(row.bind_at).getTime()) / (1000 * 60 * 60 * 24));
      }

      return success({
        bindStatus: row.bind_status,
        bindCode: row.bind_code,
        bindMsg: row.bind_msg,
        bindAt: row.bind_at,
        unbindAt: row.unbind_at,
        partner: partnerId ? {
          id: partnerId,
          nickname: partnerNickname,
          avatarUrl: partnerAvatar
        } : null,
        loveDays
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Get status error:', err);
    return error(err.message || '获取绑定状态失败', err.code || 500);
  }
};
