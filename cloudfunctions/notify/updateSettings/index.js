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
      const [existing] = await db.execute(
        'SELECT id FROM notify_settings WHERE user_id = ?',
        [userId]
      );

      const fields = [];
      const values = [];
      const fieldMap = {
        dailyNotify: 'daily_notify',
        weeklyNotify: 'weekly_notify',
        monthlyNotify: 'monthly_notify',
        weeklyDay: 'weekly_day',
        monthlyDay: 'monthly_day',
        notifyTime: 'notify_time',
        notifyTarget: 'notify_target',
        aiStyle: 'ai_style'
      };

      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (data[key] !== undefined) {
          fields.push(`${dbField} = ?`);
          values.push(data[key]);
        }
      }

      if (existing.length === 0) {
        const insertFields = ['user_id'];
        const insertValues = [userId];
        for (const [key, dbField] of Object.entries(fieldMap)) {
          if (data[key] !== undefined) {
            insertFields.push(dbField);
            insertValues.push(data[key]);
          }
        }
        await db.execute(
          `INSERT INTO notify_settings (${insertFields.join(', ')}) VALUES (${insertValues.map(() => '?').join(', ')})`,
          insertValues
        );
      } else if (fields.length > 0) {
        values.push(userId);
        await db.execute(`UPDATE notify_settings SET ${fields.join(', ')} WHERE user_id = ?`, values);
      }

      return success({ updated: true });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Update notify settings error:', err);
    return error(err.message || '更新失败', err.code || 500);
  }
};
