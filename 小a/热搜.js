const searchInput = document.querySelector('.search');
const hotSearchDiv = document.getElementById('hotSearch');
let hotData = [];

fetch('http://47.107.55.106:8080/api/anemi/hotSearch')
  .then(res => res.json())
  .then(data => {
    hotData = data.data || data;
  })
  .catch(err => console.log('热搜加载失败:', err));

searchInput.addEventListener('focus', () => {
  if (hotData.length > 0) {
    hotSearchDiv.innerHTML = hotData.slice(0, 9).map(item => {
      const name = item.name || item;
      return '<span class="hot-tag">' + name + '</span>';
    }).join('');
    hotSearchDiv.style.display = 'flex';
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-area')) {
    hotSearchDiv.style.display = 'none';
  }
});