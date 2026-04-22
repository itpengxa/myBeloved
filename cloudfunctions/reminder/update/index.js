const pool = require('../../config/db');
const { success, error } = require('../../utils/response');
const { verifyToken } = require('../../utils/auth');

exports.main = async (event, context) => {
  const { token, reminderId, data } = event;

  if (!reminderId || !data) {
    return error('缺少参数', 400);
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        'SELECT user_id FROM reminders WHERE id = ?',
        [reminderId]
      );

      if (rows.length === 0) {
        return error('提醒不存在', 404);
      }

      if (rows[0].user_id !== userId) {
        return error('无权修改', 403);
      }

      const fields = [];
      const values = [];

      const fieldMap = {
        title: 'title',
        reminderType: 'reminder_type',
        targetDate: 'target_date',
        isLunar: 'is_lunar',
        advanceDays: 'advance_days',
        notifyTime: 'notify_time',
        repeatType: 'repeat_type',
        notifyTarget: 'notify_target',
        status: 'status'
      };

      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (data[key] !== undefined) {
          fields.push(`${dbField} = ?`);
          values.push(data[key]);
        }
      }

      if (fields.length === 0) {
        return error('没有需要更新的字段', 400);
      }

      values.push(reminderId);
      await db.execute(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`, values);

      return success({ updated: true });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Update reminder error:', err);
    return error(err.message || '更新失败', err.code || 500);
  }
};
