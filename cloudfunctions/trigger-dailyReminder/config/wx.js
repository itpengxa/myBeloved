module.exports = {
  appId: process.env.WX_APPID,
  secret: process.env.WX_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '7d'
};
