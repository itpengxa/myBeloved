const pool = require('../../config/db');
const { success, error } = require('../../utils/response');
const { verifyToken } = require('../../utils/auth');

exports.main = async (event, context) => {
  const { token, subscriptions } = event;

  if (!subscriptions || !Array.isArray(subscriptions)) {
    return error('缺少订阅数据', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      for (const sub of subscriptions) {
        if (!sub.templateId) continue;

        const [existing] = await db.execute(
          'SELECT id FROM subscriptions WHERE user_id = ? AND template_id = ?',
          [userId, sub.templateId]
        );

        if (existing.length === 0) {
          await db.execute(
            'INSERT INTO subscriptions (user_id, template_id, subscribe_count, last_subscribe) VALUES (?, ?, ?, NOW())',
            [userId, sub.templateId, sub.accepted ? 1 : 0]
          );
        } else {
          await db.execute(
            'UPDATE subscriptions SET subscribe_count = subscribe_count + ?, last_subscribe = NOW() WHERE id = ?',
            [sub.accepted ? 1 : 0, existing[0].id]
          );
        }
      }

      return success({ saved: true });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Request subscribe error:', err);
    return error(err.message || '保存失败', err.code || 500);
  }
};
