const scoreModule = {
  classList: [],
  editing: null,

  async init() {
    await this.loadClasses();
    this.render();
    this.bindEvents();
  },

  async loadClasses() {
    try {
      const result = await request('/api/classes');
      if (result.code === 0) this.classList = result.data;
    } catch (err) {
      console.error('加载班级失败:', err);
    }
  },

  async loadScores() {
    const classId = document.getElementById('filterClass').value;
    const course = document.getElementById('filterCourse').value.trim();
    const studentId = document.getElementById('filterStudent').value.trim();

    let url = '/api/scores?';
    if (classId) url += `classId=${classId}&`;
    if (course) url += `course=${course}&`;
    if (studentId) url += `studentId=${studentId}&`;

    try {
      const result = await request(url);
      if (result.code === 0) this.renderTable(result.data);
    } catch (err) {
      console.error('加载成绩失败:', err);
      alert('加载成绩列表失败');
    }
  },

  render() {
    const user = auth.getUser();
    const filterClass = document.getElementById('filterClass');
    let options = '<option value="">全部班级</option>';
    this.classList.forEach(cls => {
      options += `<option value="${cls.id}">${cls.class_name}</option>`;
    });
    filterClass.innerHTML = options;
    if (user.role === 'teacher' && user.class) {
      filterClass.value = user.class;
    }
    this.loadScores();
  },

  renderTable(data) {
    const container = document.getElementById('scoreList');
    let html = `
      <table class="table">
        <thead>
          <tr><th>班级</th><th>学号</th><th>姓名</th><th>科目</th><th>成绩</th><th>操作</th></tr>
        </thead>
        <tbody>
    `;
    data.forEach(item => {
      html += `<tr><td>${item.class_name || ''}</td><td>${item.student_id}</td><td>${item.student_name}</td><td>${item.course}</td><td>${item.score}</td><td>`;
      if (auth.getUser().role !== 'student') {
        html += `<button class="btn btn-sm btn-primary" data-action="edit" data-student="${item.student_id}" data-course="${item.course}" data-score="${item.score}">编辑</button>`;
        html += `<button class="btn btn-sm btn-danger" data-action="delete" data-student="${item.student_id}" data-course="${item.course}">删除</button>`;
      }
      html += `</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  },
  bindEvents() {
    document.getElementById('searchBtn').addEventListener('click', () => this.loadScores());

    document.getElementById('addScoreBtn').addEventListener('click', () => {
      this.editing = null;
      document.getElementById('scoreStudentId').value = '';
      document.getElementById('scoreCourse').value = '';
      document.getElementById('scoreValue').value = '';
      document.getElementById('scoreWindow').style.display = 'flex';
    });

    document.getElementById('statisticsBtn').addEventListener('click', () => this.showStatistics());
    document.getElementById('exportBtn').addEventListener('click', () => this.exportScores());
    document.getElementById('saveScoreBtn').addEventListener('click', () => this.saveScore());

    document.getElementById('scoreWindowClose').addEventListener('click', () => {
      document.getElementById('scoreWindow').style.display = 'none';
    });

    document.getElementById('statsWindowClose').addEventListener('click', () => {
      document.getElementById('statisticsWindow').style.display = 'none';
    });

    document.getElementById('scoreWindow').addEventListener('click', (e) => {
      if (e.target.id === 'scoreWindow') {
        document.getElementById('scoreWindow').style.display = 'none';
      }
    });

    document.getElementById('statisticsWindow').addEventListener('click', (e) => {
      if (e.target.id === 'statisticsWindow') {
        document.getElementById('statisticsWindow').style.display = 'none';
      }
    });

    document.getElementById('batchAddScoreBtn').addEventListener('click', () => {
      document.getElementById('batchFileInput').click();
    });

    document.getElementById('batchFileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target.result;
          let scores = [];

          if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').slice(1);
            lines.forEach(line => {
              if (line.trim()) {
                const parts = line.split(',').map(s => s.trim());
                if (parts.length >= 3) {
                  scores.push({
                    studentId: parts[0],
                    course: parts[1],
                    score: parseInt(parts[2])
                  });
                }
              }
            });
          } else if (file.name.endsWith('.json')) {
            scores = JSON.parse(content);
          } else if (file.name.endsWith('.txt')) {
            const lines = content.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                  scores.push({
                    studentId: parts[0],
                    course: parts[1],
                    score: parseInt(parts[2])
                  });
                }
              }
            });
          }

          if (scores.length > 0) {
            const result = await request('/api/score/batch', {
              method: 'POST',
              body: JSON.stringify({ scores })
            });

            if (result.code === 0) {
              alert(`导入完成：成功 ${result.data.success.length} 条，失败 ${result.data.fail.length} 条`);
              this.loadScores();
            } else {
              alert(result.error || '导入失败');
            }
          } else {
            alert('未解析到有效数据');
          }
        } catch (err) {
          console.error('批量导入失败:', err);
          alert('文件解析失败');
        }
        e.target.value = '';
      };

      reader.readAsText(file, 'UTF-8');
    });

    document.getElementById('scoreList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, student, course, score } = btn.dataset;
      if (action === 'edit') {
        this.editing = { student, course };
        document.getElementById('scoreStudentId').value = student;
        document.getElementById('scoreCourse').value = course;
        document.getElementById('scoreValue').value = score;
        document.getElementById('scoreWindow').style.display = 'flex';
      } else if (action === 'delete' && confirm('确定删除？')) {
        this.deleteScore(student, course);
      }
    });
  },
  async saveScore() {
    const studentId = document.getElementById('scoreStudentId').value.trim();
    const course = document.getElementById('scoreCourse').value.trim();
    const score = parseInt(document.getElementById('scoreValue').value);

    if (!studentId || !course || isNaN(score)) {
      alert('请填写完整信息');
      return;
    }
    if (score < 0 || score > 100) {
      alert('成绩必须在0-100之间');
      return;
    }

    try {
      const url = '/api/score';
      const method = this.editing ? 'PUT' : 'POST';
      const result = await request(url, {
        method,
        body: JSON.stringify({ studentId, course, score })
      });

      if (result.code === 0) {
        alert(result.msg);
        document.getElementById('scoreModal').style.display = 'none';
        this.loadScores();
      } else {
        alert(result.error || '操作失败');
      }
    } catch {
      alert('网络错误');
    }
  },

  async deleteScore(studentId, course) {
    try {
      const result = await request('/api/score', {
        method: 'DELETE',
        body: JSON.stringify({ studentId, course })
      });
      if (result.code === 0) {
        alert(result.msg);
        this.loadScores();
      } else {
        alert(result.error || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  },

  async showStatistics() {
    const classId = document.getElementById('filterClass').value;
    const course = document.getElementById('filterCourse').value.trim();
    let url = '/api/score/statistics?';
    if (classId) url += `classId=${classId}&`;
    if (course) url += `course=${course}&`;

    try {
      const result = await request(url);
      if (result.code === 0) {
        const d = result.data;
        document.getElementById('statisticsContent').innerHTML = `
        <p>总人数：${d.totalCount}</p>
        <p>平均分：${d.avgScore}</p>
        <p>最高分：${d.maxScore}</p>
        <p>最低分：${d.minScore}</p>
        <p>及格人数：${d.passCount}</p>
        <p>及格率：${d.passRate}%</p>
      `;
        document.getElementById('statisticsWindow').style.display = 'flex';
      } else {
        alert(result.error || '获取统计失败');
      }
    } catch (err) {
      console.error('统计错误:', err);
      alert('网络错误');
    }
  },

  async exportScores() {
    const classId = document.getElementById('filterClass').value;
    const course = document.getElementById('filterCourse').value.trim();
    let url = '/api/score/export?';
    if (classId) url += `classId=${classId}&`;
    if (course) url += `course=${course}&`;

    const token = auth.getToken();
    const response = await fetch(`http://localhost:3000${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await response.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scores.csv';
    a.click();
  }
};

window.scoreModule = scoreModule;