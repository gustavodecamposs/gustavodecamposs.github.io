/* ─────────────────────────────────────────────────────
   Camada de jogo: operários que constroem a página, mascote
   que comenta, HUD de fase e pontuação.

   Regra que vale pra tudo aqui: isto é enfeite. Nenhuma peça
   de conteúdo pode depender deste arquivo pra ficar visível.
   Se algo falhar, o site tem que continuar legível e usável.
   Por isso todo estado de "escondido" tem rede de segurança.
   ───────────────────────────────────────────────────── */
(function () {
  'use strict';

  const root = document.documentElement;
  const motion = root.classList.contains('motion');

  // Sem motion (reduced-motion ou JS parcial): nada de jogo.
  // O scripts.js já revela tudo nesse caminho.
  if (!motion) return;

  const PIXEL = 4;          // tamanho do "pixel" dos bonequinhos
  const WALK_SPEED = 0.42;  // px por ms
  const FPS = 1000 / 30;    // canvas trava em 30fps: é pixel-art, não precisa mais

  // ─── PALETA ─────────────────────────────────────────
  // Lida dos tokens CSS pra seguir o tema automaticamente.
  function palette() {
    const cs = getComputedStyle(root);
    const pick = (n, fb) => (cs.getPropertyValue(n) || '').trim() || fb;
    return {
      accent: pick('--accent', '#2fd4a7'),
      accent2: pick('--accent-2', '#f2a43c'),
      ink: pick('--ink', '#e8ece9'),
      shadow: pick('--shadow', '#26302c'),
      bg: pick('--bg', '#0b0f0e')
    };
  }

  // ─── SPRITE DO OPERÁRIO ─────────────────────────────
  // Grade 8x8. 1 = corpo, 2 = capacete, 0 = vazio.
  // Dois quadros de caminhada: as pernas alternam.
  const SPRITE = {
    idle: [
      '00222000',
      '02222200',
      '00111000',
      '01111100',
      '01111100',
      '00111000',
      '00101000',
      '00101000'
    ],
    walk: [
      '00222000',
      '02222200',
      '00111000',
      '01111100',
      '01111100',
      '00111000',
      '01100100',
      '01000100'
    ],
    work: [
      '00222200',
      '02222200',
      '00111010',
      '01111110',
      '01111100',
      '00111000',
      '00101000',
      '00101000'
    ]
  };

  function drawSprite(ctx, frame, x, y, flip, colors) {
    const grid = SPRITE[frame] || SPRITE.idle;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const v = grid[r][c];
        if (v === '0') continue;
        ctx.fillStyle = v === '2' ? colors.accent2 : colors.accent;
        const cx = flip ? (grid[r].length - 1 - c) : c;
        ctx.fillRect(
          Math.round(x + cx * PIXEL),
          Math.round(y + r * PIXEL),
          PIXEL,
          PIXEL
        );
      }
    }
  }

  // ─── CAMADA DE CANVAS ───────────────────────────────
  const layer = document.createElement('canvas');
  layer.className = 'crew-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const ctx = layer.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    layer.width = Math.round(W * dpr);
    layer.height = Math.round(H * dpr);
    layer.style.width = W + 'px';
    layer.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  resize();

  let resizeTimer = null;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });

  // ─── OPERÁRIOS ──────────────────────────────────────
  const workers = [];
  let colors = palette();

  function makeWorker(x, y) {
    return {
      x, y,
      tx: x, ty: y,
      frame: 'idle',
      flip: false,
      step: 0,
      done: false
    };
  }

  function sendWorker(w, tx, ty) {
    w.tx = tx;
    w.ty = ty;
    w.done = false;
  }

  function tickWorker(w, dt) {
    if (w.done) return;
    const dx = w.tx - w.x;
    const dy = w.ty - w.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      w.x = w.tx;
      w.y = w.ty;
      w.done = true;
      w.frame = 'work';
      return;
    }

    const move = Math.min(WALK_SPEED * dt, dist);
    w.x += (dx / dist) * move;
    w.y += (dy / dist) * move;
    w.flip = dx < 0;
    w.step += dt;
    w.frame = (w.step % 240 < 120) ? 'walk' : 'idle';
  }

  // ─── MASCOTE ────────────────────────────────────────
  // Segue o scroll num canto e comenta a seção atual.
  const mascot = {
    x: 0, y: 0, tx: 0, ty: 0,
    frame: 'idle', flip: false, step: 0,
    visible: false
  };

  const bubble = document.createElement('div');
  bubble.className = 'crew-bubble';
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-live', 'polite');
  document.body.appendChild(bubble);

  let bubbleTimer = null;
  function say(text) {
    if (!text) return;
    bubble.textContent = text;
    bubble.dataset.on = '';
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { delete bubble.dataset.on; }, 3600);
  }

  function placeBubble() {
    bubble.style.left = Math.round(mascot.x + 10 * PIXEL) + 'px';
    bubble.style.top = Math.round(mascot.y - 12) + 'px';
  }

  // ─── LOOP ───────────────────────────────────────────
  let last = performance.now();
  let running = true;

  function loop(now) {
    if (!running) return;
    const dt = Math.min(now - last, 64);
    last = now;

    ctx.clearRect(0, 0, W, H);

    for (const w of workers) {
      tickWorker(w, dt);
      drawSprite(ctx, w.frame, w.x, w.y, w.flip, colors);
    }

    if (mascot.visible) {
      const dx = mascot.tx - mascot.x;
      const dy = mascot.ty - mascot.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        const move = Math.min(WALK_SPEED * 0.8 * dt, dist);
        mascot.x += (dx / dist) * move;
        mascot.y += (dy / dist) * move;
        mascot.flip = dx < 0;
        mascot.step += dt;
        mascot.frame = (mascot.step % 240 < 120) ? 'walk' : 'idle';
      } else {
        mascot.frame = 'idle';
      }
      drawSprite(ctx, mascot.frame, mascot.x, mascot.y, mascot.flip, colors);
      placeBubble();
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Pausa com a aba escondida: não gasta bateria à toa
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }
  });

  // Tema muda: relê as cores
  new MutationObserver(() => { colors = palette(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // ─── INTRO: OS OPERÁRIOS CONSTROEM O HERO ───────────
  const hero = document.getElementById('inicio');
  const header = document.getElementById('siteHeader');
  const skipBtn = document.getElementById('skipIntro');

  // Peças do hero, na ordem em que são construídas
  const parts = hero ? [
    hero.querySelector('.hero-avatar'),
    hero.querySelector('.hero-title'),
    hero.querySelector('.hero-role'),
    hero.querySelector('.hero-note'),
    hero.querySelector('.hero-links')
  ].filter(Boolean) : [];

  let introDone = false;

  function finishIntro(skipped) {
    if (introDone) return;
    introDone = true;

    parts.forEach(p => { p.dataset.solid = ''; });
    if (hero) hero.dataset.phase = 'idle';
    if (header) header.classList.add('is-ready');

    // Os operários não vão embora: passam a rondar a página, visitando
    // cards e títulos enquanto o visitante rola. patrol() cuida disso.
    try { localStorage.setItem('introSeen', '1'); } catch (e) { }

    // Mascote entra depois que a construção termina
    setTimeout(() => {
      mascot.visible = true;
      mascot.x = -40;
      mascot.y = innerHeight - 120;
      mascot.tx = 32;
      mascot.ty = innerHeight - 120;
      if (!skipped) setTimeout(() => say(t('game.welcome')), 900);
    }, skipped ? 0 : 400);

    document.dispatchEvent(new CustomEvent('introdone'));
  }

  // i18n: lê do dicionário já carregado, com fallback
  function t(key) {
    const dict = window.I18N || {};
    const lang = root.lang === 'pt-BR' ? 'pt' : 'en';
    return (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || '';
  }

  function runIntro() {
    if (!hero || !parts.length) { finishIntro(true); return; }

    // Esconde as peças: a partir daqui a intro é responsável por revelá-las
    parts.forEach(p => { p.dataset.part = ''; });
    hero.dataset.phase = 'building';

    // Três operários entram pela esquerda, em alturas diferentes
    const baseY = innerHeight * 0.75;
    for (let i = 0; i < 3; i++) {
      workers.push(makeWorker(-40 - i * 50, baseY + i * 14));
    }

    let at = 0;
    function buildNext() {
      if (introDone) return;
      if (at >= parts.length) {
        // Terminou: operários saem pela direita
        workers.forEach((w, i) => {
          sendWorker(w, W + 60, baseY + i * 14);
          w.frame = 'walk';
        });
        setTimeout(() => finishIntro(false), 700);
        return;
      }

      const part = parts[at++];
      const r = part.getBoundingClientRect();
      // Alvo: canto inferior esquerdo da peça
      const tx = Math.max(8, r.left - 40);
      const ty = Math.min(innerHeight - 40, r.bottom - 32);

      const w = workers[(at - 1) % workers.length];
      sendWorker(w, tx, ty);

      // Os outros acompanham, espalhados
      workers.forEach((o, i) => {
        if (o === w) return;
        sendWorker(o, tx - 60 - i * 40, ty + 10);
      });

      // O relógio manda, não a chegada do operário. Se o rAF for
      // estrangulado (aba em segundo plano, bateria fraca, headless),
      // a peça aparece do mesmo jeito. O boneco é ilustração.
      setTimeout(() => {
        if (introDone) return;
        part.dataset.solid = '';
        buildNext();
      }, 560);
    }

    setTimeout(buildNext, 400);

    // Rede de segurança: a intro esconde o hero inteiro.
    // Em nenhuma circunstância ela pode ficar presa.
    setTimeout(() => finishIntro(true), 9000);
  }

  function skipIntro() { finishIntro(true); }
  if (skipBtn) skipBtn.addEventListener('click', skipIntro);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !introDone) skipIntro();
  });

  // Só na primeira visita (?intro na URL força de novo)
  let seen = false;
  try { seen = localStorage.getItem('introSeen') === '1'; } catch (e) { }
  if (/[?&]intro\b/.test(location.search)) seen = false;

  if (seen) {
    finishIntro(true);
  } else {
    // Espera a fonte: sem ela as peças medem errado
    const ready = document.fonts
      ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))])
      : Promise.resolve();
    ready.then(runIntro);
  }

  // ─── HUD: FASE, XP E PONTUAÇÃO ──────────────────────
  const SECTIONS = [
    { id: 'inicio', key: 'game.s1' },
    { id: 'sobre', key: 'game.s2' },
    { id: 'projetos', key: 'game.s3' },
    { id: 'progresso', key: 'game.s4' },
    { id: 'contato', key: 'game.s5' }
  ];

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML =
    '<span class="hud-phase"></span>' +
    '<span class="hud-bar"></span>' +
    '<span class="hud-score"></span>';
  document.body.appendChild(hud);

  const hudPhase = hud.querySelector('.hud-phase');
  const hudBar = hud.querySelector('.hud-bar');
  const hudScore = hud.querySelector('.hud-score');

  for (let i = 0; i < 16; i++) hudBar.appendChild(document.createElement('span'));

  // Pontuação persistida junto dos segredos
  let score = 0;
  let visited = new Set();
  try {
    score = Number(localStorage.getItem('score')) || 0;
    const v = localStorage.getItem('visited');
    if (v) visited = new Set(JSON.parse(v));
  } catch (e) { }

  function saveScore() {
    try {
      localStorage.setItem('score', String(score));
      localStorage.setItem('visited', JSON.stringify([...visited]));
    } catch (e) { }
  }

  function renderScore() {
    hudScore.textContent = String(score).padStart(5, '0');
  }
  renderScore();

  function addScore(n, why) {
    score += n;
    saveScore();
    renderScore();
    hudScore.dataset.bump = '';
    setTimeout(() => { delete hudScore.dataset.bump; }, 300);
    if (why) say(why);
  }

  // Segredos também pontuam: scripts.js avisa por evento
  document.addEventListener('secret', () => addScore(500, t('game.secret')));

  let current = -1;
  // quiet = só escreve o HUD, sem pontuar nem falar. Usado no estado
  // inicial, que não é uma visita de verdade.
  function setPhase(i, quiet) {
    if (i === current) return;
    current = i;
    const s = SECTIONS[i];
    if (!s) return;

    hudPhase.textContent = (i + 1) + '/' + SECTIONS.length + '  ' + t(s.key);
    [...hudBar.children].forEach((cell, n) => {
      cell.classList.toggle('on', n < Math.round(((i + 1) / SECTIONS.length) * 16));
    });

    // Mascote volta pro canto a cada troca de seção
    if (mascot.visible) {
      mascot.tx = 32;
      mascot.ty = innerHeight - 120;
    }

    if (quiet) return;

    if (!visited.has(s.id)) {
      visited.add(s.id);
      addScore(100, t(s.key + '.say'));
    } else {
      say(t(s.key + '.say'));
    }
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = SECTIONS.findIndex(s => s.id === e.target.id);
        if (i >= 0) setPhase(i);
      });
    }, { rootMargin: '-35% 0px -35% 0px' });

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });

    // Scroll rápido (roda do mouse, Home/End, barra arrastada) pode
    // atravessar a faixa do observer entre dois frames. Este check pega
    // a seção que estiver ocupando o meio da tela.
    let scrollTimer = null;
    addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const mid = innerHeight / 2;
        for (let i = 0; i < SECTIONS.length; i++) {
          const el = document.getElementById(SECTIONS[i].id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) { setPhase(i); break; }
        }
      }, 120);
    }, { passive: true });

    // Clicar num link de nav salta direto, sem atravessar a faixa do
    // observer. Sem isto, pular de Início pra Contato não marca nenhuma
    // fase pelo caminho.
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const i = SECTIONS.findIndex(s => s.id === a.getAttribute('href').slice(1));
      if (i >= 0) setTimeout(() => setPhase(i), 600);
    });
  }

  // ─── PATRULHA ───────────────────────────────────────
  // Depois da intro os operários ficam. Cada um escolhe um alvo que
  // esteja na tela (card, título, barra), caminha até lá, trabalha um
  // pouco e vai pro próximo. Puramente decorativo: o canvas não
  // captura clique e nada do conteúdo depende disto.
  (function patrol() {
    // Só elementos que valem uma visita, não qualquer coisa
    const SPOTS = '.quest-shot, .quest-title, .sec-title, .player-portrait, .stat, .track-row, .passive, .term';

    function visibleSpots() {
      return [...document.querySelectorAll(SPOTS)].filter(el => {
        const r = el.getBoundingClientRect();
        return r.bottom > 40 && r.top < innerHeight - 40 && r.width > 40;
      });
    }

    function sendToSpot(w) {
      const spots = visibleSpots();
      if (!spots.length) {
        // Nada à vista: desce pro rodapé da janela e espera
        sendWorker(w, 20 + Math.random() * (W - 80), innerHeight - 80);
        w.pause = 600 + Math.random() * 900;
        return;
      }
      const spot = spots[Math.floor(Math.random() * spots.length)];
      const r = spot.getBoundingClientRect();
      // Pousa na borda de baixo do alvo, em ponto aleatório da largura
      const x = r.left + Math.random() * Math.max(r.width - 32, 8);
      const y = Math.min(r.bottom - 32, innerHeight - 40);
      sendWorker(w, Math.max(4, Math.min(x, W - 36)), Math.max(4, y));
      // Fica trabalhando um tempo antes de seguir
      w.pause = 900 + Math.random() * 1800;
    }

    // Enquanto o operário está parado no alvo, conta o tempo de pausa.
    // Quando zera, escolhe outro lugar.
    //
    // Timer próprio, não o rAF: se o navegador estrangular os frames
    // (aba em segundo plano, bateria fraca) o operário ficaria parado
    // fora da tela para sempre. Com setInterval ele continua decidindo
    // para onde ir, e o rAF só desenha o resultado.
    setInterval(() => {
      if (document.hidden) return;
      workers.forEach(w => {
        if (!w.done) return;
        w.pause = (w.pause || 0) - 140;
        if (w.pause > 0) return;
        sendToSpot(w);
      });
    }, 140);

    // Primeira saída logo depois da intro
    document.addEventListener('introdone', () => {
      setTimeout(() => workers.forEach((w, i) => {
        w.pause = i * 400;
        w.done = true;
      }), 800);
    });
  })();

  // HUD so aparece depois da intro, ja com a fase 1 escrita:
  // nascer vazio parece quebrado se o observer demorar.
  document.addEventListener('introdone', () => {
    if (current < 0) setPhase(0, true);
    setTimeout(() => { hud.dataset.on = ''; }, 600);
  });

  // ─── CONSTRUÇÃO DAS SEÇÕES AO ROLAR ─────────────────
  // Barras de STATS e timeline enchem célula a célula quando entram.
  function fillBars(container) {
    const bars = container.querySelectorAll('.stat-bar, .track-bar');
    bars.forEach((bar, bi) => {
      const cells = [...bar.children];
      const target = cells.filter(c => c.dataset.want === '1').length;
      cells.forEach(c => c.classList.remove('on'));
      let n = 0;
      const timer = setInterval(() => {
        if (n >= target) { clearInterval(timer); return; }
        cells[n].classList.add('on');
        n++;
      }, 45);
      // Rede de segurança: se o interval travar, preenche tudo
      setTimeout(() => {
        clearInterval(timer);
        cells.forEach(c => { if (c.dataset.want === '1') c.classList.add('on'); });
      }, 45 * target + 1200 + bi * 80);
    });
  }

  // Marca o alvo de cada célula antes de zerar, pra saber o que repreencher
  document.querySelectorAll('.stat-bar, .track-bar').forEach(bar => {
    [...bar.children].forEach(c => {
      if (c.classList.contains('on')) c.dataset.want = '1';
    });
  });

  if ('IntersectionObserver' in window) {
    const seenBars = new WeakSet();
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || seenBars.has(e.target)) return;
        seenBars.add(e.target);
        fillBars(e.target);
        io2.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });

    ['sobre', 'progresso'].forEach(id => {
      const el = document.getElementById(id);
      if (el) io2.observe(el);
    });
  }
})();
