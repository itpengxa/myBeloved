const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, data } = event;

  if (!data) {
    return error('缺少更新数据', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const fields = [];
      const values = [];

      if (data.nickname !== undefined) {
        fields.push('nickname = ?');
        values.push(data.nickname);
      }
      if (data.avatarUrl !== undefined) {
        fields.push('avatar_url = ?');
        values.push(data.avatarUrl);
      }
      if (data.gender !== undefined) {
        fields.push('gender = ?');
        values.push(data.gender);
      }
      if (data.phone !== undefined) {
        fields.push('phone = ?');
        values.push(data.phone);
      }

      if (fields.length === 0) {
        return error('没有需要更新的字段', 400);
      }

      values.push(userId);
      await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

      const [users] = await db.execute(
        'SELECT id, nickname, avatar_url, gender, phone FROM users WHERE id = ?',
        [userId]
      );

      return success(users[0]);
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Update profile error:', err);
    return error(err.message || '更新失败', err.code || 500);
  }
};
