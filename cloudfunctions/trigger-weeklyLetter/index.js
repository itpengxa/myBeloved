// 复用 generateWeekly 云函数逻辑
const { main: generateWeekly } = require('./letter/generateWeekly/index');

exports.main = async (event, context) => {
  return generateWeekly(event, context);
};
