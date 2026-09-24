const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// ─── IDIOMA ───────────────────────────────────────────
// Textos em i18n/<código>.js. O HTML marca o que traduzir:
//   data-i18n="chave"            → texto
//   data-i18n-html="chave"       → texto com marcação (<em>, seta)
//   data-i18n-attr="attr:chave"  → atributos (vários separados por ;)
// Inglês é o padrão; a escolha fica salva. ?lang=pt na URL também escolhe.
const I18N = window.I18N || {};
const HTML_LANG = { en: 'en', pt: 'pt-BR' };
let lang = 'en';

const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;

function applyLang(next) {
  lang = I18N[next] ? next : 'en';
  root.lang = HTML_LANG[lang] || lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  document.querySelectorAll('.lang-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });

  document.dispatchEvent(new Event('langchange'));
}

(function () {
  const stored = () => { try { return localStorage.getItem('lang'); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem('lang', v); } catch (e) {} };

  const param = new URLSearchParams(location.search).get('lang');
  if (param && I18N[param]) save(param);
  applyLang(param || stored() || 'en');
  root.classList.remove('i18n-pending');

  // Troca com um fade curto do conteúdo; sem movimento, troca direto
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.lang;
      if (next === lang) return;
      save(next);
      if (!root.classList.contains('motion')) { applyLang(next); return; }
      root.classList.add('is-switching');
      setTimeout(() => {
        applyLang(next);
        root.classList.remove('is-switching');
      }, 180);
    });
  });
})();

// ─── RUÍDO ────────────────────────────────────────────
// Value noise 2D. Permutação aleatória: cada carregamento gera um desenho diferente.
function makeNoise() {
  const perm = new Uint8Array(512);
  for (let k = 0; k < 256; k++) perm[k] = k;
  for (let k = 255; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [perm[k], perm[j]] = [perm[j], perm[k]];
  }
  for (let k = 0; k < 256; k++) perm[k + 256] = perm[k];

  const hash = (x, y) => perm[perm[x & 255] + (y & 255)] / 255;
  const fade = (t) => t * t * (3 - 2 * t);

  return function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = fade(x - xi), v = fade(y - yi);
    const a = hash(xi, yi),     b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

// ─── CÉU DE ANGRA (fundo do hero) ─────────────────────
// Estrelas reais na posição de agora, vistas de Angra dos Reis (23°00'S 44°19'W).
// Projeção estereográfica a partir do zênite; só pontos, sem traços nem rótulos.
const SKY_LAT = -23.0067, SKY_LON = -44.3181;

// [nome, constelação, AR (horas), Dec (graus), magnitude]
const STARS = [
  ['Acrux', 'Cruzeiro do Sul', 12.443, -63.10, 0.77],
  ['Mimosa', 'Cruzeiro do Sul', 12.795, -59.69, 1.25],
  ['Gacrux', 'Cruzeiro do Sul', 12.519, -57.11, 1.63],
  ['Imai', 'Cruzeiro do Sul', 12.252, -58.75, 2.8],
  ['Ginan', 'Cruzeiro do Sul', 12.356, -60.40, 3.59],
  ['Rigil Kentaurus', 'Centauro', 14.660, -60.83, -0.27],
  ['Hadar', 'Centauro', 14.064, -60.37, 0.61],
  ['Betelgeuse', 'Órion', 5.919, 7.41, 0.5],
  ['Rigel', 'Órion', 5.242, -8.20, 0.13],
  ['Bellatrix', 'Órion', 5.419, 6.35, 1.64],
  ['Saiph', 'Órion', 5.796, -9.67, 2.07],
  ['Alnitak', 'Órion', 5.679, -1.94, 1.77],
  ['Alnilam', 'Órion', 5.604, -1.20, 1.69],
  ['Mintaka', 'Órion', 5.533, -0.30, 2.23],
  ['Sirius', 'Cão Maior', 6.752, -16.72, -1.46],
  ['Mirzam', 'Cão Maior', 6.378, -17.96, 1.98],
  ['Adhara', 'Cão Maior', 6.977, -28.97, 1.5],
  ['Wezen', 'Cão Maior', 7.140, -26.39, 1.83],
  ['Aludra', 'Cão Maior', 7.402, -29.30, 2.45],
  ['Antares', 'Escorpião', 16.490, -26.43, 0.96],
  ['Graffias', 'Escorpião', 16.090, -19.81, 2.62],
  ['Dschubba', 'Escorpião', 16.006, -22.62, 2.29],
  ['Fang', 'Escorpião', 15.981, -26.11, 2.89],
  ['Al Niyat', 'Escorpião', 16.353, -25.59, 2.89],
  ['Paikauhale', 'Escorpião', 16.598, -28.22, 2.82],
  ['Larawag', 'Escorpião', 16.836, -34.29, 2.29],
  ['Xamidimura', 'Escorpião', 16.864, -38.05, 3.0],
  ['ζ Scorpii', 'Escorpião', 16.910, -42.36, 3.6],
  ['η Scorpii', 'Escorpião', 17.203, -43.24, 3.3],
  ['Sargas', 'Escorpião', 17.622, -43.00, 1.86],
  ['ι Scorpii', 'Escorpião', 17.793, -40.13, 3.0],
  ['Girtab', 'Escorpião', 17.708, -39.03, 2.4],
  ['Shaula', 'Escorpião', 17.560, -37.10, 1.62],
  ['Kaus Australis', 'Sagitário', 18.403, -34.38, 1.85],
  ['Kaus Media', 'Sagitário', 18.350, -29.83, 2.7],
  ['Kaus Borealis', 'Sagitário', 18.466, -25.42, 2.8],
  ['Nunki', 'Sagitário', 18.921, -26.30, 2.05],
  ['Ascella', 'Sagitário', 19.044, -29.88, 2.6],
  ['φ Sagittarii', 'Sagitário', 18.761, -26.99, 3.2],
  ['τ Sagittarii', 'Sagitário', 19.116, -27.67, 3.3],
  ['Alnasl', 'Sagitário', 18.097, -30.42, 2.99],
  ['Canopus', 'Carina', 6.399, -52.70, -0.74],
  ['Achernar', 'Erídano', 1.629, -57.24, 0.46],
  ['Fomalhaut', 'Peixe Austral', 22.961, -29.62, 1.16],
  ['Aldebaran', 'Touro', 4.599, 16.51, 0.85],
  ['Pollux', 'Gêmeos', 7.755, 28.03, 1.14],
  ['Castor', 'Gêmeos', 7.577, 31.89, 1.58],
  ['Procyon', 'Cão Menor', 7.655, 5.22, 0.34],
  ['Regulus', 'Leão', 10.140, 11.97, 1.35],
  ['Spica', 'Virgem', 13.420, -11.16, 0.97],
  ['Arcturus', 'Boieiro', 14.261, 19.18, -0.05],
  ['Vega', 'Lira', 18.616, 38.78, 0.03],
  ['Altair', 'Águia', 19.846, 8.87, 0.76],
  ['Deneb', 'Cisne', 20.690, 45.28, 1.25],
];

function createSky(canvas) {
  if (!canvas || !canvas.getContext) return;

  const ctx  = canvas.getContext('2d');
  const live = !reducedMotion;
  const rad  = Math.PI / 180;

  // Estrelas fracas de fundo: posições fixas no céu (semente fixa), giram junto com as reais
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const field = Array.from({ length: 420 }, () => ({
    ra: rnd() * 24, dec: Math.asin(rnd() * 2 - 1) / rad, mag: 4 + rnd() * 2, ph: rnd() * 6.3,
  }));
  const named = STARS.map(([, , ra, dec, mag]) => ({ ra, dec, mag, ph: rnd() * 6.3 }));

  let w = 0, h = 0, R = 0, ink = '236, 232, 225';
  let rafId = 0, last = 0, onScreen = true, born = 0, placedAt = 0;

  function readColor() {
    ink = getComputedStyle(root).getPropertyValue('--ink-rgb').trim() || ink;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.hypot(w, h) * 0.62;   // recorte do céu em volta do zênite
    place();
  }

  // AR/Dec → posição na tela para o instante atual
  function place() {
    const jd   = Date.now() / 86400000 + 2440587.5;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545);
    const lst  = gmst + SKY_LON;
    const sl = Math.sin(SKY_LAT * rad), cl = Math.cos(SKY_LAT * rad);

    for (const s of named.concat(field)) {
      const ha = (lst - s.ra * 15) * rad, dec = s.dec * rad;
      const east  = -Math.cos(dec) * Math.sin(ha);
      const north = Math.sin(dec) * cl - Math.cos(dec) * Math.cos(ha) * sl;
      const up    = Math.sin(dec) * sl + Math.cos(dec) * Math.cos(ha) * cl;
      s.up = up;
      // Olhando para cima com o norte no topo, o leste fica à esquerda
      s.x = w / 2 - (R * east) / (1 + up);
      s.y = h / 2 - (R * north) / (1 + up);
    }
    placedAt = performance.now();
  }

  const smooth = (a, b, x) => {
    const k = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return k * k * (3 - 2 * k);
  };

  // Mais fraco no centro, onde está o texto
  const clear = (x, y) => 0.3 + 0.7 * smooth(0.3, 0.85, Math.hypot((x - w / 2) / (w * 0.45), (y - h / 2) / (h * 0.45)));
  const size  = (mag) => Math.max(0.5, 2.6 - mag * 0.42);

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    const age = live ? (now - born) / 1000 : 9;

    // Entrada: as mais brilhantes acendem primeiro, as fracas vão aparecendo depois
    const litAt = (mag) => smooth(0, 0.6, age - 0.15 - (mag + 1.5) * 0.12);

    ctx.beginPath();
    for (const s of field) {
      if (s.up <= 0) continue;
      const a = litAt(s.mag) * clear(s.x, s.y) * (0.5 + 0.5 * Math.sin(now / 1400 + s.ph));
      if (a < 0.05) continue;
      ctx.moveTo(s.x + 0.7, s.y);
      ctx.arc(s.x, s.y, 0.7, 0, Math.PI * 2);
    }
    ctx.fillStyle = `rgba(${ink}, 0.4)`;
    ctx.fill();

    for (const s of named) {
      if (s.up <= 0) continue;
      const lit = litAt(s.mag);
      if (!lit) continue;
      const tw = live ? 0.85 + 0.15 * Math.sin(now / 900 + s.ph) : 1;
      ctx.fillStyle = `rgba(${ink}, ${(0.85 * lit * tw * clear(s.x, s.y)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, size(s.mag), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ~30fps: o céu só cintila; a posição é recalculada a cada 30s (a Terra gira 0,125° nesse tempo)
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (now - last < 33) return;
    last = now;
    if (now - placedAt > 30000) place();
    draw(now);
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
  born = performance.now();
  draw(born);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); draw(performance.now()); }, 150);
  });

  // Remede ao trocar de tema: escondido (display: none), o canvas tinha medido 0
  new MutationObserver(() => { readColor(); resize(); draw(performance.now()); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  if (!live) return;

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    onScreen ? start() : stop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  start();
}

// ─── TOPOGRAFIA (canvas do contato) ───────────────────
// Marching squares sobre o ruído. Grade em pixels CSS; o DPR só dá nitidez.
function createTopo(canvas, { animated = true, opacity = 1 } = {}) {
  if (!canvas || !canvas.getContext) return;

  const ctx    = canvas.getContext('2d');
  const CELL   = 14;
  const LEVELS = 8;
  const FREQ   = 0.0032;
  const live   = animated && !reducedMotion;
  const noise  = makeNoise();

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

  new MutationObserver(() => { readColor(); resize(); draw(); })
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

createSky(document.getElementById('stars'));
createTopo(document.getElementById('topo'), { animated: true, opacity: 0.5 });
createTopo(document.getElementById('topoContact'), { animated: false, opacity: 0.35 });

// ─── VOLTAR AO TOPO ───────────────────────────────────
// Visível só depois que o hero sai da tela
(function () {
  const btn  = document.getElementById('toTop');
  const hero = document.getElementById('inicio');
  if (!btn || !hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    btn.classList.toggle('is-visible', !entry.isIntersecting);
  }).observe(hero);
})();

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
    btn.setAttribute('aria-label', t(dark ? 'theme.toLight' : 'theme.toDark'));
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

  document.addEventListener('langchange', label);
  label();
})();

// ─── HERO: entrada + scroll ───────────────────────────
(function () {
  const hero = document.getElementById('inicio');
  if (!hero || !root.classList.contains('motion')) return;

  // Cada palavra vira um span com atraso próprio (entra também no <em>), linha a linha
  hero.querySelectorAll('[data-split]').forEach((line, li) => {
    let wi = 0;
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part.trim()) { if (part) frag.append(part); return; }
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = part;
        span.style.setProperty('--d', `${(0.35 + li * 0.14 + wi++ * 0.07).toFixed(3)}s`);
        frag.append(span);
      });
      node.replaceWith(frag);
    });
  });

  // Espera a fonte: animar antes faria as letras trocarem de forma no meio do movimento
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))])
    .then(() => requestAnimationFrame(() => hero.classList.add('is-ready')));

  // Scroll interpolado no rAF: o movimento continua suave mesmo com a roda do mouse "aos saltos"
  let target = 0, cur = -1, raf = 0, last = 0;

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

    raf = cur !== target ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', () => { measure(); kick(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); kick(); });

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
      btn.textContent = t('contact.copied');
      if (status) status.textContent = t('contact.copyStatus');
    } catch (e) {
      btn.textContent = t('contact.copyFailed');
    }
    setTimeout(() => {
      btn.textContent = t('contact.copy');
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
      + `?subject=${encodeURIComponent(v('assunto') || t('contact.mailSubject'))}`
      + `&body=${encodeURIComponent(`${t('contact.mailName')}: ${v('nome')}\n${t('contact.mailEmail')}: ${v('email')}\n\n${v('mensagem')}`)}`;

    btn.textContent = t('contact.sending');
    btn.disabled = true;
    window.location.href = url;

    setTimeout(() => {
      btn.innerHTML = t('contact.send');
      btn.disabled = false;
    }, 2500);
  });
})();
