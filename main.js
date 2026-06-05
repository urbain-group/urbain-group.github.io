/* ===================================================
   URBAIN — main.js
   =================================================== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initHamburger();
  initReveal();
  initTabs();
  initVoiceSlider();
  initCountUp();
  initContactForm();
  initBackToTop();
  initSmoothScroll();
});

/* ── Header scroll ── */
function initHeader() {
  const header = document.getElementById('header');
  const update = () => header.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── Hamburger ── */
function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      links.classList.remove('open');
    })
  );
}

/* ── Scroll Reveal ── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Property data ── */
const PROPS = {
  buy: [
    {
      img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&auto=format&fit=crop',
      badge: '売買', location: '東京都港区白金台',
      name: 'プラチナガーデン白金台', area: '85.20m²', rooms: '3LDK',
      floor: '8階建て', price: '12,800万円'
    },
    {
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80&auto=format&fit=crop',
      badge: '売買', location: '東京都渋谷区恵比寿',
      name: 'エビスレジデンス', area: '72.50m²', rooms: '2LDK',
      floor: '12階建て', price: '9,500万円'
    },
    {
      img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80&auto=format&fit=crop',
      badge: '売買', location: '東京都目黒区中目黒',
      name: 'ナカメグロテラス', area: '95.30m²', rooms: '4LDK',
      floor: '5階建て', price: '8,200万円'
    },
  ],
  rent: [
    {
      img: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80&auto=format&fit=crop',
      badge: '賃貸', location: '東京都港区麻布十番',
      name: 'アザブジュバンアパートメント', area: '62.00m²', rooms: '2LDK',
      floor: '10階建て', price: '28万円/月'
    },
    {
      img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&auto=format&fit=crop',
      badge: '賃貸', location: '東京都品川区大崎',
      name: 'オオサキスカイレジデンス', area: '58.50m²', rooms: '1LDK',
      floor: '20階建て', price: '18万円/月'
    },
    {
      img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80&auto=format&fit=crop',
      badge: '賃貸', location: '東京都渋谷区代官山',
      name: 'ダイカンヤマフラット', area: '45.00m²', rooms: '1K',
      floor: '6階建て', price: '15万円/月'
    },
  ]
};

function renderProps(tab) {
  const grid = document.getElementById('propsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  PROPS[tab].forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'prop-card reveal';
    card.innerHTML = `
      <div class="prop-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <span class="prop-badge">${p.badge}</span>
      </div>
      <div class="prop-info">
        <p class="prop-location">${p.location}</p>
        <h3 class="prop-name">${p.name}</h3>
        <div class="prop-details">
          <span>📐 ${p.area}</span>
          <span>🛏 ${p.rooms}</span>
          <span>🏢 ${p.floor}</span>
        </div>
        <p class="prop-price">${p.price}<small>（税込）</small></p>
      </div>`;
    grid.appendChild(card);

    // staggered reveal
    setTimeout(() => card.classList.add('visible'), i * 100 + 80);
  });
}

function initTabs() {
  renderProps('buy');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProps(btn.dataset.tab);
    });
  });
}

/* ── Voice Slider ── */
function initVoiceSlider() {
  const slider = document.getElementById('voiceSlider');
  const dots   = document.querySelectorAll('.dot');
  if (!slider || !dots.length) return;

  let cur = 0;
  let timer;

  function goTo(i) {
    cur = i;
    slider.style.transform = `translateX(-${i * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
  }

  function next() { goTo((cur + 1) % dots.length); }
  function reset() { clearInterval(timer); timer = setInterval(next, 5000); }

  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.i); reset(); }));
  reset();

  // Touch swipe
  let sx = 0;
  slider.addEventListener('touchstart', e => { sx = e.touches[0].clientX; });
  slider.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { goTo(dx < 0 ? Math.min(cur+1, dots.length-1) : Math.max(cur-1,0)); reset(); }
  });
}

/* ── Count-up animation ── */
function initCountUp() {
  const nums = document.querySelectorAll('.stat-num[data-count]');
  if (!nums.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const t0 = performance.now();
      const dur = 1600;

      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const v = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(v * target);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);

      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => obs.observe(n));
}

/* ── Contact form ── */
function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const btn     = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(f => {
      f.style.borderColor = '';
      f.style.background  = '';
      if (!f.value.trim()) {
        valid = false;
        f.style.borderColor = 'rgba(220,80,80,.7)';
        f.style.background  = 'rgba(220,80,80,.08)';
      }
    });
    if (!valid) return;

    btn.disabled = true;
    btn.querySelector('span').textContent = '送信中...';
    setTimeout(() => {
      form.style.display = 'none';
      success.style.display = 'flex';
    }, 1100);
  });
}

/* ── Back to top ── */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Smooth scroll (offset for fixed header) ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById('header').offsetHeight + 8;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
}
