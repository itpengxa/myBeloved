const pool = require('../../config/db');
const { success, error } = require('../../utils/response');
const { verifyToken } = require('../../utils/auth');

function generateBindCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.main = async (event, context) => {
  const { token, bindMsg } = event;

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [existing] = await db.execute(
        'SELECT * FROM partners WHERE (user_id = ? OR partner_id = ?) AND bind_status = 1',
        [userId, userId]
      );

      if (existing.length > 0) {
        return error('您已有绑定对象', 400);
      }

      const [pending] = await db.execute(
        'SELECT * FROM partners WHERE user_id = ? AND bind_status = 0 AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [userId]
      );

      if (pending.length > 0) {
        return success({
          bindCode: pending[0].bind_code,
          expiresAt: new Date(new Date(pending[0].created_at).getTime() + 24 * 60 * 60 * 1000)
        });
      }

      let code;
      let exists = true;
      while (exists) {
        code = generateBindCode();
        const [rows] = await db.execute('SELECT id FROM partners WHERE bind_code = ?', [code]);
        exists = rows.length > 0;
      }

      await db.execute(
        'INSERT INTO partners (user_id, bind_code, bind_msg, bind_status) VALUES (?, ?, ?, 0)',
        [userId, code, bindMsg || '']
      );

      return success({
        bindCode: code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Generate code error:', err);
    return error(err.message || '生成绑定码失败', err.code || 500);
  }
};
