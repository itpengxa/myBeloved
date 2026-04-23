const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, page = 1, pageSize = 10 } = event;

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        `SELECT l.*,
                u1.nickname as sender_nickname,
                u2.nickname as receiver_nickname
         FROM love_letters l
         JOIN users u1 ON l.user_id = u1.id
         JOIN users u2 ON l.partner_id = u2.id
         WHERE l.user_id = ? OR l.partner_id = ?
         ORDER BY l.send_date DESC
         LIMIT ? OFFSET ?`,
        [userId, userId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
      );

      const [countRes] = await db.execute(
        'SELECT COUNT(*) as total FROM love_letters WHERE user_id = ? OR partner_id = ?',
        [userId, userId]
      );

      return success({
        list: rows.map(row => ({
          ...row,
          food_recommend: row.food_recommend ? JSON.parse(row.food_recommend) : null,
          activity_recommend: row.activity_recommend ? JSON.parse(row.activity_recommend) : null,
          todo_list: row.todo_list ? JSON.parse(row.todo_list) : [],
          based_moments: row.based_moments ? JSON.parse(row.based_moments) : []
        })),
        total: countRes[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('List letters error:', err);
    return error(err.message || '获取列表失败', err.code || 500);
  }
};
