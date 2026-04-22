const pool = require('../../config/db');
const { sendSubscribeMessage } = require('../../utils/wxMessage');

const REMINDER_TEMPLATE_ID = process.env.REMINDER_TEMPLATE_ID || '';

exports.main = async (event, context) => {
  const db = await pool.getConnection();

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 8);

    const [reminders] = await db.execute(`
      SELECT r.*, u.openid as user_openid, p.openid as partner_openid
      FROM reminders r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users p ON r.partner_id = p.id
      WHERE r.status = 1
        AND DATE(r.target_date) <= DATE_ADD(?, INTERVAL r.advance_days DAY)
        AND r.notify_time <= ?
        AND (r.last_notify_date IS NULL OR r.last_notify_date < ?)
    `, [today, currentTime, today]);

    for (const reminder of reminders) {
      const templateData = {
        thing1: { value: reminder.title },
        time2: { value: reminder.target_date.toISOString().split('T')[0] },
        thing3: { value: `还有${reminder.advance_days}天，别忘了准备惊喜哦~` }
      };

      if (reminder.notify_target & 1) {
        await sendSubscribeMessage(reminder.user_openid, REMINDER_TEMPLATE_ID, templateData);
      }
      if (reminder.partner_openid && (reminder.notify_target & 2)) {
        await sendSubscribeMessage(reminder.partner_openid, REMINDER_TEMPLATE_ID, templateData);
      }

      await db.execute('UPDATE reminders SET last_notify_date = ? WHERE id = ?', [today, reminder.id]);
    }

    return { processed: reminders.length };
  } catch (err) {
    console.error('Daily reminder trigger error:', err);
    return { error: err.message };
  } finally {
    db.release();
  }
};
