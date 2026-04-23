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
      const [rows] = await db.execute(
        'SELECT * FROM partners WHERE (user_id = ? OR partner_id = ?) AND bind_status = 1',
        [userId, userId]
      );

      if (rows.length === 0) {
        return error('您没有绑定对象', 400);
      }

      await db.execute(
        'UPDATE partners SET bind_status = 3, unbind_at = NOW() WHERE id = ?',
        [rows[0].id]
      );

      return success({ unbindAt: new Date() });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Unbind error:', err);
    return error(err.message || '解绑失败', err.code || 500);
  }
};
