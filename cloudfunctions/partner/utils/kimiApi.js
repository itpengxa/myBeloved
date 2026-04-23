const axios = require('axios');

const apiKey = process.env.KIMI_API_KEY;
const baseURL = 'https://api.moonshot.cn/v1';

function buildLetterPrompt(userMoments, partnerInfo, location, style = 'romantic') {
  const momentSummaries = userMoments.map(m => {
    const date = new Date(m.created_at);
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    return `【${dateStr}】${m.content?.substring(0, 50) || '上传了照片'} ${m.mood ? `（心情：${m.mood}）` : ''}`;
  }).join('\n');

  const stylePrompts = {
    romantic: '浪漫深情，像散文诗一样优美',
    poetic: '古典诗意，引用诗词典故',
    playful: '活泼俏皮，带点幽默和撒娇',
    warm: '温暖治愈，像冬日阳光'
  };

  return `你是一位专业的情感文案师，擅长为情侣撰写真挚动人的情书。
请根据以下信息，为"${partnerInfo.nickname || '心上人'}"写一封情书：

【用户近7天生活点滴】
${momentSummaries || '（用户这周没有记录点滴，请写一封表达思念和关心的信）'}

【风格要求】${stylePrompts[style] || stylePrompts.romantic}
【地理位置】${location || '未知城市'}
【字数】200-300字
【要求】
1. 结合生活点滴中的细节，让情书有真实感和专属感
2. 如果没有点滴，则表达思念和期待见面的心情
3. 结尾要有温暖的祝福或约定
4. 不要出现AI、机器人等字样，要像真人写的
5. 适当使用emoji增加生动性

请直接输出情书正文，不要有任何前缀说明。`;
}

function buildRecommendationPrompt(location, weather) {
  return `你是本地生活专家，请为情侣推荐以下内容（地点：${location || '北京'}）：

1. 一道适合情侣共享的当地美食（含具体餐厅名）
2. 一项当地适合情侣的娱乐活动（含具体地点）
3. 两件这周最适合情侣一起做的事

请用JSON格式输出：
{
  "food": {"name": "美食名称", "restaurant": "推荐餐厅", "reason": "推荐理由"},
  "activity": {"name": "活动名称", "location": "具体地点", "reason": "推荐理由"},
  "todos": ["事项1（具体可执行）", "事项2（具体可执行）"]
}`;
}

async function generateLetter(prompt, temperature = 0.7) {
  const response = await axios.post(`${baseURL}/chat/completions`, {
    model: 'moonshot-v1-8k',
    messages: [
      { role: 'system', content: '你是一位专业的情感文案师，擅长撰写真挚动人的情书和情侣建议。' },
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: 800
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

async function generateRecommendations(prompt) {
  const content = await generateLetter(prompt, 0.5);
  try {
    return JSON.parse(content);
  } catch (e) {
    return parseRecommendationsFallback(content);
  }
}

function parseRecommendationsFallback(content) {
  const foodMatch = content.match(/美食[：:](.+)/);
  const activityMatch = content.match(/活动[：:](.+)/);
  return {
    food: { name: foodMatch?.[1]?.trim() || '本地特色菜', restaurant: '推荐餐厅', reason: '适合情侣' },
    activity: { name: activityMatch?.[1]?.trim() || '看电影', location: '市中心', reason: '浪漫约会' },
    todos: ['一起做饭', '散步聊天']
  };
}

module.exports = {
  buildLetterPrompt,
  buildRecommendationPrompt,
  generateLetter,
  generateRecommendations
};
