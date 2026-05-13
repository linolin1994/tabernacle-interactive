/* ====================================================================
   Tabernacle Interactive — shared hover + detail panel logic
   ==================================================================== */

(function () {
  'use strict';

  // ── Tooltip ──────────────────────────────────────
  let tooltipEl = null;

  function getTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(el, evt) {
    const zh = el.getAttribute('data-zh') || el.getAttribute('data-label') || '';
    const en = el.getAttribute('data-en') || '';
    if (!zh && !en) return;
    const tip = getTooltip();
    tip.innerHTML = `${zh}${en ? `<span class="en">${en}</span>` : ''}`;
    tip.classList.add('show');
    moveTooltip(evt);
  }

  function moveTooltip(evt) {
    if (!tooltipEl) return;
    const pad = 16;
    let x = evt.clientX + pad;
    let y = evt.clientY + pad;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = evt.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = evt.clientY - rect.height - pad;
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = y + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('show');
  }

  // ── Detail panel ─────────────────────────────────
  function renderDetail(panel, data) {
    panel.classList.remove('empty');
    panel.classList.add('active');
    panel.style.animation = 'none';
    panel.offsetHeight;
    panel.style.animation = '';
    panel.classList.add('fadein');

    panel.innerHTML = `
      <div class="label">經文 · Scripture</div>
      <h3>${data.zh || ''}</h3>
      <span class="en-name">${data.en || ''}</span>
      <div class="detail-body">
        <div>
          <h5>和合本 · 中文</h5>
          <p>${data.descZh || ''}</p>
        </div>
        <div>
          <h5>NIV · English</h5>
          <p>${data.descEn || ''}</p>
        </div>
      </div>
      ${data.ref ? `<a class="scripture-ref" href="${data.refLink || '#scripture'}">↓ ${data.ref}</a>` : ''}
    `;
  }

  function clearDetail(panel) {
    panel.classList.remove('active', 'fadein');
    panel.classList.add('empty');
    panel.innerHTML = `
      <div class="empty-icon">✦</div>
      <div class="empty-text">
        滑鼠移到圖示上的任一部位，這裡會顯示中英對照的細節說明與經文出處。<br />
        <em style="font-size:0.85rem; opacity:0.6; font-family:inherit;">
          Hover over any part to reveal bilingual details and scripture references.
        </em>
      </div>
    `;
  }

  // ── Wire up hover regions on a stage ─────────────
  function initStage(stage) {
    const panel = stage.parentElement.querySelector('.detail-panel');
    if (!panel) return;

    // Add stage corner ornaments
    const tr = document.createElement('span');
    tr.className = 'stage-corner tr';
    stage.appendChild(tr);
    const bl = document.createElement('span');
    bl.className = 'stage-corner bl';
    stage.appendChild(bl);

    // Add ambient glow
    const glow = document.createElement('div');
    glow.className = 'stage-glow';
    stage.appendChild(glow);

    clearDetail(panel);

    const regions = stage.querySelectorAll('.hover-region');
    let pinned = null;

    // Keyboard accessibility: make regions focusable
    regions.forEach((region, i) => {
      region.setAttribute('tabindex', '0');
      region.setAttribute('role', 'button');
      const zh = region.getAttribute('data-zh') || '';
      const en = region.getAttribute('data-en') || '';
      region.setAttribute('aria-label', `${zh} ${en}`);

      region.addEventListener('mouseenter', (e) => {
        showTooltip(region, e);
        if (!pinned) renderDetail(panel, regionData(region));
        regions.forEach((r) => r.classList.remove('active'));
        region.classList.add('active');
      });
      region.addEventListener('mousemove', moveTooltip);
      region.addEventListener('mouseleave', () => {
        hideTooltip();
        if (!pinned) {
          regions.forEach((r) => r.classList.remove('active'));
          clearDetail(panel);
        }
      });
      region.addEventListener('click', (e) => {
        e.preventDefault();
        if (pinned === region) {
          pinned = null;
          regions.forEach((r) => r.classList.remove('active'));
          clearDetail(panel);
        } else {
          pinned = region;
          regions.forEach((r) => r.classList.remove('active'));
          region.classList.add('active');
          renderDetail(panel, regionData(region));
        }
      });
      // Keyboard: Enter/Space to pin
      region.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          region.dispatchEvent(new MouseEvent('click'));
        }
      });
      region.addEventListener('focus', () => {
        if (!pinned) renderDetail(panel, regionData(region));
        regions.forEach((r) => r.classList.remove('active'));
        region.classList.add('active');
      });
      region.addEventListener('blur', () => {
        if (!pinned) {
          regions.forEach((r) => r.classList.remove('active'));
          clearDetail(panel);
        }
      });
    });
  }

  function regionData(el) {
    return {
      zh: el.getAttribute('data-zh') || '',
      en: el.getAttribute('data-en') || '',
      descZh: el.getAttribute('data-desc-zh') || '',
      descEn: el.getAttribute('data-desc-en') || '',
      ref: el.getAttribute('data-ref') || '',
      refLink: el.getAttribute('data-ref-link') || '#scripture',
    };
  }

  // ── IntersectionObserver fade-up ─────────────────
  function initFadeUp() {
    const els = document.querySelectorAll(
      '.section, .specs, .bilingual, .entry-card, .page-nav, .spec-item, .interactive-stage, .detail-panel, .hero .lead, .hero .eyebrow, .hero h1, .hero .subtitle, .hero .instruction'
    );
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => {
      el.classList.add('fade-up');
      io.observe(el);
    });
    // Stagger entry cards
    document.querySelectorAll('.entry-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.07}s`;
    });
  }

  // ── Reading progress bar ──────────────────────────
  function initProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'reading-progress';
    const inner = document.createElement('div');
    inner.className = 'reading-progress-bar';
    bar.appendChild(inner);
    document.body.prepend(bar);

    function update() {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
      inner.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ── Mini map ──────────────────────────────────────
  const pages = [
    { href: 'index.html', zh: '總覽' },
    { href: 'ark.html', zh: '約櫃' },
    { href: 'table.html', zh: '陳設餅桌' },
    { href: 'lampstand.html', zh: '金燈臺' },
    { href: 'tabernacle.html', zh: '會幕幔幅' },
    { href: 'altar.html', zh: '燔祭壇' },
    { href: 'courtyard.html', zh: '外院' },
    { href: 'ephod.html', zh: '以弗得' },
    { href: 'breastpiece.html', zh: '胸牌' },
    { href: 'garments.html', zh: '聖服' },
  ];

  function initMiniMap() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const btn = document.createElement('button');
    btn.className = 'minimap-btn';
    btn.setAttribute('aria-label', '頁面導覽');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="2" width="5" height="5" rx="1"/>
      <rect x="11" y="2" width="5" height="5" rx="1"/>
      <rect x="2" y="11" width="5" height="5" rx="1"/>
      <rect x="11" y="11" width="5" height="5" rx="1"/>
    </svg>`;

    const panel = document.createElement('nav');
    panel.className = 'minimap-panel';
    panel.setAttribute('aria-label', '會幕導覽地圖');

    const title = document.createElement('h6');
    title.textContent = 'Mishkan · 快速跳轉';
    panel.appendChild(title);

    pages.forEach(({ href, zh }) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = zh;
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        a.classList.add('current');
        a.setAttribute('aria-current', 'page');
      }
      panel.appendChild(a);
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    let open = false;
    btn.addEventListener('click', () => {
      open = !open;
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (e) => {
      if (open && !btn.contains(e.target) && !panel.contains(e.target)) {
        open = false;
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) {
        open = false;
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  // ── Mark active nav link ──────────────────────────
  function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  // ── Mobile hamburger nav ──────────────────────────
  function initMobileNav() {
    const header = document.querySelector('.site-header .nav-container');
    const list = document.querySelector('.nav-links');
    if (!header || !list) return;

    // Inject hamburger button if not present
    let btn = header.querySelector('.nav-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'nav-toggle';
      btn.setAttribute('aria-label', '開啟選單');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span></span><span></span><span></span>';
      header.appendChild(btn);
    }

    btn.addEventListener('click', () => {
      const open = list.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    });

    // Close menu when a link is tapped
    list.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        list.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && list.classList.contains('open')) {
        list.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });

    // Close menu on resize back to desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 900) {
          list.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      }, 120);
    });
  }

  // ── Boot ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.interactive-stage').forEach(initStage);
    initActiveNav();
    initMobileNav();
    initFadeUp();
    initProgressBar();
    initMiniMap();
  });
})();
