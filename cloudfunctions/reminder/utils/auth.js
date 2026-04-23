const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/wx');

function verifyToken(token) {
  if (!token) {
    throw Object.assign(new Error('缺少token'), { code: 401 });
  }
  try {
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    throw Object.assign(new Error('token无效或已过期'), { code: 401 });
  }
}

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

module.exports = { verifyToken, signToken };
