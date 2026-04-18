const BASE_URL = 'http://localhost:3000';

async function request(url, options = {}) {
  const fullUrl = BASE_URL + url;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(fullUrl, config);
    const data = await response.json();

    if (response.status === 401) {
      if (data.error === '用户名或密码错误') {
        return data;
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return Promise.reject(new Error('未授权'));
    }

    return data;
  } catch (err) {
    console.error('请求失败:', err);
    throw err;
  }
}