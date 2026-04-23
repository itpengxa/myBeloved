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
        'SELECT user_id FROM moments WHERE id = ?',
        [momentId]
      );

      if (rows.length === 0) {
        return error('点滴不存在', 404);
      }

      if (rows[0].user_id !== userId) {
        return error('无权删除', 403);
      }

      await db.execute('DELETE FROM comments WHERE moment_id = ?', [momentId]);
      await db.execute('DELETE FROM moments WHERE id = ?', [momentId]);

      return success({ deleted: true });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Delete moment error:', err);
    return error(err.message || '删除失败', err.code || 500);
  }
};
