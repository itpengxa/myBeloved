const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { buildLetterPrompt, buildRecommendationPrompt, generateLetter, generateRecommendations } = require('../utils/kimiApi');
const { sendSubscribeMessage } = require('../utils/wxMessage');

const LETTER_TEMPLATE_ID = process.env.LETTER_TEMPLATE_ID || '';

exports.main = async (event, context) => {
  const db = await pool.getConnection();

  try {
    const [pairs] = await db.execute(`
      SELECT p.*, u1.nickname as user_nickname, u1.openid as user_openid,
             u2.nickname as partner_nickname, u2.openid as partner_openid,
             ns.ai_style, ns.notify_target
      FROM partners p
      JOIN users u1 ON p.user_id = u1.id
      JOIN users u2 ON p.partner_id = u2.id
      LEFT JOIN notify_settings ns ON p.user_id = ns.user_id
      WHERE p.bind_status = 1
        AND (ns.weekly_notify = 1 OR ns.daily_notify = 1 OR ns.monthly_notify = 1)
    `);

    for (const pair of pairs) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [moments] = await db.execute(`
          SELECT * FROM moments
          WHERE user_id = ? AND created_at >= ?
          ORDER BY created_at DESC
          LIMIT 20
        `, [pair.user_id, sevenDaysAgo]);

        const location = moments[0]?.location || '北京';

        const letterPrompt = buildLetterPrompt(
          moments,
          { nickname: pair.partner_nickname },
          location,
          pair.ai_style
        );
        const letterContent = await generateLetter(letterPrompt);

        const recPrompt = buildRecommendationPrompt(location);
        const recommendations = await generateRecommendations(recPrompt);

        const [result] = await db.execute(`
          INSERT INTO love_letters
          (user_id, partner_id, letter_content, food_recommend, activity_recommend, todo_list, based_moments, send_date, send_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 0)
        `, [
          pair.user_id,
          pair.partner_id,
          letterContent,
          JSON.stringify(recommendations.food),
          JSON.stringify(recommendations.activity),
          JSON.stringify(recommendations.todos),
          JSON.stringify(moments.map(m => m.id))
        ]);

        const letterId = result.insertId;

        const templateData = {
          thing1: { value: '本周情书已生成' },
          thing2: { value: '基于你们的生活点滴，AI为你写了一封专属情书' },
          time3: { value: new Date().toISOString().split('T')[0] }
        };

        const notifyTarget = pair.notify_target || 3;

        if (notifyTarget & 1) {
          await sendSubscribeMessage(pair.user_openid, LETTER_TEMPLATE_ID, {
            ...templateData,
            thing4: { value: '点击查看完整情书和本周推荐' }
          }, `/pages/letter/detail?id=${letterId}`);
        }
        if (notifyTarget & 2) {
          await sendSubscribeMessage(pair.partner_openid, LETTER_TEMPLATE_ID, {
            ...templateData,
            thing4: { value: '你的TA为你准备了一封情书' }
          }, `/pages/letter/detail?id=${letterId}`);
        }

        await db.execute('UPDATE love_letters SET send_status = 1 WHERE id = ?', [letterId]);
      } catch (e) {
        console.error(`Generate letter for pair ${pair.id} failed:`, e);
      }
    }

    return success({ processed: pairs.length });
  } catch (err) {
    console.error('Generate weekly letter error:', err);
    return error(err.message || '生成失败');
  } finally {
    db.release();
  }
};
