document.querySelector('#loginForm .btn').addEventListener('click', async (e) => {
  e.preventDefault();

  const name = document.querySelector('#loginForm .input').value.trim();
  const pwd = document.querySelector('#loginForm .input-full').value.trim();
  const agreeCheckbox = document.getElementById('agree-login');

  const existingError = document.querySelector('#loginForm .error-msg');
  if (existingError) {
    existingError.remove();
  }

  if (!name) {
    showError('请输入邮箱/手机号码/小米ID');
    return;
  }
  if (!pwd) {
    showError('请输入密码');
    return;
  }
  if (!agreeCheckbox.checked) {
    showError('请先阅读并同意用户协议和隐私政策');
    return;
  }

  try {
    const response = await fetch('http://47.107.55.106:8080/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, pwd })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('username', name);
      localStorage.setItem('token', data.data);
      window.location.href = '小米商城首页.html';
    } else {
      showError('用户名或密码不正确');
    }
  } catch (error) {
    showError('网络错误，请稍后重试');
  }
});

function showError(message) {
  const existingError = document.querySelector('#loginForm .error-msg');
  if (existingError) {
    existingError.remove();
  }

  const errorMsg = document.createElement('p');
  errorMsg.className = 'error-msg';
  errorMsg.textContent = message;
  errorMsg.style.cssText = 'color: #ff4d4f; font-size: 14px; margin-top: -12px; margin-bottom: 12px;';

  const passwordInput = document.querySelector('#loginForm .input-full');
  passwordInput.parentNode.insertBefore(errorMsg, passwordInput.nextSibling);
}