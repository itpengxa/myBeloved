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
      const [users] = await db.execute(
        'SELECT id, nickname, avatar_url, gender, phone, created_at FROM users WHERE id = ? AND status = 1',
        [userId]
      );

      if (users.length === 0) {
        return error('用户不存在或已禁用', 404);
      }

      const user = users[0];

      const [partners] = await db.execute(`
        SELECT p.*, u.nickname as partner_nickname, u.avatar_url as partner_avatar
        FROM partners p
        JOIN users u ON (p.partner_id = u.id OR p.user_id = u.id) AND u.id != ?
        WHERE (p.user_id = ? OR p.partner_id = ?) AND p.bind_status = 1
        LIMIT 1
      `, [userId, userId, userId]);

      let partnerInfo = null;
      let loveDays = 0;

      if (partners.length > 0) {
        const p = partners[0];
        partnerInfo = {
          partnerId: p.user_id === userId ? p.partner_id : p.user_id,
          nickname: p.partner_nickname,
          avatarUrl: p.partner_avatar,
          bindAt: p.bind_at
        };
        if (p.bind_at) {
          loveDays = Math.floor((Date.now() - new Date(p.bind_at).getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      const [momentCount] = await db.execute(
        'SELECT COUNT(*) as count FROM moments WHERE user_id = ?',
        [userId]
      );

      return success({
        user,
        partner: partnerInfo,
        loveDays,
        momentCount: momentCount[0].count
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Get profile error:', err);
    return error(err.message || '获取用户信息失败', err.code || 500);
  }
};
