const handlers = {
  login: require('./login/index.js'),
  getProfile: require('./getProfile/index.js'),
  updateProfile: require('./updateProfile/index.js'),
};

exports.main = async (event, context) => {
  const type = event.type || '';
  const handlerName = type.split('/')[1] || 'login';
  
  if (!handlers[handlerName]) {
    return { code: 404, success: false, message: '未知操作类型: ' + handlerName };
  }
  
  return handlers[handlerName].main(event, context);
};
