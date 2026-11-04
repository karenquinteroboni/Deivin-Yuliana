(() => {
  'use strict';
  const C = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const params = new URLSearchParams(location.search);
  const code = (params.get('i') || '').trim().slice(0, 40);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    kids.flat().forEach(c => n.append(c));
    return n;
  };
  const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 250) : ms));

  /* ---------- invitado (nombre + cupos) ---------- */
  let guest = null;
  const guestReady = (async () => {
    if (!code) return null;
    try {
      if (C.rsvpEndpoint) {
        const r = await fetch(`${C.rsvpEndpoint}?action=guest&code=${encodeURIComponent(code)}`);
        const d = await r.json();
        if (d && d.ok) return { name: d.name, cupos: Number(d.cupos), prev: d.response || null, demo: false };
        return null;
      }
      const g = (C.demoGuests || {})[code];
      if (!g) return null;
      let prev = null;
      try { prev = JSON.parse(localStorage.getItem('rsvp-demo-' + code)); } catch (_) {}
      return { name: g.name, cupos: g.cupos, prev, demo: true };
    } catch (_) { return null; }
  })();

  guestReady.then(g => {
    guest = g;
    renderRSVP();
  });

  /* ---------- imágenes: un reintento y, si sigue fallando, se oculta el ícono roto ---------- */
  const rescue = img => {
    if (img.dataset.tried) { img.style.visibility = 'hidden'; return; }
    img.dataset.tried = '1';
    setTimeout(() => { img.src = img.src + (img.src.includes('?') ? '&' : '?') + 'r=1'; }, 1200);
  };
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => rescue(img));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) rescue(img);
  });

  /* ---------- música ---------- */
  const music = $('#music'), musicBtn = $('#musicBtn');
  music.volume = 0.6;
  const setMusicUI = on => { musicBtn.setAttribute('aria-pressed', on); musicBtn.setAttribute('aria-label', on ? 'Pausar música' : 'Reproducir música'); };
  let wantMusic = false;
  const playMusic = () => music.play().then(() => { wantMusic = true; setMusicUI(true); }).catch(() => { wantMusic = false; setMusicUI(false); });
  musicBtn.addEventListener('click', () => {
    if (music.paused) playMusic(); else { music.pause(); wantMusic = false; setMusicUI(false); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) music.pause(); else if (wantMusic) music.play().catch(() => {});
  });
  setMusicUI(false);

  /* ---------- intro: sello → brillo → sobre → video ---------- */
  const intro = $('#intro'), env = $('#envelope'), seal = $('#seal'), video = $('#walkVideo');

  // Líneas de pliegue y recorrido de brillo: se calculan en píxeles según el tamaño real del sobre
  function layoutLines() {
    const w = env.clientWidth, h = env.clientHeight; if (!w || !h) return;
    const m = Math.round(w * .03), my = Math.round(w * .03), tip = h * .44, cx = w / 2;
    $('#lines').setAttribute('viewBox', `0 0 ${w} ${h}`);
    const set = (id, d) => $(id).setAttribute('d', d);
    set('#lnSeam', `M${m} ${my}L${cx} ${tip}L${w - m} ${my}`);
    set('#lnFoldL', `M0 ${h}L${cx} ${tip}`); set('#lnFoldR', `M${w} ${h}L${cx} ${tip}`);
    set('#lnFrame', `M${m} ${my}H${w - m}V${h - my}H${m}Z`);
    set('#runL', `M${cx} ${tip}L${m} ${my}V${h - my}H${cx}`);
    set('#runR', `M${cx} ${tip}L${w - m} ${my}V${h - my}H${cx}`);
  }
  layoutLines(); addEventListener('resize', layoutLines);
  let opened = false, finished = false;

  const sparks = () => {
    const rect = seal.getBoundingClientRect(), host = $('#envelope').getBoundingClientRect();
    const cx = rect.left - host.left + rect.width / 2, cy = rect.top - host.top + rect.height / 2;
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18, d = 50 + Math.random() * 90;
      const s = el('i', { class: 'spark' });
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      env.append(s); setTimeout(() => s.remove(), 1000);
    }
  };

  async function openInvitation() {
    if (opened) return; opened = true;
    seal.disabled = true;
    playMusic();                                   // el clic es el gesto que permite el audio
    env.classList.add('shimmer');                  // recorrido de brillo por la ornamentación
    await wait(2500);
    sparks();
    const r = seal.getBoundingClientRect();        // la luz nace del sello
    intro.style.setProperty('--fx', (r.left + r.width / 2) + 'px');
    intro.style.setProperty('--fy', (r.top + r.height / 2) + 'px');
    env.classList.add('open');                     // se rompe el sello y se abre la solapa
    await wait(450);
    intro.classList.add('lit');                  // la luz crece hasta llenar la pantalla
    video.load();
    await wait(1250);
    startWalk();                                   // con la pantalla en luz, entra el video
  }
  seal.addEventListener('click', openInvitation);

  function startWalk() {
    if (finished) return;
    intro.classList.add('walking');
    intro.classList.remove('lit');               // la luz se disuelve y revela el video
    const go = video.play();
    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', finish, { once: true });
    if (go && go.catch) go.catch(() => setTimeout(finish, 1200));
    setTimeout(finish, 9000);                      // red de seguridad
  }
  $('#skip').addEventListener('click', finish);

  function finish() {
    if (finished) return; finished = true;
    intro.classList.add('done');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    document.querySelectorAll('.hero .reveal').forEach(n => n.classList.add('in'));
    setTimeout(() => { video.pause(); intro.remove(); }, 1300);
  }

  /* ---------- cuenta regresiva ---------- */
  const target = new Date(C.eventDate).getTime();
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      ['cD', 'cH', 'cM', 'cS'].forEach(id => $('#' + id).textContent = '00');
      $('#countMsg').textContent = Date.now() < new Date(C.eventEnd).getTime() ? '¡Hoy es el gran día!' : 'Gracias por acompañarnos';
      return;
    }
    const s = Math.floor(diff / 1000);
    $('#cD').textContent = Math.floor(s / 86400);
    $('#cH').textContent = pad(Math.floor(s % 86400 / 3600));
    $('#cM').textContent = pad(Math.floor(s % 3600 / 60));
    $('#cS').textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- cuenta regresiva raspable ---------- */
  (() => {
    const wrap = $('#scratch'), cv = $('#foil');
    if (!wrap || !cv) return;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    let revealed = false, drawing = false, last = null, w = 0, h = 0, dpr = 1, checkTimer = 0;

    function paintFoil() {
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      const r = wrap.getBoundingClientRect(); w = r.width; h = r.height;
      if (!w || !h) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, w, h);
      [[0, '#f1dc9c'], [.28, '#d6b35f'], [.5, '#f7eabd'], [.72, '#c79d41'], [1, '#e8cc80']].forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h / 14; i++) {                       // grano metálico
        ctx.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(110,80,10,.07)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1;   // veta diagonal
      for (let x = -h; x < w; x += 9) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
      ctx.fillStyle = '#4d3707'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 15px "Cormorant Garamond", Georgia, serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
      ctx.fillText('RASPA PARA DESCUBRIR', w / 2 + 2, h / 2);
    }

    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    function scratch(from, to) {
      const radius = Math.max(18, Math.round(w * .05));
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';                                   // opaco: borra por completo
      ctx.lineWidth = radius * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(to[0], to[1]); ctx.stroke();
    }
    function cleared() {                                          // fracción raspada (muestreo en rejilla)
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data, step = 6 * dpr | 0;
      let t = 0, n = 0;
      for (let y = 0; y < cv.height; y += step) for (let x = 0; x < cv.width; x += step) { n++; if (d[(y * cv.width + x) * 4 + 3] < 40) t++; }
      return t / n;
    }
    function reveal() {
      if (revealed) return; revealed = true;
      wrap.classList.add('revealed'); cv.removeAttribute('tabindex');
      setTimeout(() => cv.remove(), 1000);
    }
    const scheduleCheck = () => { clearTimeout(checkTimer); checkTimer = setTimeout(() => { if (cleared() > .55) reveal(); }, 120); };

    cv.addEventListener('pointerdown', e => {
      if (revealed) return;
      drawing = true; cv.setPointerCapture(e.pointerId); last = pos(e); scratch(last, last); e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (!drawing || revealed) return;
      const p = pos(e); scratch(last, p); last = p; scheduleCheck();
    });
    const stop = () => { drawing = false; scheduleCheck(); };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); } });

    paintFoil();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!revealed && !drawing) paintFoil(); });
    let lastW = w;
    addEventListener('resize', () => { if (!revealed && !drawing && Math.abs(wrap.clientWidth - lastW) > 1) { lastW = wrap.clientWidth; paintFoil(); } });
  })();

  /* ---------- menú ---------- */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  const toggleMenu = open => {
    menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuBtn.innerHTML = open
      ? '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  };
  menuBtn.addEventListener('click', () => toggleMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) toggleMenu(false); });

  /* ---------- revelado al hacer scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal:not(.hero .reveal)').forEach(n => io.observe(n));

  /* ---------- enlaces configurables ---------- */
  if (C.dressCodeUrl) $('#dressLink').href = C.dressCodeUrl;
  if (C.photosUrl) { const q = $('.qr'); q.src = q.dataset.src + '?v=6'; $('#fotos').hidden = false; $('#navFotos').hidden = false; $('#photosLink').href = C.photosUrl; }

  /* ---------- agregar al calendario (.ics) ---------- */
  $('#addCal').addEventListener('click', () => {
    const f = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Deivin y Yuliana//Boda//ES', 'BEGIN:VEVENT',
      'UID:boda-deivin-yuliana-20270320@invitacion', `DTSTAMP:${f(Date.now())}`, `DTSTART:${f(C.eventDate)}`, `DTEND:${f(C.eventEnd)}`,
      'SUMMARY:Boda de Deivin & Yuliana',
      'DESCRIPTION:Ceremonia 4:00 p. m. · Recepción 6:00 p. m.',
      'LOCATION:Catedral Metropolitana de la Inmaculada Concepción\\, Calle 10 #1-129\\, Ibagué',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = el('a', { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'boda-deivin-yuliana.ics' });
    document.body.append(a); a.click(); a.remove();
  });

  /* ---------- confirmación de asistencia ---------- */
  const body = $('#rsvpBody');
  const clear = () => { body.replaceChildren(); };

  function renderRSVP() {
    clear();
    if (!guest) {
      body.append(
        el('p', { class: 'lead', text: 'Tu invitación es personal' }),
        el('p', { class: 'body', text: 'Para confirmar tu asistencia abre la tarjeta desde el enlace personalizado que te enviaron por WhatsApp.' })
      );
      return;
    }
    if (guest.prev) return renderDone(guest.prev, true);

    let attending = null, count = 1;
    const max = Math.max(1, guest.cupos | 0);
    const err = el('p', { class: 'msg-err', role: 'alert', hidden: '' });
    const out = el('output', { text: '1', 'aria-live': 'polite' });
    const minus = el('button', { type: 'button', 'aria-label': 'Una persona menos', text: '−' });
    const plus = el('button', { type: 'button', 'aria-label': 'Una persona más', text: '+' });
    const sync = () => { out.textContent = count; minus.disabled = count <= 1; plus.disabled = count >= max; };
    minus.addEventListener('click', () => { count = Math.max(1, count - 1); sync(); });
    plus.addEventListener('click', () => { count = Math.min(max, count + 1); sync(); });

    const who = el('div', { class: 'field', hidden: '' },
      el('label', { text: max === 1 ? 'Asistirás tú' : `¿Cuántas personas asistirán? (máx. ${max})` }),
      max === 1 ? el('p', { class: 'cupos', text: '1 persona' }) : el('div', { class: 'stepper' }, minus, out, plus));
    sync();

    const radio = (val, label) => el('label', {}, el('input', { type: 'radio', name: 'att', value: val, onchange: () => {
      attending = val === 'si'; who.hidden = !attending; err.hidden = true; }}), el('span', { text: label }));
    const msg = el('textarea', { maxlength: '300', placeholder: 'Un mensaje para los novios (opcional)', 'aria-label': 'Mensaje para los novios' });
    const submit = el('button', { class: 'btn', type: 'submit', text: 'Enviar respuesta' });

    const form = el('form', { novalidate: '' },
      guest.demo ? el('p', { class: 'msg-demo', text: 'MODO PRUEBA · esta respuesta no se guarda en el Excel' }) : '',
      el('p', { class: 'eyebrow', text: 'Hola' }),
      el('p', { class: 'who', text: guest.name }),
      el('p', { class: 'cupos', text: max === 1 ? 'Tu invitación es para 1 persona' : `Tu invitación es para ${max} personas` }),
      el('div', { class: 'choice' }, radio('si', 'Con mucho gusto asistiré'), radio('no', 'No podré acompañarlos')),
      who, msg, err, submit);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (attending === null) { err.textContent = 'Elige si podrás asistir.'; err.hidden = false; return; }
      if (attending && (count < 1 || count > max)) { err.textContent = `Puedes confirmar entre 1 y ${max} personas.`; err.hidden = false; return; }
      submit.disabled = true; submit.textContent = 'Enviando…'; err.hidden = true;
      const payload = { code, attending, count: attending ? count : 0, message: msg.value.trim().slice(0, 300) };
      try {
        await sendRSVP(payload);
        guest.prev = payload; renderDone(payload, false);
      } catch (ex) {
        err.textContent = ex.message || 'No pudimos guardar tu respuesta. Inténtalo de nuevo.'; err.hidden = false;
        submit.disabled = false; submit.textContent = 'Enviar respuesta';
      }
    });
    body.append(form);
  }

  async function sendRSVP(p) {
    if (!C.rsvpEndpoint) {                         // modo prueba
      await wait(500);
      if (p.attending && (p.count < 1 || p.count > guest.cupos)) throw new Error('Cantidad fuera de tu invitación.');
      try { localStorage.setItem('rsvp-demo-' + code, JSON.stringify(p)); } catch (_) {}
      return;
    }
    const r = await fetch(C.rsvpEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'No pudimos guardar tu respuesta.');
  }

  function renderDone(r, already) {
    clear();
    const yes = r.attending;
    body.append(
      el('p', { class: 'done-ico', 'aria-hidden': 'true', text: yes ? '♥' : '✦' }),
      el('p', { class: 'who', text: yes ? '¡Gracias por confirmar!' : 'Gracias por avisarnos' }),
      el('p', { class: 'body', text: yes
        ? `${already ? 'Ya tenemos tu confirmación' : 'Quedó registrada tu confirmación'} para ${r.count} ${r.count === 1 ? 'persona' : 'personas'}. ¡Nos hace muy felices que nos acompañes!`
        : 'Lamentamos que no puedas acompañarnos. Te llevamos en el corazón.' }));
    if (yes && C.groupUrl) body.append(el('a', { class: 'btn', href: C.groupUrl, target: '_blank', rel: 'noopener', text: 'Unirme al grupo de WhatsApp' }), el('br'));
    body.append(el('button', { class: 'btn ghost', type: 'button', text: 'Cambiar mi respuesta', onclick: () => { guest.prev = null; renderRSVP(); } }));
  }
})();
