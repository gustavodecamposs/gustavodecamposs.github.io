/* ─────────────────────────────────────────────────────
   Angra em pixel, no rodapé do hero.

   Uma baía que se monta sozinha: morros ao fundo, prédios
   que sobem um a um, barcos cruzando a água, nuvens passando.
   Nada aqui é conteúdo — é ambiente. Se este arquivo falhar
   ou nunca carregar, o hero continua inteiro e legível.

   Discreto de propósito: o movimento acontece atrás e abaixo
   do texto, devagar, em cores esmaecidas. O nome do visitante
   na tela continua sendo o seu, não a cidade.
   ───────────────────────────────────────────────────── */
(function () {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;

  const hero = document.getElementById('inicio');
  if (!hero) return;

  const P = 3;              // lado do "pixel" da cidade
  const FPS = 1000 / 20;    // 20fps bastam: tudo se move devagar
  const SKYLINE = 0.34;     // fração da altura ocupada pela cidade

  const canvas = document.createElement('canvas');
  canvas.className = 'city-layer';
  canvas.setAttribute('aria-hidden', 'true');
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, ground = 0, water = 0;

  function palette() {
    const cs = getComputedStyle(root);
    const pick = (n, fb) => (cs.getPropertyValue(n) || '').trim() || fb;
    return {
      accent: pick('--accent', '#6fb8e8'),
      accent2: pick('--accent-2', '#e8a33d'),
      shadow: pick('--shadow', '#332d24'),
      ink3: pick('--ink-3', '#aba396')
    };
  }
  let colors = palette();

  // ─── ESTADO ─────────────────────────────────────────
  let hills = [];      // silhueta dos morros, ao fundo
  let buildings = [];  // prédios, crescem um a um
  let boats = [];
  let clouds = [];
  let nextBuild = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    const r = hero.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width));
    H = Math.max(200, Math.round(r.height));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    ground = Math.round(H * (1 - SKYLINE * 0.42));
    water = Math.round(H - 6 * P);
    build();
  }

  // Morros de Angra: a cidade é cercada por mata, então a
  // silhueta de fundo é feita de picos, não de retângulos.
  function makeHills() {
    hills = [];
    const peaks = Math.ceil(W / (26 * P)) + 2;
    for (let i = 0; i < peaks; i++) {
      hills.push({
        x: i * 26 * P - 13 * P,
        w: rnd(20, 34) * P,
        h: rnd(7, 15) * P
      });
    }
  }

  function makeBoats() {
    boats = [];
    for (let i = 0; i < 2; i++) {
      boats.push({
        x: rnd(-W * 0.3, W),
        y: water + rnd(0, 3) * P,
        speed: rnd(0.08, 0.16) * (Math.random() < 0.5 ? -1 : 1),
        size: Math.random() < 0.4 ? 2 : 1
      });
    }
  }

  function makeClouds() {
    clouds = [];
    for (let i = 0; i < 3; i++) {
      clouds.push({
        x: rnd(-W * 0.2, W),
        y: rnd(H * 0.06, H * 0.16),
        w: rnd(8, 16) * P,
        speed: rnd(0.012, 0.03)
      });
    }
  }

  // Monta as janelas de um predio pronto, em ordem embaralhada:
  // a cidade acende espalhada, nao em fila.
  function lightUp(b) {
    b.lights = [];
    for (let dy = 2 * P; dy < b.h - P; dy += 3 * P) {
      for (let dx = P; dx < b.w - P; dx += 3 * P) {
        b.lights.push({ dx, dy, on: false });
      }
    }
    b.lights.sort(() => Math.random() - 0.5);
  }

  function build() {
    makeHills();
    makeBoats();
    makeClouds();
    buildings = [];
    nextBuild = 0;
    // Alguns predios ja existem na chegada: uma orla vazia parece
    // bug, nao inicio de animacao. O resto cresce com o tempo.
    const seed = Math.max(3, Math.floor(W / (26 * P)));
    for (let i = 0; i < seed; i++) {
      addBuilding();
      const b = buildings[buildings.length - 1];
      if (b) { b.h = b.target; lightUp(b); }
    }
  }

  // Um prédio novo a cada poucos segundos, até encher a orla.
  function addBuilding() {
    const maxW = 9 * P;
    const x = rnd(0, W - maxW);
    // Evita empilhar em cima de outro já existente
    if (buildings.some(b => Math.abs(b.x - x) < 7 * P)) return;
    buildings.push({
      x,
      w: Math.round(rnd(4, 8)) * P,
      target: Math.round(rnd(4, 13)) * P,
      h: 0,
      // janelas acendem sozinhas depois que o prédio sobe
      lights: [],
      lit: 0
    });
  }

  // ─── DESENHO ────────────────────────────────────────
  function px(x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Mistura duas cores do tema em uma so, pra ter um tom intermediario
  // sem inventar valor fora dos tokens.
  function mix(a, b, amount) {
    const hex = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16));
    try {
      const A = hex(a), B = hex(b);
      return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * amount)).join(',') + ')';
    } catch (e) { return a; }
  }

  function drawHills() {
    for (const hl of hills) {
      // pico em degraus, como montanha de jogo 8-bit
      const steps = Math.max(2, Math.round(hl.h / P));
      for (let s = 0; s < steps; s++) {
        const inset = (s / steps) * (hl.w / 2);
        px(hl.x + inset, ground - (s + 1) * P, hl.w - inset * 2, P, colors.shadow);
      }
    }
  }

  function drawBuildings() {
    const wall = mix(colors.shadow, colors.ink3, 0.3);
    const roof = mix(colors.shadow, colors.ink3, 0.5);
    for (const b of buildings) {
      px(b.x, ground - b.h, b.w, b.h, wall);
      px(b.x, ground - b.h, b.w, P, roof);
      // janelas acesas
      for (const l of b.lights) {
        if (l.on) px(b.x + l.dx, ground - b.h + l.dy, P, P, colors.accent);
      }
    }
  }

  function drawWater() {
    // linha d'água: duas faixas de pontos que escorrem devagar
    for (let x = 0; x < W; x += 4 * P) {
      const off = Math.sin((x + Date.now() * 0.012) * 0.03) * P;
      px(x, water + off, 2 * P, P, colors.shadow);
    }
  }

  function drawBoats() {
    for (const bt of boats) {
      const s = bt.size;
      // casco
      px(bt.x, bt.y, 5 * P * s, P * s, colors.ink3);
      px(bt.x + P * s, bt.y - P * s, 3 * P * s, P * s, colors.ink3);
      // mastro
      px(bt.x + 2 * P * s, bt.y - 3 * P * s, P * s, 2 * P * s, colors.ink3);
      // vela, na cor âmbar
      px(bt.x + 3 * P * s, bt.y - 3 * P * s, P * s, P * s, colors.accent2);
    }
  }

  function drawClouds() {
    for (const c of clouds) {
      px(c.x, c.y, c.w, P, colors.shadow);
      px(c.x + 2 * P, c.y - P, c.w - 4 * P, P, colors.shadow);
    }
  }

  // ─── LOOP ───────────────────────────────────────────
  let last = 0;
  let running = true;
  let visible = true;

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < FPS) return;
    const dt = Math.min(now - last, 200);
    last = now;
    if (!visible) return;

    // prédio novo de tempos em tempos, até a orla encher
    nextBuild -= dt;
    if (nextBuild <= 0) {
      nextBuild = rnd(2600, 5200);
      if (buildings.length < Math.floor(W / (12 * P))) addBuilding();
    }

    // prédios sobem; depois as janelas acendem uma a uma
    for (const b of buildings) {
      if (b.h < b.target) {
        b.h = Math.min(b.target, b.h + P);
        if (b.h === b.target) lightUp(b);
      } else if (b.lit < b.lights.length) {
        b.litWait = (b.litWait || 0) - dt;
        if (b.litWait <= 0) {
          b.litWait = rnd(400, 1400);
          b.lights[b.lit].on = true;
          b.lit++;
        }
      }
    }

    for (const bt of boats) {
      bt.x += bt.speed * dt;
      if (bt.speed > 0 && bt.x > W + 40) bt.x = -60;
      if (bt.speed < 0 && bt.x < -60) bt.x = W + 40;
    }

    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x > W + 40) c.x = -c.w - 40;
    }

    ctx.clearRect(0, 0, W, H);
    drawClouds();
    drawHills();
    drawBuildings();
    drawWater();
    drawBoats();
  }

  // ─── CICLO DE VIDA ──────────────────────────────────
  let resizeTimer = null;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  }, { passive: true });

  // Para de desenhar quando o hero sai da tela: a cidade existe
  // só enquanto alguém pode vê-la.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
      .observe(hero);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    }
  });

  new MutationObserver(() => { colors = palette(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  resize();
  requestAnimationFrame(frame);
})();
