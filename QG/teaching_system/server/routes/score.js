const { query } = require('../db');
function checkTeacherOrAdmin(req, res) {
  const { role } = req.user;
  if (role !== 'admin' && role !== 'teacher') {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '无权限，仅教务主任和班主任可操作' }));
    return false;
  }
  return true;
}
async function checkStudentInTeacherClass(teacherId, studentId) {
  const sql = `
    SELECT u.class 
    FROM tb_user u 
    INNER JOIN tb_class_teacher ct ON u.class = ct.class_id 
    WHERE u.id = ? AND ct.teacher_id = ?
  `;
  const result = await query(sql, [studentId, teacherId]);
  return result.length > 0;
}
async function handleAddScore(req, res) {
  if (!checkTeacherOrAdmin(req, res)) return;
  const { studentId, course, score } = req.body;
  const { role, id } = req.user;
  if (!studentId || !course || score === undefined) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '学号、科目、成绩不能为空' }));
    return;
  }
  if (score < 0 || score > 100) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '成绩必须在0-100之间' }));
    return;
  }
  try {
    const studentSql = 'SELECT id, name, class FROM tb_user WHERE id = ? AND role = ?';
    const studentResult = await query(studentSql, [studentId, 'student']);
    if (studentResult.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '学生不存在' }));
      return;
    }
    if (role === 'teacher') {
      const inClass = await checkStudentInTeacherClass(id, studentId);
      if (!inClass) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: '该学生不在您的班级' }));
        return;
      }
    }
    const insertSql = 'INSERT INTO tb_scores (student_id, course, score) VALUES (?, ?, ?)';
    await query(insertSql, [studentId, course, score]);
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [id, 'ADD_SCORE', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '成绩录入成功',
      data: { studentId, course, score }
    }));
  } catch (err) {
    console.error('录入成绩失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleBatchAddScore(req, res) {
  if (!checkTeacherOrAdmin(req, res)) return;
  const { scores } = req.body;
  const { role, id } = req.user;
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '成绩数据不能为空' }));
    return;
  }
  try {
    const successList = [];
    const failList = [];
    for (const item of scores) {
      const { studentId, course, score } = item;
      if (!studentId || !course || score === undefined || score < 0 || score > 100) {
        failList.push({ studentId, course, reason: '数据格式错误' });
        continue;
      }
      const studentSql = 'SELECT id FROM tb_user WHERE id = ? AND role = ?';
      const studentResult = await query(studentSql, [studentId, 'student']);
      if (studentResult.length === 0) {
        failList.push({ studentId, course, reason: '学生不存在' });
        continue;
      }
      if (role === 'teacher') {
        const inClass = await checkStudentInTeacherClass(id, studentId);
        if (!inClass) {
          failList.push({ studentId, course, reason: '学生不在您的班级' });
          continue;
        }
      }
      const insertSql = 'INSERT INTO tb_scores (student_id, course, score) VALUES (?, ?, ?)';
      await query(insertSql, [studentId, course, score]);
      successList.push({ studentId, course, score });
    }
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [id, 'BATCH_ADD_SCORE', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '批量录入完成',
      data: { success: successList, fail: failList }
    }));
  } catch (err) {
    console.error('批量录入成绩失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleGetScores(req, res) {
  const { role, id, class: userClass } = req.user;
  const { classId, course, studentId } = req.query;
  try {
    let sql = `
      SELECT 
        s.student_id,
        u.name as student_name,
        u.class as class_id,
        c.class_name,
        s.course,
        s.score
      FROM tb_scores s
      INNER JOIN tb_user u ON s.student_id = u.id
      LEFT JOIN tb_classes c ON u.class = c.id
      WHERE 1=1
    `;
    const params = [];
    if (role === 'teacher') {
      sql += ' AND u.class IN (SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?)';
      params.push(id);
    } else if (role === 'student') {
      sql += ' AND s.student_id = ?';
      params.push(id);
    }
    if (classId) {
      sql += ' AND u.class = ?';
      params.push(classId);
    }
    if (course) {
      sql += ' AND s.course = ?';
      params.push(course);
    }
    if (studentId) {
      sql += ' AND s.student_id = ?';
      params.push(studentId);
    }
    sql += ' ORDER BY s.student_id, s.course';
    const scores = await query(sql, params);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '获取成功',
      data: scores
    }));
  } catch (err) {
    console.error('查询成绩失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleUpdateScore(req, res) {
  if (!checkTeacherOrAdmin(req, res)) return;
  const { studentId, course, score } = req.body;
  const { role, id } = req.user;
  if (!studentId || !course || score === undefined) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '学号、科目、成绩不能为空' }));
    return;
  }
  if (score < 0 || score > 100) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '成绩必须在0-100之间' }));
    return;
  }
  try {
    if (role === 'teacher') {
      const inClass = await checkStudentInTeacherClass(id, studentId);
      if (!inClass) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: '该学生不在您的班级' }));
        return;
      }
    }
    const updateSql = 'UPDATE tb_scores SET score = ? WHERE student_id = ? AND course = ?';
    const result = await query(updateSql, [score, studentId, course]);
    if (result.affectedRows === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '成绩记录不存在' }));
      return;
    }
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [id, 'UPDATE_SCORE', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '成绩修改成功',
      data: { studentId, course, score }
    }));
  } catch (err) {
    console.error('修改成绩失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleDeleteScore(req, res) {
  if (!checkTeacherOrAdmin(req, res)) return;
  const { studentId, course } = req.body;
  const { role, id } = req.user;
  if (!studentId || !course) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '学号和科目不能为空' }));
    return;
  }
  try {
    if (role === 'teacher') {
      const inClass = await checkStudentInTeacherClass(id, studentId);
      if (!inClass) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: '该学生不在您的班级' }));
        return;
      }
    }
    const deleteSql = 'DELETE FROM tb_scores WHERE student_id = ? AND course = ?';
    const result = await query(deleteSql, [studentId, course]);
    if (result.affectedRows === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '成绩记录不存在' }));
      return;
    }
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [id, 'DELETE_SCORE', new Date().toISOString()]);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      code: 0,
      msg: '成绩删除成功'
    }));
  } catch (err) {
    console.error('删除成绩失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
async function handleGetStatistics(req, res) {
  const { role, id } = req.user;
  const { classId, course } = req.query;

  try {
    let sql = `
      SELECT 
        COUNT(*) as totalCount,
        AVG(score) as avgScore,
        MAX(score) as maxScore,
        MIN(score) as minScore,
        SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END) as passCount
      FROM tb_scores s
      INNER JOIN tb_user u ON s.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'teacher') {
      sql += ' AND u.class IN (SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?)';
      params.push(id);
    } else if (role === 'student') {
      sql += ' AND s.student_id = ?';
      params.push(id);
    }

    if (classId && classId !== '') {
      sql += ' AND u.class = ?';
      params.push(parseInt(classId));
    }

    if (course && course !== '') {
      sql += ' AND s.course = ?';
      params.push(course);
    }

    const result = await query(sql, params);
    const stats = result[0] || { totalCount: 0, avgScore: 0, maxScore: 0, minScore: 0, passCount: 0 };

    const passRate = stats.totalCount > 0
      ? ((stats.passCount / stats.totalCount) * 100).toFixed(1)
      : 0;

    res.json({
      code: 0,
      msg: '获取成功',
      data: {
        avgScore: (stats.avgScore !== null && stats.avgScore !== undefined) ? parseFloat(Number(stats.avgScore).toFixed(2)) : 0,
        maxScore: stats.maxScore || 0,
        minScore: stats.minScore || 0,
        passCount: stats.passCount || 0,
        passRate: parseFloat(passRate),
        totalCount: stats.totalCount || 0
      }
    });
  } catch (err) {
    console.error('获取统计失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
}
async function handleExportScores(req, res) {
  const { role, id } = req.user;
  const { classId, course } = req.query;
  try {
    let sql = `
      SELECT 
        u.class as class_id,
        c.class_name,
        s.student_id,
        u.name as student_name,
        s.course,
        s.score
      FROM tb_scores s
      INNER JOIN tb_user u ON s.student_id = u.id
      LEFT JOIN tb_classes c ON u.class = c.id
      WHERE 1=1
    `;
    const params = [];
    if (role === 'teacher') {
      sql += ' AND u.class IN (SELECT class_id FROM tb_class_teacher WHERE teacher_id = ?)';
      params.push(id);
    }
    if (classId) {
      sql += ' AND u.class = ?';
      params.push(classId);
    }
    if (course) {
      sql += ' AND s.course = ?';
      params.push(course);
    }
    sql += ' ORDER BY u.class, s.student_id, s.course';
    const scores = await query(sql, params);
    let csv = '\uFEFF班级ID,班级名称,学号,姓名,科目,成绩\n';
    for (const row of scores) {
      csv += `${row.class_id || ''},${row.class_name || ''},${row.student_id},${row.student_name},${row.course},${row.score}\n`;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="scores.csv"');
    res.end(csv);
    const logSql = 'INSERT INTO tb_operation_logs (user, movement, time) VALUES (?, ?, ?)';
    await query(logSql, [id, 'EXPORT_SCORE', new Date().toISOString()]);
  } catch (err) {
    console.error('导出成绩失败:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '服务器错误' }));
  }
}
module.exports = {
  handleAddScore,
  handleBatchAddScore,
  handleGetScores,
  handleUpdateScore,
  handleDeleteScore,
  handleGetStatistics,
  handleExportScores
};