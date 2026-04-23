const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, bindCode } = event;

  if (!bindCode) {
    return error('请输入绑定码', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [records] = await db.execute(
        `SELECT * FROM partners
         WHERE bind_code = ? AND bind_status = 0 AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [bindCode]
      );

      if (records.length === 0) {
        return error('绑定码无效或已过期', 400);
      }

      const record = records[0];

      if (record.user_id === userId) {
        return error('不能绑定自己', 400);
      }

      const [existing] = await db.execute(
        'SELECT * FROM partners WHERE (user_id = ? OR partner_id = ?) AND bind_status = 1',
        [userId, userId]
      );

      if (existing.length > 0) {
        return error('您已有绑定对象', 400);
      }

      await db.execute(
        'UPDATE partners SET partner_id = ?, bind_status = 1, bind_at = NOW() WHERE id = ?',
        [userId, record.id]
      );

      return success({ bindStatus: 1, bindAt: new Date() });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Bind by code error:', err);
    return error(err.message || '绑定失败', err.code || 500);
  }
};
