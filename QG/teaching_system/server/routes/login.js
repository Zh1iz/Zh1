const { query } = require('../db');
const { generateToken } = require('../auth');
async function handleLogin(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  try {
    const users = await query('SELECT * FROM tb_user WHERE id = ? AND password = ?', [username, password]);
    if (!users.length) return res.status(401).json({ error: '用户名或密码错误' });
    const user = users[0];
    const token = generateToken(user);
    res.json({
      code: 0, msg: '登录成功',
      data: { token, user: { id: user.id, name: user.name, role: user.role, class: user.class } }
    });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}
module.exports = { handleLogin };