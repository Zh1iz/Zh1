const username = localStorage.getItem('username');
let token = localStorage.getItem('token');
let currentSex = 1;
let currentProfile = '';

fetchUserInfo();

async function fetchUserInfo() {
  if (!token) return;
  try {
    const response = await fetch('http://47.107.55.106:8080/api/user/info', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    if (response.ok) {
      const data = await response.json();
      const userData = data.data || data;
      if (userData.name) {
        document.getElementById('nicknameText').textContent = userData.name;
      }
      if (userData.sex) {
        currentSex = userData.sex;
        document.getElementById('genderText').textContent = userData.sex === 1 ? '男' : '女';
      }
      if (userData.profile) {
        currentProfile = userData.profile;
        document.getElementById('avatarImg').src = userData.profile;
      }
      if (userData.signature) {
        document.getElementById('nicknameText').textContent = userData.signature;
      }
      if (userData.birth) {
        document.getElementById('birthText').textContent = userData.birth;
        document.getElementById('birthText').classList.remove('placeholder-text');
      }
    }
  } catch (error) {
    console.log('获取用户信息失败:', error);
  }
}

document.getElementById('logoutBtn').addEventListener('click', function (e) {
  e.preventDefault();
  if (token) {
    fetch('http://47.107.55.106:8080/api/user/logout', {
      method: 'GET',
      headers: { 'Authorization': token }
    }).catch(() => { });
  }
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  window.location.href = '登录页面.html';
});

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

let currentEditType = '';

function openModal(type) {
  currentEditType = type;
  modalOverlay.style.display = 'flex';

  if (type === 'nickname') {
    modalTitle.textContent = '修改昵称';
    modalBody.innerHTML = '<input type="text" class="modal-input" id="nicknameInput" placeholder="请输入昵称" value="' + document.getElementById('nicknameText').textContent.replace('请设置昵称', '') + '">';
  } else if (type === 'gender') {
    modalTitle.textContent = '修改性别';
    modalBody.innerHTML = `
      <div class="gender-options">
        <label class="gender-option ${currentSex === 1 ? 'active' : ''}">
          <input type="radio" name="gender" value="1" ${currentSex === 1 ? 'checked' : ''}> 男
        </label>
        <label class="gender-option ${currentSex === 2 ? 'active' : ''}">
          <input type="radio" name="gender" value="2" ${currentSex === 2 ? 'checked' : ''}> 女
        </label>
      </div>
    `;
  } else if (type === 'birth') {
    modalTitle.textContent = '修改生日';
    const currentBirth = document.getElementById('birthText').textContent;
    modalBody.innerHTML = `
      <div class="birth-picker">
        <input type="date" id="birthInput" class="modal-input" value="${currentBirth === '未设置' ? '' : currentBirth}">
      </div>
    `;
  } else if (type === 'avatar') {
    modalTitle.textContent = '修改头像';
    modalBody.innerHTML = `
      <div class="avatar-upload">
        <input type="file" id="avatarFileInput" accept="image/*" style="display: none;">
        <div class="avatar-preview-wrapper">
          <img id="avatarPreview" src="${currentProfile || 'logo.png'}" class="avatar-preview">
          <div class="avatar-preview-overlay" id="avatarOverlay">
            <i class="fa-solid fa-camera"></i>
          </div>
        </div>
        <button class="upload-btn" id="uploadBtn">选择图片</button>
        <p class="upload-tip">支持 jpg、png 格式图片</p>
        <p class="upload-status" id="uploadStatus"></p>
      </div>
    `;

    document.getElementById('uploadBtn').addEventListener('click', function () {
      document.getElementById('avatarFileInput').click();
    });

    document.getElementById('avatarOverlay').addEventListener('click', function () {
      document.getElementById('avatarFileInput').click();
    });

    document.getElementById('avatarFileInput').addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        window._selectedFile = file;
        const reader = new FileReader();
        reader.onload = function (event) {
          document.getElementById('avatarPreview').src = event.target.result;
          document.getElementById('uploadStatus').textContent = '已选择: ' + file.name;
          document.getElementById('uploadStatus').style.color = '#ff6700';
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

document.getElementById('editNickname').addEventListener('click', () => openModal('nickname'));
document.getElementById('editGender').addEventListener('click', () => openModal('gender'));
document.getElementById('editBirth').addEventListener('click', () => openModal('birth'));
document.getElementById('editAvatar').addEventListener('click', () => openModal('avatar'));
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function (e) {
  if (e.target === modalOverlay) closeModal();
});

modalConfirm.addEventListener('click', async function () {
  const updateData = {};

  if (currentEditType === 'nickname') {
    const nicknameInput = document.getElementById('nicknameInput');
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      alert('请输入昵称');
      return;
    }
    updateData.profile = currentProfile || '';
    updateData.sex = currentSex;
    updateData.birth = document.getElementById('birthText').textContent === '未设置' ? '2000-01-01' : document.getElementById('birthText').textContent;
    updateData.signature = nickname;
  } else if (currentEditType === 'gender') {
    const selectedGender = document.querySelector('input[name="gender"]:checked');
    currentSex = parseInt(selectedGender.value);
    updateData.profile = currentProfile || '';
    updateData.sex = currentSex;
    updateData.birth = document.getElementById('birthText').textContent === '未设置' ? '2000-01-01' : document.getElementById('birthText').textContent;
  } else if (currentEditType === 'birth') {
    const birthInput = document.getElementById('birthInput');
    const birth = birthInput.value.trim();
    if (!birth) {
      alert('请选择生日');
      return;
    }
    updateData.profile = currentProfile || '';
    updateData.sex = currentSex;
    updateData.birth = birth;
  } else if (currentEditType === 'avatar') {
    const file = window._selectedFile;
    if (!file) {
      alert('请先选择图片');
      return;
    }

    document.getElementById('uploadStatus').textContent = '上传中...';
    document.getElementById('uploadStatus').style.color = '#333';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('http://47.107.55.106:8080/api/user/upload', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('上传失败');
      }

      const uploadData = await uploadResponse.json();
      console.log('上传返回:', uploadData);

      let imageUrl = uploadData.data || uploadData.url;

      if (uploadData.data && typeof uploadData.data === 'object') {
        imageUrl = uploadData.data.url || uploadData.data.profile || uploadData.data;
      }

      if (uploadData.token) {
        token = uploadData.token;
        localStorage.setItem('token', uploadData.token);
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error('imageUrl无效:', imageUrl);
        throw new Error('未获取到图片地址');
      }

      currentProfile = imageUrl;
      updateData.profile = currentProfile;
      updateData.sex = currentSex;
      updateData.birth = document.getElementById('birthText').textContent === '未设置' ? '2000-01-01' : document.getElementById('birthText').textContent;
    } catch (error) {
      document.getElementById('uploadStatus').textContent = '上传失败，请重试';
      document.getElementById('uploadStatus').style.color = '#ff4d4f';
      return;
    }
  }

  try {
    const response = await fetch('http://47.107.55.106:8080/api/user/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      if (currentEditType === 'nickname') {
        document.getElementById('nicknameText').textContent = updateData.signature;
      } else if (currentEditType === 'gender') {
        document.getElementById('genderText').textContent = currentSex === 1 ? '男' : '女';
      } else if (currentEditType === 'birth') {
        document.getElementById('birthText').textContent = updateData.birth;
        document.getElementById('birthText').classList.remove('placeholder-text');
      } else if (currentEditType === 'avatar') {
        document.getElementById('avatarImg').src = currentProfile;
      }
      closeModal();
      alert('修改成功');
    } else {
      const errorData = await response.json().catch(() => null);
      alert(errorData?.message || '修改失败');
    }
  } catch (error) {
    alert('网络错误，请稍后重试');
  }
});