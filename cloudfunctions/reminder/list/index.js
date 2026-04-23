const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, type } = event;

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      let sql = 'SELECT * FROM reminders WHERE user_id = ?';
      const params = [userId];

      if (type) {
        sql += ' AND reminder_type = ?';
        params.push(type);
      }

      sql += ' ORDER BY target_date ASC';

      const [rows] = await db.execute(sql, params);
      return success(rows);
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('List reminders error:', err);
    return error(err.message || '获取列表失败', err.code || 500);
  }
};
