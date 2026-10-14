(() => {
  const D = window.M54;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const driveFolder = id => `https://drive.google.com/drive/folders/${id}`;
  const thumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const thumbAlt = (id, w) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
  const fmt = n => n.toLocaleString('th-TH');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* image with fallback host */
  function driveImg(img, id, w, onok, onfail) {
    let tried = 0;
    img.referrerPolicy = 'no-referrer';
    img.onload = () => { img.classList.add('ok'); onok && onok(); };
    img.onerror = () => {
      tried++;
      if (tried === 1) img.src = thumbAlt(id, w);
      else onfail && onfail();
    };
    img.src = thumb(id, w);
  }

  /* ---------- links ---------- */
  $('#rootDrive').href = driveFolder(D.root);
  $('#rootDrive2').href = driveFolder(D.root);
  $('#statPhotos').dataset.count = D.total;

  /* ---------- word splitting (Thai-aware) ---------- */
  const seg = 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  function splitWords(el) {
    const text = el.textContent;
    const parts = seg ? [...seg.segment(text)].map(s => s.segment) : text.split(/(\s+)/);
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    parts.forEach(p => {
      if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); return; }
      const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      const wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = p;
      w.appendChild(wi); el.appendChild(w);
    });
  }

  /* ---------- hero wall ---------- */
  const localImgs = [];
  D.acts.forEach(a => localImgs.push(a.hero, a.s1, a.s2));
  const cols = $$('.wall .col');
  cols.forEach((c, k) => {
    const pick = localImgs.filter((_, i) => i % cols.length === k);
    const set = pick.concat(localImgs.slice(k, k + 3));
    const html = set.map(src => `<img src="${src}" alt="" loading="lazy" decoding="async">`).join('');
    c.innerHTML = html + html;
  });

  /* ---------- hero title photo fill ---------- */
  const mega = $('#mega');
  const test = document.createElement('div');
  test.style.cssText = '-webkit-background-clip:text;background-clip:text';
  if (!(test.style.webkitBackgroundClip || test.style.backgroundClip)) document.documentElement.classList.add('no-clip');
  const fills = D.acts.map(a => a.hero);
  let fi = 0;
  const setFill = () => { mega.style.setProperty('--fill', `url(${fills[fi % fills.length]})`); fi++; };
  setFill();
  fills.forEach(f => { const im = new Image(); im.src = f; });
  if (!reduce) setInterval(() => { mega.classList.add('flash'); setTimeout(() => { setFill(); mega.classList.remove('flash'); }, 350); }, 4200);

  /* ---------- mini index ---------- */
  $('#miniIndex').innerHTML = D.acts.map(a =>
    `<li><a href="#act-${a.n}"><em>${a.n}</em><span>${esc(a.tl)}<br><small style="color:var(--muted);font-family:var(--body)">${esc(a.short)}</small></span></a></li>`).join('');

  /* ---------- timeline ---------- */
  let lastMonth = '';
  const entries = $('#entries');
  D.acts.forEach((a, k) => {
    if (a.month !== lastMonth) {
      const m = document.createElement('p'); m.className = 'month'; m.textContent = a.month; m.setAttribute('aria-hidden', 'true');
      entries.appendChild(m); lastMonth = a.month;
    }
    const count = a.photos.length;
    const drives = a.folders.map(f => `<a class="btn ghost" href="${driveFolder(f.id)}" target="_blank" rel="noopener">${a.folders.length > 1 ? 'Google Drive: ' + esc(f.label) : 'เปิดอัลบั้มใน Google Drive'}</a>`).join('');
    const el = document.createElement('article');
    el.className = 'entry' + (k % 2 ? ' flip' : '');
    el.id = 'act-' + a.n;
    el.innerHTML = `
      <div class="e-media">
        <div class="e-hero" data-open="${k}" role="button" tabindex="0" aria-label="ดูภาพทั้งหมดของ${esc(a.title)}">
          <img src="${a.hero}" alt="${esc(a.title)}" loading="lazy" style="object-position:${a.pos}">
          <span class="e-date">${esc(a.date)}</span>
        </div>
        <div class="e-thumbs">
          <img src="${a.s1}" alt="" loading="lazy" style="object-position:${a.p1}" data-open="${k}">
          <img src="${a.s2}" alt="" loading="lazy" style="object-position:${a.p2}" data-open="${k}">
        </div>
      </div>
      <div class="e-body">
        <p class="e-num">${a.n}</p>
        <h3 class="e-title">${esc(a.title)}</h3>
        <p class="e-desc">${esc(a.desc)}</p>
        <p class="e-count">ภาพในอัลบั้มนี้ ${fmt(count)} ภาพ</p>
        <div class="e-actions"><button class="btn gold" data-open="${k}">ดูภาพทั้งหมด ${fmt(count)} ภาพ</button>${drives}</div>
      </div>`;
    entries.appendChild(el);
  });

  /* ---------- albums grid ---------- */
  $('#albumGrid').innerHTML = D.acts.map((a, k) => `
    <button class="album" data-open="${k}" data-reveal>
      <div class="ph"><img src="${a.hero}" alt="" loading="lazy" style="object-position:${a.pos}"><span class="badge">${fmt(a.photos.length)} ภาพ</span></div>
      <div class="tx"><span class="no">${a.n}</span><span class="t">${esc(a.tl)}</span><span class="d">${esc(a.date)}</span></div>
    </button>`).join('');

  /* ---------- river of photos ---------- */
  function riverLane(el, offset) {
    const picks = [];
    D.acts.forEach((a, k) => {
      const p = a.photos; const step = Math.max(1, Math.floor(p.length / 3));
      for (let j = 0; j < 3 && j * step + offset < p.length; j++) picks.push([k, p[(j * step + offset * 7) % p.length]]);
    });
    const make = () => picks.map(([k, id]) => `<button data-open="${k}" data-id="${id}" aria-label="เปิดอัลบั้ม${esc(D.acts[k].title)}"><img data-drive="${id}" alt="" loading="lazy"></button>`).join('');
    el.innerHTML = make() + make();
  }
  riverLane($('#lane1'), 1); riverLane($('#lane2'), 2);
  $$('.track img').forEach(img => driveImg(img, img.dataset.drive, 400, null, () => { img.closest('button').style.display = 'none'; }));

  /* ---------- summary cards ---------- */
  const cardNames = ['ปก', ...D.acts.map(a => a.n + ' ' + a.tl), 'ขอบคุณผู้ปกครอง'];
  $('#cardRail').innerHTML = cardNames.map((n, i) => {
    const f = `cards/card-${String(i).padStart(2, '0')}.jpg`;
    return `<figure><a href="${f}" target="_blank" rel="noopener"><img src="${f}" alt="ภาพสรุป ${esc(n)}" loading="lazy" width="1080" height="1350"></a><figcaption>${i + 1}/${cardNames.length} ${esc(n)}</figcaption></figure>`;
  }).join('');
  const rail = $('#cardRail');
  const railStep = () => rail.querySelector('figure').getBoundingClientRect().width + 20;
  $('#railPrev').onclick = () => rail.scrollBy({ left: -railStep(), behavior: 'smooth' });
  $('#railNext').onclick = () => rail.scrollBy({ left: railStep(), behavior: 'smooth' });

  /* ---------- reveal observers ---------- */
  $$('[data-words]').forEach(splitWords);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-words],[data-reveal],.entry').forEach(el => io.observe(el));

  /* count-up */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = reduce ? 1 : 1800;
    const tick = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- top bar, nav state, timeline progress ---------- */
  const topbar = $('#topbar'), bar = $('#tlBar'), tl = $('#timeline');
  const navLinks = $$('.nav a');
  const sections = navLinks.map(a => $(a.getAttribute('href')));
  function onScroll() {
    topbar.classList.toggle('solid', scrollY > 40);
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .5 - r.top) / r.height));
    bar.style.width = (p * 100) + '%';
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const nav = $('#nav'), menuBtn = $('#menuBtn');
  menuBtn.onclick = () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); menuBtn.textContent = o ? 'ปิดเมนู' : 'เมนู'; };
  navLinks.forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.textContent = 'เมนู'; menuBtn.setAttribute('aria-expanded', false); }));

  /* ---------- gallery ---------- */
  const gal = $('#gallery'), grid = $('#gGrid'), more = $('#gMore'), body = $('#gBody');
  const PAGE = 30;
  let cur = null, shown = 0;
  function openAlbum(k, push = true) {
    const a = D.acts[k]; cur = k; shown = 0;
    $('#gDate').textContent = a.date;
    $('#gTitle').textContent = a.title;
    $('#gCount').textContent = `ทั้งหมด ${fmt(a.photos.length)} ภาพ กดที่ภาพเพื่อดูขนาดใหญ่`;
    $('#gActions').innerHTML = a.folders.map(f => `<a class="btn line" href="${driveFolder(f.id)}" target="_blank" rel="noopener">${a.folders.length > 1 ? 'Google Drive: ' + esc(f.label) + ' (' + fmt(f.count) + ' ภาพ)' : 'เปิดอัลบั้มนี้ใน Google Drive'}</a>`).join('');
    grid.innerHTML = '';
    body.scrollTop = 0;
    addPage();
    if (!gal.open) gal.showModal();
    if (push) history.pushState({ album: k }, '', '#album-' + a.n);
  }
  function addPage() {
    const a = D.acts[cur];
    const end = Math.min(a.photos.length, shown + PAGE);
    const frag = document.createDocumentFragment();
    for (let i = shown; i < end; i++) {
      const id = a.photos[i];
      const b = document.createElement('button'); b.dataset.idx = i; b.setAttribute('aria-label', `ภาพที่ ${i + 1}`);
      const img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      b.appendChild(img); frag.appendChild(b);
      driveImg(img, id, 480, null, () => { b.innerHTML = '<span class="fail">โหลดภาพนี้ไม่สำเร็จ กดเพื่อเปิดใน Google Drive</span>'; b.dataset.fail = id; });
    }
    grid.appendChild(frag);
    shown = end;
    more.hidden = shown >= a.photos.length;
    more.textContent = `แสดงภาพเพิ่ม (เหลืออีก ${fmt(a.photos.length - shown)} ภาพ)`;
  }
  more.onclick = addPage;
  const sio = new IntersectionObserver(es => { if (es[0].isIntersecting && cur !== null && shown < D.acts[cur].photos.length) addPage(); }, { root: body, rootMargin: '600px' });
  sio.observe($('#gSentinel'));
  function closeAlbum() { if (gal.open) gal.close(); }
  $('#gClose').onclick = () => { history.state && history.state.album !== undefined ? history.back() : closeAlbum(); };
  gal.addEventListener('cancel', e => { e.preventDefault(); $('#gClose').click(); });
  gal.addEventListener('click', e => { if (e.target === gal) $('#gClose').click(); });
  grid.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.fail) { window.open(`https://drive.google.com/file/d/${b.dataset.fail}/view`, '_blank', 'noopener'); return; }
    openLight(+b.dataset.idx);
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), stage = $('#lbStage');
  let li = 0;
  function showLight() {
    const a = D.acts[cur], id = a.photos[li];
    stage.classList.add('loading');
    $('#lbCount').textContent = `${a.title} ภาพที่ ${fmt(li + 1)} จาก ${fmt(a.photos.length)}`;
    $('#lbOpen').href = `https://drive.google.com/file/d/${id}/view`;
    lbImg.alt = `${a.title} ภาพที่ ${li + 1}`;
    let tried = 0;
    lbImg.onload = () => stage.classList.remove('loading');
    lbImg.onerror = () => { if (!tried++) lbImg.src = thumbAlt(id, 1600); else stage.classList.remove('loading'); };
    lbImg.referrerPolicy = 'no-referrer';
    lbImg.src = thumb(id, 1600);
    [li + 1, li - 1].forEach(j => { if (a.photos[j]) { const p = new Image(); p.referrerPolicy = 'no-referrer'; p.src = thumb(a.photos[j], 1600); } });
  }
  function openLight(i) { li = i; showLight(); lb.showModal(); }
  const step = d => { const n = D.acts[cur].photos.length; li = (li + d + n) % n; showLight(); };
  $('#lbPrev').onclick = () => step(-1);
  $('#lbNext').onclick = () => step(1);
  $('#lbClose').onclick = () => lb.close();
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  let sx = null;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });

  /* ---------- open triggers ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (!t || t.closest('#gallery')) return;
    openAlbum(+t.dataset.open);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.e-hero')) { e.preventDefault(); openAlbum(+e.target.dataset.open); }
  });
  addEventListener('popstate', () => {
    const m = location.hash.match(/^#album-(\d\d)$/);
    if (m) { const k = D.acts.findIndex(a => a.n === m[1]); if (k >= 0) openAlbum(k, false); }
    else { if (lb.open) lb.close(); closeAlbum(); }
  });
  const m0 = location.hash.match(/^#album-(\d\d)$/);
  if (m0) { const k = D.acts.findIndex(a => a.n === m0[1]); if (k >= 0) { history.replaceState(null, '', location.pathname); openAlbum(k); } }

  /* ---------- share ---------- */
  $('#shareBtn').onclick = async () => {
    const url = location.origin + location.pathname;
    const note = $('#shareNote');
    if (navigator.share) { try { await navigator.share({ title: document.title, url }); return; } catch (_) { return; } }
    try { await navigator.clipboard.writeText(url); note.textContent = 'คัดลอกลิงก์เว็บไซต์แล้ว นำไปวางในแชตได้ทันที'; }
    catch (_) { note.textContent = 'คัดลอกลิงก์นี้ไปส่งต่อได้: ' + url; }
  };

  /* ---------- page load moment ---------- */
  requestAnimationFrame(() => setTimeout(() => document.documentElement.classList.add('loaded'), 80));
})();
