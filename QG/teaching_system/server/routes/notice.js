const { query } = require('../db');

async function handleAddNotice(req, res) {
  const { role, id, class: userClass } = req.user;
  if (role !== 'teacher') return res.status(403).json({ error: '仅班主任可发布通知' });
  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ error: '标题和内容不能为空' });
  try {
    const teacherClass = await query('SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?', [id]);
    if (!teacherClass.length) return res.status(400).json({ error: '您未绑定班级' });
    const classId = teacherClass[0].class_id;
    const r = await query('INSERT INTO tb_notices(title, text, writer, class_id) VALUES (?, ?, ?, ?)',
      [title.trim(), content.trim(), id, classId]);
    await query('INSERT INTO tb_operation_logs(user, movement, time) VALUES (?, ?, ?)',
      [id, 'ADD_NOTICE', new Date().toISOString()]);
    res.json({ code: 0, msg: '发布成功', data: { id: r.insertId } });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}

async function handleUpdateNotice(req, res) {
  const { role, id } = req.user;
  if (role !== 'teacher') return res.status(403).json({ error: '仅班主任可操作' });
  const { noticeId, title, content } = req.body;
  if (!noticeId || !title?.trim() || !content?.trim()) return res.status(400).json({ error: '参数错误' });
  try {
    const notice = await query('SELECT writer FROM tb_notices WHERE notice_id = ?', [noticeId]);
    if (!notice.length) return res.status(400).json({ error: '通知不存在' });
    if (notice[0].writer !== id) return res.status(403).json({ error: '只能修改自己发布的通知' });
    await query('UPDATE tb_notices SET title = ?, text = ? WHERE notice_id = ?', [title.trim(), content.trim(), noticeId]);
    await query('INSERT INTO tb_operation_logs(user, movement, time) VALUES (?, ?, ?)', [id, 'UPDATE_NOTICE', new Date().toISOString()]);
    res.json({ code: 0, msg: '修改成功' });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}

async function handleDeleteNotice(req, res) {
  const { role, id } = req.user;
  if (role !== 'teacher') return res.status(403).json({ error: '仅班主任可操作' });
  const { noticeId } = req.body;
  if (!noticeId) return res.status(400).json({ error: '通知ID不能为空' });
  try {
    const notice = await query('SELECT writer FROM tb_notices WHERE notice_id = ?', [noticeId]);
    if (!notice.length) return res.status(400).json({ error: '通知不存在' });
    if (notice[0].writer !== id) return res.status(403).json({ error: '只能删除自己发布的通知' });
    await query('DELETE FROM tb_notice_read WHERE notice_id = ?', [noticeId]);
    await query('DELETE FROM tb_notices WHERE notice_id = ?', [noticeId]);
    await query('INSERT INTO tb_operation_logs(user, movement, time) VALUES (?, ?, ?)', [id, 'DELETE_NOTICE', new Date().toISOString()]);
    res.json({ code: 0, msg: '删除成功' });
  } catch {
    res.status(500).json({ error: 'サーバー错误' });
  }
}

async function handleGetNotices(req, res) {
  const { role, id, class: userClass } = req.user;
  try {
    let sql, params = [];
    if (role === 'admin') {
      sql = `SELECT n.*, u.name as writer_name FROM tb_notices n LEFT JOIN tb_user u ON n.writer = u.id ORDER BY n.notice_id DESC`;
    } else {
      let classId = userClass;
      if (role === 'teacher') {
        const tc = await query('SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?', [id]);
        classId = tc[0]?.class_id;
      }
      sql = `SELECT n.*, u.name as writer_name, nr.time as read_time FROM tb_notices n
             LEFT JOIN tb_user u ON n.writer = u.id
             LEFT JOIN tb_notice_read nr ON n.notice_id = nr.notice_id AND nr.user_id = ?
             WHERE n.class_id = ? ORDER BY n.notice_id DESC`;
      params = [id, classId];
    }
    const notices = await query(sql, params);
    for (const n of notices) {
      const cnt = await query('SELECT COUNT(*) as total FROM tb_user WHERE class = ? AND role = ?', [n.class_id, 'student']);
      const readCnt = await query('SELECT COUNT(*) as count FROM tb_notice_read WHERE notice_id = ?', [n.notice_id]);
      n.totalCount = cnt[0].total;
      n.readCount = readCnt[0].count;
      n.isRead = !!n.read_time;
      delete n.read_time;
    }
    res.json({ code: 0, data: notices });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}

async function handleMarkRead(req, res) {
  const { role, id } = req.user;
  if (role !== 'student') return res.status(403).json({ error: '仅学生可标记已读' });
  const { noticeId } = req.body;
  if (!noticeId) return res.status(400).json({ error: '通知ID不能为空' });
  try {
    const exist = await query('SELECT * FROM tb_notice_read WHERE notice_id = ? AND user_id = ?', [noticeId, id]);
    if (!exist.length) {
      await query('INSERT INTO tb_notice_read(notice_id, user_id, time) VALUES (?, ?, ?)',
        [noticeId, id, new Date().toISOString()]);
    }
    res.json({ code: 0, msg: '标记成功' });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}

async function handleGetReadStatus(req, res) {
  const { role } = req.user;
  if (role !== 'teacher') return res.status(403).json({ error: '仅班主任可查看' });
  const noticeId = req.params.noticeId;
  if (!noticeId) return res.status(400).json({ error: '通知ID不能为空' });
  try {
    const readUsers = await query(`SELECT u.id, u.name, nr.time FROM tb_notice_read nr INNER JOIN tb_user u ON nr.user_id = u.id WHERE nr.notice_id = ?`, [noticeId]);
    const unreadUsers = await query(`SELECT u.id, u.name FROM tb_user u WHERE u.class = (SELECT class_id FROM tb_notices WHERE notice_id = ?) AND u.role = 'student' AND u.id NOT IN (SELECT user_id FROM tb_notice_read WHERE notice_id = ?)`, [noticeId, noticeId]);
    res.json({ code: 0, data: { read: readUsers, unread: unreadUsers } });
  } catch {
    res.status(500).json({ error: '服务器错误' });
  }
}

module.exports = {
  handleAddNotice,
  handleUpdateNotice,
  handleDeleteNotice,
  handleGetNotices,
  handleMarkRead,
  handleGetReadStatus
};