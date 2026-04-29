document.querySelector('#registerForm .btn').addEventListener('click', async (e) => {
  e.preventDefault();

  const name = document.querySelector('#registerForm .input[placeholder="请输入账号"]').value.trim();
  const pwd = document.querySelector('#registerForm .input[placeholder="请输入密码"]').value.trim();
  const agreeCheckbox = document.getElementById('agree-reg');

  const existingError = document.querySelector('#registerForm .error-msg');
  if (existingError) {
    existingError.remove();
  }

  if (!name) {
    showRegisterError('请输入账号');
    return;
  }
  if (!pwd) {
    showRegisterError('请输入密码');
    return;
  }
  if (!agreeCheckbox.checked) {
    showRegisterError('请先阅读并同意用户协议和隐私政策');
    return;
  }

  try {
    const response = await fetch('http://47.107.55.106:8080/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, pwd })
    });

    if (response.ok) {
      alert('注册成功');
      window.location.href = '登录页面.html';
    } else {
      const errorData = await response.json().catch(() => null);
      showRegisterError(errorData?.message || '注册失败，请重试');
    }
  } catch (error) {
    showRegisterError('网络错误，请稍后重试');
  }
});

function showRegisterError(message) {
  const existingError = document.querySelector('#registerForm .error-msg');
  if (existingError) {
    existingError.remove();
  }

  const errorMsg = document.createElement('p');
  errorMsg.className = 'error-msg';
  errorMsg.textContent = message;
  errorMsg.style.cssText = 'color: #ff4d4f; font-size: 14px; margin-top: -12px; margin-bottom: 12px;';

  const agreeDiv = document.querySelector('#registerForm .agree');
  agreeDiv.parentNode.insertBefore(errorMsg, agreeDiv);
}