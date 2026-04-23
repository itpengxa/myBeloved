const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, page = 1, pageSize = 10, mood, tag } = event;

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      let sql = `
        SELECT m.*, u.nickname, u.avatar_url,
               (SELECT COUNT(*) FROM comments WHERE moment_id = m.id) as comment_count
        FROM moments m
        JOIN users u ON m.user_id = u.id
        WHERE (m.user_id = ? OR (m.partner_id = ? AND m.is_shared = 1))
      `;
      const params = [userId, userId];

      if (mood) {
        sql += ' AND m.mood = ?';
        params.push(mood);
      }
      if (tag) {
        sql += ' AND JSON_CONTAINS(m.tags, JSON_ARRAY(?))';
        params.push(tag);
      }

      sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

      const [rows] = await db.execute(sql, params);

      const [countRes] = await db.execute(
        `SELECT COUNT(*) as total FROM moments m
         WHERE (m.user_id = ? OR (m.partner_id = ? AND m.is_shared = 1))`,
        [userId, userId]
      );

      return success({
        list: rows.map(row => ({
          ...row,
          images: row.images ? JSON.parse(row.images) : [],
          tags: row.tags ? JSON.parse(row.tags) : []
        })),
        total: countRes[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('List moments error:', err);
    return error(err.message || '获取列表失败', err.code || 500);
  }
};
