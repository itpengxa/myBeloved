const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, reminderId } = event;

  if (!reminderId) {
    return error('缺少reminderId', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        'SELECT user_id FROM reminders WHERE id = ?',
        [reminderId]
      );

      if (rows.length === 0) {
        return error('提醒不存在', 404);
      }

      if (rows[0].user_id !== userId) {
        return error('无权删除', 403);
      }

      await db.execute('DELETE FROM reminders WHERE id = ?', [reminderId]);
      return success({ deleted: true });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Delete reminder error:', err);
    return error(err.message || '删除失败', err.code || 500);
  }
};
