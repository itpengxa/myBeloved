function success(data = null, message = 'success') {
  return {
    code: 0,
    success: true,
    message,
    data,
    timestamp: Date.now()
  };
}

function error(message = 'error', code = 500) {
  return {
    code,
    success: false,
    message,
    data: null,
    timestamp: Date.now()
  };
}

module.exports = { success, error };
