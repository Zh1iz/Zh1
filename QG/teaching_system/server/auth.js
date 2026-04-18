const jwt = require('jsonwebtoken');
const config = require('./config');
function generateToken(user) {
  const payLoad = {
    id: user.id,
    name: user.name,
    role: user.role,
    class: user.class
  }
  return jwt.sign(payLoad, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
}
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: '未提供认证令牌' }));
    return;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: '令牌无效或已过期' }));
  }
}
module.exports = {
  generateToken,
  verifyToken
};