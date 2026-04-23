const pool = require('./config/db');
const { sendSubscribeMessage } = require('./utils/wxMessage');

const DAILY_TEMPLATE_ID = process.env.DAILY_TEMPLATE_ID || '';

exports.main = async (event, context) => {
  const db = await pool.getConnection();

  try {
    const [settings] = await db.execute(`
      SELECT ns.*, u.openid as user_openid, p.openid as partner_openid
      FROM notify_settings ns
      JOIN users u ON ns.user_id = u.id
      LEFT JOIN partners pr ON (pr.user_id = ns.user_id OR pr.partner_id = ns.user_id) AND pr.bind_status = 1
      LEFT JOIN users p ON (CASE WHEN pr.user_id = ns.user_id THEN pr.partner_id ELSE pr.user_id END) = p.id
      WHERE ns.daily_notify = 1
    `);

    for (const setting of settings) {
      const templateData = {
        thing1: { value: '今日情侣问候' },
        thing2: { value: '记得记录今天的美好瞬间哦~' },
        time3: { value: new Date().toISOString().split('T')[0] }
      };

      if (setting.notify_target & 1) {
        await sendSubscribeMessage(setting.user_openid, DAILY_TEMPLATE_ID, templateData, '/pages/index/index');
      }
      if (setting.partner_openid && (setting.notify_target & 2)) {
        await sendSubscribeMessage(setting.partner_openid, DAILY_TEMPLATE_ID, templateData, '/pages/index/index');
      }
    }

    return { processed: settings.length };
  } catch (err) {
    console.error('Daily notify trigger error:', err);
    return { error: err.message };
  } finally {
    db.release();
  }
};
