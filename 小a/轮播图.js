(function () {
  const banner = document.getElementById('banner');
  const dotsContainer = document.getElementById('bannerDots');
  const prevBtn = document.getElementById('bannerPrev');
  const nextBtn = document.getElementById('bannerNext');
  let banners = [];
  let currentIndex = 0;
  let timer = null;

  const localImages = [
    '表.webp',
    '耳机.webp',
    '晾衣机.webp',
    '电脑.webp',
    '手机.webp',
    'K90.png'
  ];

  async function fetchBanners() {
    try {
      const response = await fetch('http://47.107.55.106:8080/api/anemi/banner');
      if (response.ok) {
        const data = await response.json();
        const apiData = data.data || data;
        banners = apiData.slice(0, 6).map((item, index) => ({
          ...item,
          img: localImages[index]
        }));
      }
    } catch (error) {
      console.log('获取轮播图失败，使用本地图片:', error);
      banners = localImages.map(img => ({ img }));
    }
    renderDots();
    showBanner(0);
    startAutoPlay();
  }

  function renderDots() {
    dotsContainer.innerHTML = '';
    const dotCount = Math.min(banners.length, 6);
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('span');
      dot.className = 'banner-dot';
      dot.addEventListener('click', () => showBanner(i));
      dotsContainer.appendChild(dot);
    }
  }

  function showBanner(index) {
    currentIndex = index;
    const url = banners[index].img || banners[index].imageUrl || banners[index].url;
    banner.style.backgroundImage = `url(${url})`;
    const dots = dotsContainer.querySelectorAll('.banner-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function nextBanner() {
    const newIndex = (currentIndex + 1) % banners.length;
    showBanner(newIndex);
  }

  function prevBanner() {
    const newIndex = (currentIndex - 1 + banners.length) % banners.length;
    showBanner(newIndex);
  }

  function startAutoPlay() {
    stopAutoPlay();
    timer = setInterval(nextBanner, 3000);
  }

  function stopAutoPlay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  prevBtn.addEventListener('click', () => {
    prevBanner();
    startAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    nextBanner();
    startAutoPlay();
  });

  banner.addEventListener('mouseenter', stopAutoPlay);
  banner.addEventListener('mouseleave', startAutoPlay);

  fetchBanners();
})();