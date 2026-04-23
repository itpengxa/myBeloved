const handlers = {
  requestSubscribe: require('./requestSubscribe/index.js'),
  updateSettings: require('./updateSettings/index.js'),
};

exports.main = async (event, context) => {
  const type = event.type || '';
  const handlerName = type.split('/')[1] || 'updateSettings';
  
  if (!handlers[handlerName]) {
    return { code: 404, success: false, message: '未知操作类型: ' + handlerName };
  }
  
  return handlers[handlerName].main(event, context);
};
