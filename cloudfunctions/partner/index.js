const handlers = {
  generateCode: require('./generateCode/index.js'),
  bindByCode: require('./bindByCode/index.js'),
  getStatus: require('./getStatus/index.js'),
  unbind: require('./unbind/index.js'),
};

exports.main = async (event, context) => {
  const type = event.type || '';
  const handlerName = type.split('/')[1] || 'getStatus';
  
  if (!handlers[handlerName]) {
    return { code: 404, success: false, message: '未知操作类型: ' + handlerName };
  }
  
  return handlers[handlerName].main(event, context);
};
