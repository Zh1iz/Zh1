const { verifyToken } = require('../auth');
async function handleUser(req, res) {
  verifyToken(req, res, () => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '获取成功',
      data: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
        class: req.user.class
      }
    }));
  });
}
module.exports = { handleUser };