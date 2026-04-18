const logModule = {
  async init() {
    await this.loadLogs();
  },

  async loadLogs() {
    try {
      const result = await request('/api/logs');
      if (result.code === 0) this.render(result.data);
    } catch (err) {
      console.error('加载日志失败:', err);
      alert('加载日志失败');
    }
  },

  render(logs) {
    const container = document.getElementById('logList');
    let html = `
      <table class="table">
        <thead>
          <tr><th>操作人</th><th>操作类型</th><th>操作时间</th></tr>
        </thead>
        <tbody>
    `;

    logs.forEach(log => {
      html += `<tr><td>${log.user_name || log.user}</td><td>${log.movement}</td><td>${new Date(log.time).toLocaleString()}</td></tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html || '<p>暂无日志</p>';
  }
};

window.logModule = logModule;