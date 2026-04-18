const noticeModule = {
  notices: [],
  editingId: null,

  async init() {
    await this.loadNotices();
    this.render();
    this.bindEvents();
  },

  async loadNotices() {
    try {
      const result = await request('/api/notices');
      if (result.code === 0) this.notices = result.data;
    } catch (err) {
      console.error('加载通知失败:', err);
      alert('加载通知列表失败');
    }
  },

  render() {
    const user = auth.getUser();
    const container = document.getElementById('noticeList');

    this.notices.sort((a, b) => {
      if (a.isRead === b.isRead) return 0;
      return a.isRead ? 1 : -1;
    });

    let html = '';

    this.notices.forEach(n => {
      html += `<div class="notice-card ${n.isRead ? '' : 'unread'}">`;
      html += `<h3>${n.title} ${!n.isRead ? '🔴' : ''}</h3>`;
      html += `<div class="notice-meta">发布：${n.writer_name} | 已读：${n.readCount}/${n.totalCount}</div>`;
      html += `<p>${n.text}</p>`;

      if (user.role === 'teacher' && n.writer === user.id) {
        html += `<div class="notice-actions">`;
        html += `<button class="btn btn-sm btn-primary" data-action="editNotice" data-id="${n.notice_id}" data-title="${n.title}" data-text="${n.text}">编辑</button>`;
        html += `<button class="btn btn-sm btn-danger" data-action="deleteNotice" data-id="${n.notice_id}">删除</button>`;
        html += `<button class="btn btn-sm btn-outline" data-action="viewRead" data-id="${n.notice_id}">查看已读</button>`;
        html += `</div>`;
      }

      if (user.role === 'student' && !n.isRead) {
        html += `<div class="notice-actions">`;
        html += `<button class="btn btn-sm btn-primary" data-action="markRead" data-id="${n.notice_id}">标记已读</button>`;
        html += `</div>`;
      }

      html += `</div>`;
    });

    container.innerHTML = html || '<p>暂无通知</p>';

    if (user.role !== 'teacher') {
      document.getElementById('addNoticeBtn').style.display = 'none';
    }
  },

  bindEvents() {
    document.getElementById('addNoticeBtn').onclick = () => {
      this.editingId = null;
      document.getElementById('noticeWindowTitle').textContent = '发布通知';
      document.getElementById('noticeTitle').value = '';
      document.getElementById('noticeContent').value = '';
      document.getElementById('noticeWindow').style.display = 'flex';
    };

    document.getElementById('saveNoticeBtn').onclick = () => this.saveNotice();
    document.getElementById('noticeWindowClose').onclick = () => document.getElementById('noticeWindow').style.display = 'none';
    document.getElementById('readStatusClose').onclick = () => document.getElementById('readStatusWindow').style.display = 'none';
    document.getElementById('noticeDetailClose').onclick = () => document.getElementById('noticeDetailWindow').style.display = 'none';

    document.getElementById('noticeList').addEventListener('click', async (e) => {
      const card = e.target.closest('.notice-card');
      if (!card) return;

      const btn = e.target.closest('[data-action]');
      if (btn) {
        const { action, id, title, text } = btn.dataset;
        if (action === 'editNotice') {
          this.editingId = id;
          document.getElementById('noticeWindowTitle').textContent = '编辑通知';
          document.getElementById('noticeTitle').value = title;
          document.getElementById('noticeContent').value = text;
          document.getElementById('noticeWindow').style.display = 'flex';
        } else if (action === 'deleteNotice' && confirm('确定删除？')) {
          await request('/api/notice', { method: 'DELETE', body: JSON.stringify({ noticeId: +id }) });
          await this.loadNotices();
          this.render();
        } else if (action === 'viewRead') {
          const result = await request(`/api/notice/read/${id}`);
          if (result.code === 0) {
            document.getElementById('readList').innerHTML = result.data.read.map(u => `<li>${u.name}(${u.id})</li>`).join('');
            document.getElementById('unreadList').innerHTML = result.data.unread.map(u => `<li>${u.name}(${u.id})</li>`).join('');
            document.getElementById('readStatusWindow').style.display = 'flex';
          }
        } else if (action === 'markRead') {
          await request('/api/notice/read', { method: 'POST', body: JSON.stringify({ noticeId: +id }) });
          await this.loadNotices();
          this.render();
        }
        return;
      }

      const noticeId = card.querySelector('[data-action]')?.dataset.id;
      if (!noticeId) return;

      const notice = this.notices.find(n => n.notice_id == noticeId);
      if (!notice) return;

      document.getElementById('noticeDetailTitle').textContent = notice.title;
      document.getElementById('noticeDetailMeta').textContent = `发布：${notice.writer_name} | 已读：${notice.readCount}/${notice.totalCount}`;
      document.getElementById('noticeDetailContent').textContent = notice.text;
      document.getElementById('noticeDetailWindow').style.display = 'flex';

      const user = auth.getUser();
      if (user.role === 'student' && !notice.isRead) {
        await request('/api/notice/read', { method: 'POST', body: JSON.stringify({ noticeId: +noticeId }) });
        await this.loadNotices();
        this.render();
      }
    });

    document.getElementById('noticeWindow').onclick = (e) => {
      if (e.target.id === 'noticeWindow') document.getElementById('noticeWindow').style.display = 'none';
    };
    document.getElementById('noticeDetailWindow').onclick = (e) => {
      if (e.target.id === 'noticeDetailWindow') document.getElementById('noticeDetailWindow').style.display = 'none';
    };
    document.getElementById('readStatusWindow').onclick = (e) => {
      if (e.target.id === 'readStatusWindow') document.getElementById('readStatusWindow').style.display = 'none';
    };
  },

  async saveNotice() {
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();

    if (!title || !content) {
      alert('标题和内容不能为空');
      return;
    }

    try {
      const url = '/api/notice';
      const method = this.editingId ? 'PUT' : 'POST';
      const body = this.editingId
        ? { noticeId: +this.editingId, title, content }
        : { title, content };

      const result = await request(url, { method, body: JSON.stringify(body) });

      if (result.code === 0) {
        alert(result.msg);
        document.getElementById('noticeWindow').style.display = 'none';
        await this.loadNotices();
        this.render();
      } else {
        alert(result.error || '操作失败');
      }
    } catch {
      alert('网络错误');
    }
  }
};

window.noticeModule = noticeModule;