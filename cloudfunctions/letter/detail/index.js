const pool = require('../../config/db');
const { success, error } = require('../../utils/response');
const { verifyToken } = require('../../utils/auth');

exports.main = async (event, context) => {
  const { token, letterId } = event;

  if (!letterId) {
    return error('缺少letterId', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        `SELECT l.*,
                u1.nickname as sender_nickname, u1.avatar_url as sender_avatar,
                u2.nickname as receiver_nickname, u2.avatar_url as receiver_avatar
         FROM love_letters l
         JOIN users u1 ON l.user_id = u1.id
         JOIN users u2 ON l.partner_id = u2.id
         WHERE l.id = ? AND (l.user_id = ? OR l.partner_id = ?)`,
        [letterId, userId, userId]
      );

      if (rows.length === 0) {
        return error('情书不存在或无权查看', 404);
      }

      const letter = rows[0];
      letter.food_recommend = letter.food_recommend ? JSON.parse(letter.food_recommend) : null;
      letter.activity_recommend = letter.activity_recommend ? JSON.parse(letter.activity_recommend) : null;
      letter.todo_list = letter.todo_list ? JSON.parse(letter.todo_list) : [];
      letter.based_moments = letter.based_moments ? JSON.parse(letter.based_moments) : [];

      return success(letter);
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Get letter detail error:', err);
    return error(err.message || '获取详情失败', err.code || 500);
  }
};
