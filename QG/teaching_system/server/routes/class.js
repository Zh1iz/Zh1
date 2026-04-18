const { query } = require('../db');
function checkAdmin(req, res) {
  if (req.user.role !== 'admin') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: '无权限,仅教导主任可操作' }));
    return false;
  }
  return true;
}
async function handleAddClass(req, res) {
  if (!checkAdmin(req, res)) return;
  const { className } = req.body;
  if (!className || typeof className !== 'string' || className.trim() === '') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.end(JSON.stringify({ error: '班级名称不能为空' }));
    return;
  }
  try {
    const checkSql = 'SELECT id FROM tb_classes WHERE class_name = ?';
    const existing = await query(checkSql, [className.trim()]);
    if (existing.length > 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      res.end(JSON.stringify({ error: '班级名称已存在' }));
      return;
    }
    const maxIdSql = 'SELECT MAX(id) as maxId FROM tb_classes';
    const maxIdResult = await query(maxIdSql);
    let newId = 101;
    if (maxIdResult[0].maxId) {
      newId = maxIdResult[0].maxId + 1;
    }
    const insertSql = 'INSERT INTO tb_classes(id,class_name) VALUES (?,?)';
    await query(insertSql, [newId, className.trim()]);
    const logSql = 'INSERT INTO tb_operation_logs(user,movement,time) VALUES (?,?,?)';
    await query(logSql, [req.user.id, 'ADD_CLASS', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '班级添加成功',
      data: {
        id: newId,
        className: className.trim()
      }
    }));
  } catch (err) {
    console.error('添加班级失败：', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleBindTeacher(req, res) {
  if (!checkAdmin(req, res)) return;
  const { classId, teacherId } = req.body;
  if (!classId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '班级ID不能为空' }));
    return;
  }
  try {
    const classSql = 'SELECT id, class_name FROM tb_classes WHERE id = ?';
    const classResult = await query(classSql, [classId]);

    if (classResult.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '班级不存在' }));
      return;
    }
    if (teacherId && teacherId.trim() !== '') {
      const teacherSql = 'SELECT id, name, role FROM tb_user WHERE id = ? AND role = ?';
      const teacherResult = await query(teacherSql, [teacherId, 'teacher']);
      if (teacherResult.length === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: '教师不存在或角色不是班主任' }));
        return;
      }
      const bindSql = 'SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?';
      const bindResult = await query(bindSql, [teacherId]);
      if (bindResult.length > 0 && bindResult[0].class_id != classId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: '该教师已绑定其他班级' }));
        return;
      }
      const deleteOldSql = 'DELETE FROM tb_class_teacher WHERE class_id = ?';
      await query(deleteOldSql, [classId]);
      const insertSql = 'INSERT INTO tb_class_teacher (class_id, teacher_id) VALUES (?, ?)';
      await query(insertSql, [classId, teacherId]);
      const updateUserSql = 'UPDATE tb_user SET class = ? WHERE id = ?';
      await query(updateUserSql, [classId, teacherId]);
    } else {
      const deleteSql = 'DELETE FROM tb_class_teacher WHERE class_id = ?';
      await query(deleteSql, [classId]);
      const updateUserSql = 'UPDATE tb_user SET class = NULL WHERE class = ? AND role = ?';
      await query(updateUserSql, [classId, 'teacher']);
    }
    const action = teacherId ? 'BIND_TEACHER' : 'UNBIND_TEACHER';
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [req.user.id, action, new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: teacherId ? '班主任绑定成功' : '班主任解绑成功'
    }));
  } catch (err) {
    console.error('绑定班主任失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleAddStudent(req, res) {
  if (!checkAdmin(req, res)) return;
  const { studentId, name, classId, password } = req.body;
  if (!studentId || !name || !classId || !password) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '学号、姓名、班级ID、密码不能为空' }));
    return;
  }
  try {
    const checkSql = 'SELECT id FROM tb_user WHERE id = ?';
    const existing = await query(checkSql, [studentId]);

    if (existing.length > 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '学号已存在' }));
      return;
    }
    const classSql = 'SELECT id FROM tb_classes WHERE id = ?';
    const classResult = await query(classSql, [classId]);

    if (classResult.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '班级不存在' }));
      return;
    }
    const insertSql = 'INSERT INTO tb_user (id, name, password, role, class) VALUES (?, ?, ?, ?, ?)';
    await query(insertSql, [studentId, name, password, 'student', classId]);
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [req.user.id, 'ADD_STUDENT', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '学生添加成功',
      data: {
        studentId,
        name,
        classId,
        role: 'student'
      }
    }));
  } catch (err) {
    console.error('添加学生失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleDeleteStudent(req, res) {
  if (!checkAdmin(req, res)) return;
  const { studentId } = req.body;
  if (!studentId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '学号不能为空' }));
    return;
  }
  try {
    const checkSql = 'SELECT id, name, role FROM tb_user WHERE id = ?';
    const result = await query(checkSql, [studentId]);
    if (result.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '学生不存在' }));
      return;
    }
    if (result[0].role !== 'student') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '该账号不是学生，无法删除' }));
      return;
    }
    const deleteScoreSql = 'DELETE FROM tb_scores WHERE student_id = ?';
    await query(deleteScoreSql, [studentId]);
    const deleteUserSql = 'DELETE FROM tb_user WHERE id = ?';
    await query(deleteUserSql, [studentId]);
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [req.user.id, 'DELETE_STUDENT', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '学生删除成功'
    }));
  } catch (err) {
    console.error('删除学生失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleGetClasses(req, res) {
  try {
    const { role, id, class: userClass } = req.user;
    let sql;
    let params = [];
    if (role === 'admin') {
      sql = `
        SELECT 
          c.id, 
          c.class_name,
          u.id as teacher_id,
          u.name as teacher_name
        FROM tb_classes c
        LEFT JOIN tb_class_teacher ct ON c.id = ct.class_id
        LEFT JOIN tb_user u ON ct.teacher_id = u.id
        ORDER BY c.id
      `;
    } else if (role === 'teacher') {
      sql = `
        SELECT 
          c.id, 
          c.class_name,
          u.id as teacher_id,
          u.name as teacher_name
        FROM tb_classes c
        INNER JOIN tb_class_teacher ct ON c.id = ct.class_id
        LEFT JOIN tb_user u ON ct.teacher_id = u.id
        WHERE ct.teacher_id = ?
        ORDER BY c.id
      `;
      params = [id];
    } else {
      sql = `
        SELECT 
          c.id, 
          c.class_name,
          u.id as teacher_id,
          u.name as teacher_name
        FROM tb_classes c
        LEFT JOIN tb_class_teacher ct ON c.id = ct.class_id
        LEFT JOIN tb_user u ON ct.teacher_id = u.id
        WHERE c.id = ?
      `;
      params = [userClass];
    }
    const classes = await query(sql, params);
    for (const cls of classes) {
      const countSql = 'SELECT COUNT(*) as count FROM tb_user WHERE class = ? AND role = ?';
      const countResult = await query(countSql, [cls.id, 'student']);
      cls.studentCount = countResult[0].count;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '获取成功',
      data: classes
    }));
  } catch (err) {
    console.error('获取班级列表失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleGetClassStudents(req, res) {
  const classId = req.params.classId;

  try {
    const sql = `
      SELECT id, name 
      FROM tb_user 
      WHERE class = ? AND role = 'student'
      ORDER BY id
    `;
    const students = await query(sql, [classId]);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '获取成功',
      data: students
    }));
  } catch (err) {
    console.error('获取学生列表失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
module.exports = {
  handleAddClass,
  handleBindTeacher,
  handleAddStudent,
  handleDeleteStudent,
  handleGetClasses,
  handleGetClassStudents
};