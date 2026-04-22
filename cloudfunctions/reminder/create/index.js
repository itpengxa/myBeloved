const pool = require('../../config/db');
const { success, error } = require('../../utils/response');
const { verifyToken } = require('../../utils/auth');

exports.main = async (event, context) => {
  const { token, data } = event;

  if (!data || !data.title || !data.reminderType || !data.targetDate) {
    return error('缺少必要参数', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [partners] = await db.execute(
        `SELECT partner_id FROM partners WHERE user_id = ? AND bind_status = 1
         UNION
         SELECT user_id as partner_id FROM partners WHERE partner_id = ? AND bind_status = 1`,
        [userId, userId]
      );

      const partnerId = partners.length > 0 ? partners[0].partner_id : null;

      const [result] = await db.execute(
        `INSERT INTO reminders
         (user_id, partner_id, title, reminder_type, target_date, is_lunar, advance_days, notify_time, repeat_type, notify_target, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          partnerId,
          data.title,
          data.reminderType,
          data.targetDate,
          data.isLunar || 0,
          data.advanceDays !== undefined ? data.advanceDays : 1,
          data.notifyTime || '09:00:00',
          data.repeatType !== undefined ? data.repeatType : 1,
          data.notifyTarget !== undefined ? data.notifyTarget : 3,
          data.status !== undefined ? data.status : 1
        ]
      );

      return success({ reminderId: result.insertId });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Create reminder error:', err);
    return error(err.message || '创建失败', err.code || 500);
  }
};
