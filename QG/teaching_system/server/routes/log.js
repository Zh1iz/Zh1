const { query } = require('../db');

async function handleGetLogs(req, res) {
  const { role, id, class: userClass } = req.user;
  try {
    let sql, params = [];
    if (role === 'admin') {
      sql = `SELECT l.*, u.name as user_name FROM tb_operation_logs l LEFT JOIN tb_user u ON l.user = u.id ORDER BY l.time DESC`;
    } else if (role === 'teacher') {
      sql = `SELECT l.*, u.name as user_name FROM tb_operation_logs l LEFT JOIN tb_user u ON l.user = u.id
             WHERE l.user IN (SELECT id FROM tb_user WHERE class IN (SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?)) ORDER BY l.time DESC`;
      params = [id];
    } else {
      return res.status(403).json({ error: '无权限' });
    }
    const logs = await query(sql, params);
    res.json({ code: 0, data: logs });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}

module.exports = { handleGetLogs };