const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

exports.main = async (event, context) => {
  const { token, data } = event;

  if (!data || (!data.content && (!data.images || data.images.length === 0))) {
    return error('内容或图片至少填一项', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [partners] = await db.execute(
        'SELECT partner_id FROM partners WHERE user_id = ? AND bind_status = 1',
        [userId]
      );

      let partnerId = null;
      if (partners.length > 0) {
        partnerId = partners[0].partner_id;
      } else {
        const [partners2] = await db.execute(
          'SELECT user_id as partner_id FROM partners WHERE partner_id = ? AND bind_status = 1',
          [userId]
        );
        if (partners2.length > 0) {
          partnerId = partners2[0].partner_id;
        }
      }

      const [result] = await db.execute(
        `INSERT INTO moments
         (user_id, partner_id, content, images, location, latitude, longitude, weather, mood, tags, is_shared)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          partnerId,
          data.content || null,
          data.images ? JSON.stringify(data.images) : null,
          data.location || null,
          data.latitude || null,
          data.longitude || null,
          data.weather || null,
          data.mood || null,
          data.tags ? JSON.stringify(data.tags) : null,
          data.isShared !== undefined ? data.isShared : 0
        ]
      );

      return success({ momentId: result.insertId });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Create moment error:', err);
    return error(err.message || '创建失败', err.code || 500);
  }
};
