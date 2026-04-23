const handlers = {
  create: require('./create/index.js'),
  list: require('./list/index.js'),
  update: require('./update/index.js'),
  delete: require('./delete/index.js'),
};

exports.main = async (event, context) => {
  const type = event.type || '';
  const handlerName = type.split('/')[1] || 'list';
  
  if (!handlers[handlerName]) {
    return { code: 404, success: false, message: '未知操作类型: ' + handlerName };
  }
  
  return handlers[handlerName].main(event, context);
};
