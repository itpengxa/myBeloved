const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, momentId } = event;

  if (!momentId) {
    return error('缺少momentId', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        `SELECT m.*, u.nickname, u.avatar_url
         FROM moments m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ? AND (m.user_id = ? OR (m.partner_id = ? AND m.is_shared = 1))`,
        [momentId, userId, userId]
      );

      if (rows.length === 0) {
        return error('点滴不存在或无权查看', 404);
      }

      const moment = rows[0];
      moment.images = moment.images ? JSON.parse(moment.images) : [];
      moment.tags = moment.tags ? JSON.parse(moment.tags) : [];

      const [comments] = await db.execute(
        `SELECT c.*, u.nickname, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.moment_id = ?
         ORDER BY c.created_at DESC`,
        [momentId]
      );

      return success({ ...moment, comments });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Get moment detail error:', err);
    return error(err.message || '获取详情失败', err.code || 500);
  }
};
