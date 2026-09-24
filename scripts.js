const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// ─── TOPOGRAFIA (canvas) ──────────────────────────────
// Value noise 2D + marching squares. Grade em pixels CSS; o DPR só dá nitidez.
function createTopo(canvas, { animated = true, opacity = 1 } = {}) {
  if (!canvas || !canvas.getContext) return;

  const ctx    = canvas.getContext('2d');
  const CELL   = 14;
  const LEVELS = 8;
  const FREQ   = 0.0032;
  const live   = animated && !reducedMotion;

  // Permutação aleatória: cada carregamento gera um relevo diferente
  const perm = new Uint8Array(512);
  for (let k = 0; k < 256; k++) perm[k] = k;
  for (let k = 255; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [perm[k], perm[j]] = [perm[j], perm[k]];
  }
  for (let k = 0; k < 256; k++) perm[k + 256] = perm[k];

  const hash = (x, y) => perm[perm[x & 255] + (y & 255)] / 255;
  const fade = (t) => t * t * (3 - 2 * t);

  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = fade(x - xi), v = fade(y - yi);
    const a = hash(xi, yi),     b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // Oitavas deslizando em direções diferentes: o relevo muda de forma, não só anda
  function field(x, y, z) {
    return noise(x + z, y) * 0.6
         + noise(x * 2.1 - z * 1.3, y * 2.1 + z) * 0.28
         + noise(x * 4.3 + z, y * 4.3 - z * 0.7) * 0.12;
  }

  // Segmentos por caso (bits: tl=8 tr=4 br=2 bl=1; arestas: 0 topo, 1 dir, 2 base, 3 esq)
  const SEGS = [
    [], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 1], [2, 3]], [[0, 2]], [[0, 3]],
    [[0, 3]], [[0, 2]], [[0, 3], [1, 2]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], [],
  ];

  let w = 0, h = 0, cols = 0, rows = 0, grid = null;
  let rgb = '201, 160, 111';
  let z = Math.random() * 100;
  let rafId = 0, last = 0, onScreen = true;
  const mouse = { x: 0, y: 0 }, off = { x: 0, y: 0 };

  function readColor() {
    const v = getComputedStyle(root).getPropertyValue('--accent-rgb').trim();
    if (v) rgb = v;
  }

  function resize() {
    // clientWidth ignora transforms (o hero escala o fundo no scroll)
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    grid = new Float32Array(cols * rows);
  }

  function draw() {
    if (!grid) return;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r * cols + c] = field((c * CELL + off.x) * FREQ, (r * CELL + off.y) * FREQ, z);
      }
    }

    ctx.clearRect(0, 0, w, h);

    for (let l = 0; l < LEVELS; l++) {
      const t   = l / (LEVELS - 1);
      const iso = 0.26 + t * 0.48;
      // A cada 4 linhas, uma "curva mestra" mais grossa, como em carta topográfica
      ctx.lineWidth   = l % 4 === 3 ? 1.2 : 0.7;
      ctx.strokeStyle = `rgba(${rgb}, ${((0.12 + t * 0.23) * opacity).toFixed(3)})`;
      ctx.beginPath();

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const tl = grid[r * cols + c],       tr = grid[r * cols + c + 1];
          const bl = grid[(r + 1) * cols + c], br = grid[(r + 1) * cols + c + 1];
          const idx = (tl > iso ? 8 : 0) | (tr > iso ? 4 : 0) | (br > iso ? 2 : 0) | (bl > iso ? 1 : 0);
          if (idx === 0 || idx === 15) continue;

          const x0 = c * CELL, y0 = r * CELL;
          const edge = (e) => {
            switch (e) {
              case 0: return [x0 + CELL * (iso - tl) / (tr - tl), y0];
              case 1: return [x0 + CELL, y0 + CELL * (iso - tr) / (br - tr)];
              case 2: return [x0 + CELL * (iso - bl) / (br - bl), y0 + CELL];
              default: return [x0, y0 + CELL * (iso - tl) / (bl - tl)];
            }
          };

          for (const [e1, e2] of SEGS[idx]) {
            const p = edge(e1), q = edge(e2);
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(q[0], q[1]);
          }
        }
      }
      ctx.stroke();
    }
  }

  // ~30fps é suficiente para um relevo lento
  function loop(time) {
    rafId = requestAnimationFrame(loop);
    if (time - last < 33) return;
    last = time;
    z += 0.0006 * 33 / 16.7;
    off.x += (mouse.x - off.x) * 0.06;
    off.y += (mouse.y - off.y) * 0.06;
    draw();
  }

  function start() {
    if (live && !rafId && onScreen && !document.hidden) rafId = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  readColor();
  resize();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); draw(); }, 150);
  });

  new MutationObserver(() => { readColor(); draw(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  if (!live) return;

  // Parallax: o relevo desliza até 16px seguindo o cursor
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 32;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 32;
  }, { passive: true });

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    onScreen ? start() : stop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  start();
}

createTopo(document.getElementById('topo'), { animated: true, opacity: 0.6 });
createTopo(document.getElementById('topoContact'), { animated: false, opacity: 0.35 });

// ─── CONTATO: vídeo de fundo sob demanda ──────────────
// Carrega só quando a seção entra na tela; pausa fora dela. Sem vídeo com dados limitados.
(function () {
  const video = document.querySelector('.contact-bg');
  if (!video) return;

  const saveData = navigator.connection && navigator.connection.saveData === true;
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  if (reducedMotion || saveData || narrow) { video.remove(); return; }

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
      const p = video.play();
      if (p) p.catch(() => {});
    } else {
      video.pause();
    }
  }, { threshold: 0.15 }).observe(video.closest('.contact'));
})();

// ─── REVEAL ───────────────────────────────────────────
(function () {
  const items = document.querySelectorAll('[data-reveal]');
  if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('is-in');
      io.unobserve(target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  items.forEach((el) => io.observe(el));
})();

// ─── HEADER: transparente no topo, sólido ao rolar ────
// Sólido cedo: o título do hero passa por baixo do header enquanto some
(function () {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const update = () => header.classList.toggle('is-solid', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ─── SEÇÃO ATIVA NO MENU ──────────────────────────────
(function () {
  const links = document.querySelectorAll('[data-nav]');
  const byId  = new Map([...links].map((a) => [a.getAttribute('href').slice(1), a]));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      links.forEach((a) => {
        const on = a === byId.get(target.id);
        a.classList.toggle('is-active', on);
        on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
})();

// ─── MENU MOBILE ──────────────────────────────────────
(function () {
  const btn  = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  const behind = document.querySelectorAll('main, .site-footer, .brand, .theme-btn');

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    behind.forEach((el) => { el.inert = open; });
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a').focus();
  }

  btn.addEventListener('click', () => setOpen(menu.hidden));

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      btn.focus();
    }
  });

  // Voltou ao desktop com o menu aberto
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) setOpen(false);
  });
})();

// ─── TEMA ─────────────────────────────────────────────
(function () {
  const btn = document.getElementById('themeToggle');
  const stored = () => { try { return localStorage.getItem('theme'); } catch (e) { return null; } };

  function label() {
    if (!btn) return;
    const dark = root.getAttribute('data-theme') !== 'light';
    btn.setAttribute('aria-label', dark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  }

  // Só grava quando a pessoa escolhe; sem escolha, segue o sistema
  btn && btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (stored()) return;
    root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    label();
  });

  label();
})();

// ─── HERO: entrada + scroll + botão magnético ─────────
(function () {
  const hero = document.getElementById('inicio');
  if (!hero || !root.classList.contains('motion')) return;

  // Cada caractere vira um span com atraso próprio: onda da esquerda para a direita, linha a linha
  hero.querySelectorAll('[data-split]').forEach((line, li) => {
    let ci = 0;
    [...line.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const frag = document.createDocumentFragment();
      for (const char of node.textContent) {
        if (char.trim() === '') { frag.append(char); continue; }
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = char;
        span.style.setProperty('--d', `${(0.15 + li * 0.09 + ci++ * 0.026).toFixed(3)}s`);
        frag.append(span);
      }
      node.replaceWith(frag);
    });
  });

  // Espera a fonte: animar antes faria as letras trocarem de forma no meio do movimento
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))])
    .then(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  // Scroll e ímã interpolados no mesmo rAF: o movimento continua suave mesmo com a roda do mouse "aos saltos"
  const btn = hero.querySelector('.hero-down');
  const magnetic = btn && window.matchMedia('(pointer: fine)').matches;
  let target = 0, cur = -1;
  const m = { tx: 0, ty: 0, x: 0, y: 0 };
  let raf = 0, last = 0;

  function measure() {
    target = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.85), 0), 1);
  }

  function frame(time) {
    const dt = last ? Math.min(time - last, 64) : 16.7;
    last = time;
    const k = 1 - Math.pow(0.86, dt / 16.7);

    cur = cur < 0 ? target : cur + (target - cur) * k;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    hero.style.setProperty('--p', cur.toFixed(4));

    let moving = cur !== target;

    if (magnetic) {
      m.x += (m.tx - m.x) * k;
      m.y += (m.ty - m.y) * k;
      if (Math.abs(m.tx - m.x) < 0.05 && Math.abs(m.ty - m.y) < 0.05) { m.x = m.tx; m.y = m.ty; }
      else moving = true;
      btn.style.transform = `translate3d(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px, 0)`;
    }

    raf = moving ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', () => { measure(); kick(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); kick(); });

  if (magnetic) {
    window.addEventListener('pointermove', (e) => {
      if (target >= 1) return;
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2 - m.x);
      const dy = e.clientY - (r.top + r.height / 2 - m.y);
      const near = Math.hypot(dx, dy) < 140;
      m.tx = near ? dx * 0.35 : 0;
      m.ty = near ? dy * 0.35 : 0;
      kick();
    }, { passive: true });
  }

  measure();
  kick();
})();

// ─── E-MAIL: copiar ───────────────────────────────────
(function () {
  const btn    = document.getElementById('copyMail');
  const status = document.getElementById('copyStatus');
  if (!btn || !navigator.clipboard) {
    if (btn) btn.hidden = true;
    return;
  }

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copiado';
      if (status) status.textContent = 'E-mail copiado.';
    } catch (e) {
      btn.textContent = 'Não copiou';
    }
    setTimeout(() => {
      btn.textContent = 'Copiar';
      if (status) status.textContent = '';
    }, 2200);
  });
})();

// ─── FORMULÁRIO → mailto ──────────────────────────────
(function () {
  const form = document.getElementById('contactForm');
  const btn  = document.getElementById('sendBtn');
  if (!form || !btn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const v = (id) => document.getElementById(id).value.trim();
    const url = 'mailto:gustavoo.dcsilva@gmail.com'
      + `?subject=${encodeURIComponent(v('assunto') || 'Contato pelo portfólio')}`
      + `&body=${encodeURIComponent(`Nome: ${v('nome')}\nE-mail: ${v('email')}\n\n${v('mensagem')}`)}`;

    const orig = btn.innerHTML;
    btn.textContent = 'Abrindo seu e-mail…';
    btn.disabled = true;
    window.location.href = url;

    setTimeout(() => {
      btn.innerHTML = orig;
      btn.disabled = false;
    }, 2500);
  });
})();
