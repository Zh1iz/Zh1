const classModule = {
  classList: [],
  teacherList: [],
  currentClassId: null,
  async init() {
    const user = auth.getUser();
    if (user.role !== 'admin') {
      document.getElementById('classPage').style.display = 'none';
      return;
    }
    await this.loadTeachers();
    await this.loadClasses();
    this.render();
    this.bindEvents();
  },
  async loadClasses() {
    try {
      const result = await request('/api/classes');
      if (result.code === 0) {
        this.classList = result.data;
      }
    } catch (err) {
      console.error('加载班级失败:', err);
      alert('加载班级列表失败');
    }
  },
  async loadTeachers() {
    try {
      const result = await request('/api/scores');
      const teachers = [];
      const teacherIds = new Set();

      if (result.code === 0) {
        result.data.forEach(item => {
          if (item.teacher_id && !teacherIds.has(item.teacher_id)) {
            teacherIds.add(item.teacher_id);
            teachers.push({
              id: item.teacher_id,
              name: item.teacher_name
            });
          }
        });
      }
      this.teacherList = teachers;
    } catch (err) {
      console.error('加载教师失败:', err);
    }
  },
  render() {
    const container = document.getElementById('classList');
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>班级ID</th>
            <th>班级名称</th>
            <th>班主任</th>
            <th>学生人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
    `;
    this.classList.forEach(cls => {
      html += `
        <tr>
          <td>${cls.id}</td>
          <td>${cls.class_name}</td>
          <td>${cls.teacher_name || '未绑定'}</td>
          <td>${cls.studentCount || 0}</td>
          <td>
            ${cls.teacher_id
          ? `<button class="btn btn-sm btn-primary" data-action="manage" data-id="${cls.id}" data-name="${cls.class_name}">管理</button>`
          : `<button class="btn btn-sm btn-outline" data-action="bind" data-id="${cls.id}">绑定班主任</button>`
        }
          </td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  },
  async handleGetClassStudents(req, res) {
    const classId = req.params.classId;

    try {
      const sql = `
      SELECT id, name 
      FROM tb_user 
      WHERE class = ? AND role = 'student'
      ORDER BY id
    `;
      const students = await query(sql, [classId]);

      res.json({
        code: 0,
        msg: '获取成功',
        data: students
      });
    } catch (err) {
      console.error('获取学生列表失败:', err);
      res.status(500).json({ error: '服务器错误' });
    }
  },
  async renderStudentList(classId, className) {
    this.currentClassId = classId;
    document.getElementById('windowClassName').textContent = className;

    try {
      const result = await request(`/api/class/${classId}/students`);
      const tbody = document.getElementById('studentList');

      if (result.code === 0 && result.data.length > 0) {
        let html = '';
        result.data.forEach(student => {
          html += `
          <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>
              <button class="btn btn-sm btn-danger" data-action="deleteStudent" data-id="${student.id}">删除</button>
            </td>
          </tr>
        `;
        });
        tbody.innerHTML = html;
      } else {
        tbody.innerHTML = '<tr><td colspan="3">暂无学生</td></tr>';
      }

      document.getElementById('studentWindow').style.display = 'flex';
    } catch (err) {
      console.error('加载学生失败:', err);
      alert('加载学生列表失败');
    }
  },
  bindEvents() {
    document.getElementById('addClassBtn').addEventListener('click', () => {
      this.showAddClassModal();
    });
    document.getElementById('classList').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const classId = btn.dataset.id;
      const className = btn.dataset.name;
      if (action === 'manage') {
        await this.renderStudentList(classId, className);
      } else if (action === 'bind') {
        this.showBindTeacherModal(classId);
      } else if (action === 'deleteStudent') {
        const studentId = btn.dataset.id;
        if (confirm(`确定要删除学生 ${studentId} 吗？`)) {
          await this.deleteStudent(studentId);
        }
      }
    });
    document.querySelector('.window-close').addEventListener('click', () => {
      document.getElementById('studentWindow').style.display = 'none';
    });
    document.getElementById('studentWindow').addEventListener('click', (e) => {
      if (e.target.id === 'studentWindow') {
        document.getElementById('studentWindow').style.display = 'none';
      }
    });
    document.getElementById('addStudentBtn').addEventListener('click', () => {
      this.showAddStudentModal();
    });
  },
  showAddClassModal() {
    const className = prompt('请输入班级名称：');
    if (className && className.trim()) {
      this.addClass(className.trim());
    }
  },
  async addClass(className) {
    try {
      const result = await request('/api/class', {
        method: 'POST',
        body: JSON.stringify({ className })
      });
      if (result.code === 0) {
        alert(result.msg);
        await this.loadClasses();
        this.render();
      } else {
        alert(result.error || '添加失败');
      }
    } catch (err) {
      console.error('添加班级失败:', err);
      alert('网络错误，请稍后重试');
    }
  },
  showBindTeacherModal(classId) {
    if (this.teacherList.length === 0) {
      alert('暂无可用教师');
      return;
    }
    let options = '0: 解绑班主任\n';
    this.teacherList.forEach(t => {
      options += `${t.id}: ${t.name}\n`;
    });
    const input = prompt(options + '\n请输入教师ID（输入0解绑）：');
    if (input !== null) {
      const teacherId = input.trim();
      if (teacherId === '0') {
        this.bindTeacher(classId, '');
      } else if (this.teacherList.some(t => t.id === teacherId)) {
        this.bindTeacher(classId, teacherId);
      } else {
        alert('无效的教师ID');
      }
    }
  },
  async bindTeacher(classId, teacherId) {
    try {
      const result = await request('/api/class/teacher', {
        method: 'PUT',
        body: JSON.stringify({ classId: parseInt(classId), teacherId: teacherId || null })
      });
      if (result.code === 0) {
        alert(result.msg);
        await this.loadClasses();
        this.render();
      } else {
        alert(result.error || '操作失败');
      }
    } catch (err) {
      console.error('绑定班主任失败:', err);
      alert('网络错误，请稍后重试');
    }
  },
  showAddStudentModal() {
    const studentId = prompt('请输入学号：');
    if (!studentId) return;
    const name = prompt('请输入姓名：');
    if (!name) return;
    const password = prompt('请输入密码（默认123456）：') || '123456';
    this.addStudent({
      studentId: studentId.trim(),
      name: name.trim(),
      classId: this.currentClassId,
      password
    });
  },
  async addStudent(studentData) {
    try {
      const result = await request('/api/class/student', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });
      if (result.code === 0) {
        alert(result.msg);
        await this.renderStudentList(this.currentClassId, document.getElementById('windowClassName').textContent);
      } else {
        alert(result.error || '添加失败');
      }
    } catch (err) {
      console.error('添加学生失败:', err);
      alert('网络错误，请稍后重试');
    }
  },
  async deleteStudent(studentId) {
    try {
      const result = await request('/api/class/student', {
        method: 'DELETE',
        body: JSON.stringify({ studentId })
      });
      if (result.code === 0) {
        alert(result.msg);
        await this.loadClasses();
        await this.renderStudentList(this.currentClassId, document.getElementById('modalClassName').textContent);
      } else {
        alert(result.error || '删除失败');
      }
    } catch (err) {
      console.error('删除学生失败:', err);
      alert('网络错误，请稍后重试');
    }
  }
};
window.classModule = classModule;
