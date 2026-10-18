/* 白墙影展 · 前台 */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const esc = (s) => String(s == null ? '' : s);
  const pad2 = (n) => (n < 10 ? '0' + n : String(n));

  async function getJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('加载失败（' + res.status + '）');
    return res.json();
  }

  /* 静态托管模式（GitHub Pages / 任意静态主机）：
     页面里注入 window.WW_STATIC = true 后，改为读取同目录下的 JSON 文件，
     不再依赖 Node 服务端的 /api 接口。 */
  const STATIC = !!window.WW_STATIC;
  const URL_INDEX = STATIC ? 'data/exhibition.json' : '/api/exhibition';
  const urlSeries = (id) =>
    STATIC ? 'data/series/' + encodeURIComponent(id) + '.json' : '/api/series/' + encodeURIComponent(id);
  const homeUrl = () => (STATIC ? 'index.html' : '/');

  function setMeta(meta) {
    if (!meta) return;
    document.title = meta.title ? meta.title + ' · ' + (meta.subtitle || '摄影作品展') : document.title;
    const sub = $('#brandSub');
    if (sub && meta.subtitle) sub.textContent = meta.subtitle.toUpperCase();
    const ft = $('#footLeft');
    if (ft) ft.textContent = [meta.title, meta.subtitle].filter(Boolean).join(' · ');
    const fr = $('#footRight');
    if (fr) fr.textContent = meta.footer || '';
  }

  /* ---------------------------------------------------------- 首页 */

  async function initIndex() {
    let data;
    try {
      data = await getJson(URL_INDEX);
    } catch (e) {
      $('#seriesGrid').appendChild(el('div', 'empty-state', e.message));
      return;
    }

    const meta = data.meta || {};
    setMeta(meta);

    $('#heroKicker').textContent = '展 览';
    $('#heroTitle').textContent = meta.title || '白墙';
    $('#heroSub').textContent = meta.subtitle || '';
    $('#heroIntro').textContent = meta.intro || '';
    $('#heroIntro').style.display = meta.intro ? '' : 'none';

    $('#statSeries').textContent = data.series.length || '0';
    $('#statPhotos').textContent = data.total || '0';
    const years = data.series.map((s) => s.year).filter(Boolean).sort();
    $('#statYear').textContent = years.length ? years[years.length - 1] : '—';

    const about = $('#aboutText');
    if (about) {
      about.textContent = meta.intro || meta.footer || '';
      if (!meta.intro && !meta.footer) {
        $('#about').style.display = 'none';
      }
    }

    const grid = $('#seriesGrid');
    grid.innerHTML = '';

    if (!data.series.length) {
      const box = el('div', 'empty-state');
      box.appendChild(el('div', 'glyph', '空'));
      box.appendChild(el('p', null, '还没有系列。进入管理台上传第一批作品。'));
      grid.appendChild(box);
      grid.style.gridTemplateColumns = '1fr';
      $('#wallHint').textContent = '';
      return;
    }

    $('#wallHint').textContent = data.series.length + ' 个系列';

    data.series.forEach((s, i) => {
      const a = el('a', 'series-card reveal');
      a.href = (STATIC ? 'series.html?s=' : '/series?s=') + encodeURIComponent(s.id);
      a.style.animationDelay = Math.min(i * 70, 500) + 'ms';

      const frame = el('div', 'frame');
      if (s.cover && s.cover.thumb) {
        const img = el('img');
        img.src = s.cover.thumb;
        img.alt = s.title;
        img.loading = i < 3 ? 'eager' : 'lazy';
        frame.appendChild(img);
      } else {
        frame.appendChild(el('div', 'empty', '待 布 展'));
      }

      const cap = el('div', 'cap');
      cap.appendChild(el('h3', null, s.title));
      cap.appendChild(el('span', 'count', (s.count || 0) + ' 幅'));

      a.appendChild(frame);
      a.appendChild(cap);
      if (s.subtitle || s.description) {
        a.appendChild(el('p', 'desc', s.subtitle || s.description));
      }
      grid.appendChild(a);
    });
  }

  /* ---------------------------------------------------------- 系列页 */

  let photos = [];
  let current = 0;

  function openLightbox(i) {
    if (!photos.length) return;
    current = Math.max(0, Math.min(photos.length - 1, i));
    const p = photos[current];
    const lb = $('#lightbox');
    const img = $('#lbImg');

    img.src = p.file;
    img.alt = p.title || '';
    $('#lbIdx').textContent = pad2(current + 1) + ' / ' + pad2(photos.length);
    $('#lbTitle').textContent = p.title || '';
    $('#lbCaption').textContent = p.caption || '';
    $('#lbCaption').style.display = p.caption ? '' : 'none';
    $('#lbSize').textContent = p.w && p.h ? p.w + ' × ' + p.h + ' px' : '';
    $('#lbPrev').style.visibility = current === 0 ? 'hidden' : 'visible';
    $('#lbNext').style.visibility = current === photos.length - 1 ? 'hidden' : 'visible';

    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lb = $('#lightbox');
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function step(d) {
    const next = current + d;
    if (next < 0 || next >= photos.length) return;
    openLightbox(next);
  }

  async function initSeries() {
    const id = new URLSearchParams(location.search).get('s');
    if (!id) {
      location.replace(homeUrl());
      return;
    }

    let data;
    try {
      data = await getJson(urlSeries(id));
    } catch (e) {
      $('#seriesTitle').textContent = '找不到这个系列';
      $('#seriesDesc').textContent = e.message;
      return;
    }

    const metaRes = await getJson(URL_INDEX).catch(() => null);
    if (metaRes) setMeta(metaRes.meta);

    const s = data.series;
    document.title = s.title + ' · ' + ((metaRes && metaRes.meta && metaRes.meta.title) || '白墙');
    $('#seriesTitle').textContent = s.title;
    if (s.subtitle) $('#seriesSub').textContent = s.subtitle;
    else $('#seriesSub').style.display = 'none';
    if (s.description) $('#seriesDesc').textContent = s.description;
    else $('#seriesDesc').style.display = 'none';

    photos = data.photos || [];
    const grid = $('#photoGrid');

    if (!photos.length) {
      const box = el('div', 'empty-state');
      box.appendChild(el('div', 'glyph', '空'));
      box.appendChild(el('p', null, '这个系列还没有作品。'));
      grid.appendChild(box);
      grid.style.gridTemplateColumns = '1fr';
      return;
    }

    photos.forEach((p, i) => {
      const btn = el('button', 'photo-cell reveal');
      btn.type = 'button';
      btn.style.animationDelay = Math.min(i * 55, 600) + 'ms';

      const frame = el('div', 'frame');
      frame.style.aspectRatio = p.w && p.h ? p.w + ' / ' + p.h : '4 / 3';

      if (p.lqip) {
        const ph = el('div', 'ph');
        ph.style.backgroundImage = 'url("' + p.lqip + '")';
        frame.appendChild(ph);
      }

      const img = el('img');
      img.src = p.thumb;
      img.alt = p.title || '';
      img.loading = i < 6 ? 'eager' : 'lazy';
      if (p.w) img.width = p.w;
      if (p.h) img.height = p.h;
      img.addEventListener('load', () => {
        img.classList.add('loaded');
        const ph = frame.querySelector('.ph');
        if (ph) ph.classList.add('hide');
      });
      frame.appendChild(img);

      const meta = el('div', 'meta');
      meta.appendChild(el('span', 't', p.title || '无题'));
      meta.appendChild(el('span', 'i', pad2(i + 1)));
      frame.appendChild(meta);

      btn.appendChild(frame);
      btn.addEventListener('click', () => openLightbox(i));
      grid.appendChild(btn);
    });

    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', () => step(-1));
    $('#lbNext').addEventListener('click', () => step(1));
    $('#lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox' || e.target.classList.contains('stage')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!$('#lightbox').classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });

    // 触屏左右滑动
    let sx = 0;
    const stage = $('.lightbox .stage');
    stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
    });
  }

  /* ---------------------------------------------------------- 启动 */

  // 兜底：动画万一被系统禁用，2 秒后强制显示所有内容
  setTimeout(() => document.documentElement.classList.add('settled'), 2000);

  const page = document.body.dataset.page;
  if (page === 'index') initIndex();
  else if (page === 'series') initSeries();
})();
