const reducedMotion = !document.documentElement.classList.contains('motion');
const root = document.documentElement;

// ─── i18n ─────────────────────────────────────────────
// Três atributos no HTML:
//   data-i18n="chave"            → textContent
//   data-i18n-html="chave"       → innerHTML (valores com <em>, setas)
//   data-i18n-attr="attr:chave"  → setAttribute, vários pares com ;
const HTML_LANG = { en: 'en', pt: 'pt-BR' };
let lang = 'en';

function t(key) {
  const dict = window.I18N || {};
  return (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || key;
}

function applyLang(next) {
  lang = next;
  root.lang = HTML_LANG[next] || next;

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(';').forEach(pair => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });

  document.querySelectorAll('.lang-btn').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === next));
  });

  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: next } }));
}

(function initLang() {
  const q = /[?&]lang=(en|pt)\b/.exec(location.search);
  let stored = null;
  try { stored = localStorage.getItem('lang'); } catch (e) { }
  applyLang((q ? q[1] : stored) === 'pt' ? 'pt' : 'en');
  root.classList.remove('i18n-pending');

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.lang;
      if (next === lang) return;
      try { localStorage.setItem('lang', next); } catch (e) { }
      // Fade curto pra troca não parecer um salto
      if (!reducedMotion) {
        root.classList.add('is-switching');
        setTimeout(() => { applyLang(next); root.classList.remove('is-switching'); }, 180);
      } else {
        applyLang(next);
      }
    });
  });
})();

// ─── BARRAS (stats e timeline) ────────────────────────
// Células geradas em JS: o markup fica limpo e o valor acessível
// já está no aria-label do container.
(function buildBars() {
  document.querySelectorAll('.stat-bar').forEach(bar => {
    const level = Number(bar.dataset.level) || 0;
    bar.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('span');
      if (i < level) cell.className = 'on';
      bar.appendChild(cell);
    }
  });

  document.querySelectorAll('.track-bar').forEach(bar => {
    const fill = Number(bar.dataset.fill) || 0;
    const total = Number(bar.dataset.total) || 16;
    bar.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const cell = document.createElement('span');
      if (i < fill) cell.className = 'on';
      bar.appendChild(cell);
    }
  });
})();

// ─── HERO: INTRO "BUILD" ──────────────────────────────
// Fallback: so roda quando game.js nao assume (sem motion, ou falha de rede).
// Divide o titulo em letras e revela o hero sem a construcao com operarios.
(function heroIntro() {
  const hero = document.getElementById('inicio');
  const header = document.getElementById('siteHeader');
  const skip = document.getElementById('skipIntro');
  if (!hero) return;

  const host = hero.querySelector('[data-letters]');
  if (host) {
    const text = host.textContent;
    host.textContent = '';
    // Cada palavra vira um bloco que nao se parte; as letras dentro dela
    // continuam individuais pra animacao de entrada. Assim o titulo quebra
    // entre palavras, nunca no meio do nome.
    let i = 0;
    text.split(' ').forEach((word, w, all) => {
      const group = document.createElement('span');
      group.className = 'word';
      [...word].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.style.setProperty('--i', String(i++));
        span.textContent = ch;
        group.appendChild(span);
      });
      host.appendChild(group);
      if (w < all.length - 1) {
        const gap = document.createElement('span');
        gap.className = 'letter is-space';
        gap.style.setProperty('--i', String(i++));
        gap.textContent = ' ';
        host.appendChild(gap);
      }
    });
  }

  function finish() {
    hero.dataset.phase = 'idle';
    if (header) header.classList.add('is-ready');
  }

  if (reducedMotion) { finish(); return; }

  // game.js assume a intro quando carrega. Este caminho continua existindo
  // como fallback: se game.js falhar, o hero ainda aparece.
  if (window.__gameIntro) return;

  const letters = host ? host.children.length : 0;
  // Espera a fonte, senão as letras entram no tamanho errado. Timeout evita
  // travar a intro se a Google Fonts demorar.
  const fontReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))])
    : Promise.resolve();

  let done = false;
  function skipIntro() {
    if (done) return;
    done = true;
    finish();
  }

  fontReady.then(() => {
    if (done) return;
    // Fallback sem game.js: revela direto, sem fase intermediaria
    setTimeout(skipIntro, letters * 30 + 300);
  });

  // Rede de segurança: a intro esconde o hero inteiro, então em nenhuma
  // circunstância ela pode ficar presa. Se algo falhar, vai pra idle.
  setTimeout(skipIntro, 4000);

  if (skip) skip.addEventListener('click', skipIntro);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hero.dataset.phase !== 'idle') skipIntro();
  });
})();

// ─── REVEAL AO ROLAR ──────────────────────────────────
// O reveal é enfeite: nunca pode deixar conteúdo escondido. Por isso
// existe uma rede de segurança que revela tudo se o observer não agir.
(function reveal() {
  // Títulos de seção viram letras individuais, como o hero. O texto
  // original fica no aria-label pra não ser soletrado por leitor de tela.
  document.querySelectorAll('.sec-title').forEach(title => {
    const text = title.textContent.trim();
    if (!text || title.querySelector('.letter')) return;
    title.setAttribute('aria-label', text);
    title.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, w, all) => {
      const group = document.createElement('span');
      group.className = 'word';
      group.setAttribute('aria-hidden', 'true');
      [...word].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.style.setProperty('--i', String(i++));
        span.textContent = ch;
        group.appendChild(span);
      });
      title.appendChild(group);
      if (w < all.length - 1) {
        const gap = document.createElement('span');
        gap.className = 'letter is-space';
        gap.setAttribute('aria-hidden', 'true');
        gap.style.setProperty('--i', String(i++));
        gap.textContent = ' ';
        title.appendChild(gap);
      }
    });
    title.setAttribute('data-reveal', '');
  });

  // Numera os filhos da cascata: o CSS lê --i pra escalonar o atraso.
  document.querySelectorAll('[data-cascade]').forEach(list => {
    [...list.children].forEach((child, i) => child.style.setProperty('--i', String(i)));
  });

  // Coletado só agora: a divisão acima marca os títulos com data-reveal.
  const items = [...document.querySelectorAll('[data-reveal], [data-lay], [data-cascade]')];
  const showAll = () => items.forEach(el => el.classList.add('is-in'));

  if (reducedMotion || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  // threshold em vez de rootMargin: o bloco só entra quando boa parte
  // dele já está na tela. Disparar no primeiro pixel faz a animação
  // rodar fora do campo de visão e chegar pronta — o movimento se perde.
  //
  // Dois thresholds porque um elemento mais alto que a janela nunca
  // alcança 30% de si mesmo: para esses vale o 0, e quem decide é a
  // fração da JANELA ocupada, não a do elemento.
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const tall = entry.target.getBoundingClientRect().height > innerHeight * 0.8;
      const enough = tall
        ? entry.intersectionRect.height > innerHeight * 0.3
        : entry.intersectionRatio >= 0.3;
      if (!enough) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: [0, 0.3] });

  items.forEach(el => io.observe(el));

  // Se depois de 3s algo continuar escondido (observer travado, aba em
  // segundo plano, print do navegador), mostra assim mesmo.
  setTimeout(showAll, 3000);
  addEventListener('beforeprint', showAll);
})();

// ─── TÍTULO DE QUEST: DECODIFICA ──────────────────────
// O nome do projeto passa por caracteres aleatórios e assenta no texto
// certo, uma letra de cada vez. O texto final já está no HTML: se o
// efeito não rodar, o nome continua lá, legível.
(function decodeTitles() {
  const titles = [...document.querySelectorAll('.quest-title')];
  if (!titles.length || reducedMotion || !('IntersectionObserver' in window)) return;

  const GLYPHS = '#@%&$*+=<>/\\|[]{}';

  function decode(el) {
    const real = el.textContent;
    let frame = 0;
    const total = real.length * 2 + 6;

    const timer = setInterval(() => {
      frame++;
      // Quantas letras já assentaram
      const settled = Math.floor((frame / total) * real.length);
      let out = '';
      for (let i = 0; i < real.length; i++) {
        if (i < settled || real[i] === ' ') out += real[i];
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (frame >= total) {
        clearInterval(timer);
        el.textContent = real;
      }
    }, 40);

    // Rede de segurança: o nome do projeto não pode ficar embaralhado
    setTimeout(() => { clearInterval(timer); el.textContent = real; }, total * 40 + 600);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting || e.intersectionRatio < 0.3) return;
      io.unobserve(e.target);
      decode(e.target);
    });
  }, { threshold: [0, 0.3] });

  titles.forEach(el => io.observe(el));
})();

// ─── HEADER SÓLIDO AO ROLAR ───────────────────────────
(function headerSolid() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

// ─── NAV: SEÇÃO ATIVA ─────────────────────────────────
(function activeNav() {
  const links = [...document.querySelectorAll('[data-nav]')];
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) byId.set(sec, a);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = byId.get(entry.target);
      if (!link) return;
      link.classList.toggle('is-active', entry.isIntersecting);
      if (entry.isIntersecting) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  byId.forEach((_, sec) => io.observe(sec));
})();

// ─── VOLTAR AO TOPO ───────────────────────────────────
(function toTop() {
  const btn = document.getElementById('toTop');
  const hero = document.getElementById('inicio');
  if (!btn || !hero || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([entry]) => {
    btn.classList.toggle('is-visible', !entry.isIntersecting);
  });
  io.observe(hero);
})();

// ─── MENU MOBILE ──────────────────────────────────────
(function mobileMenu() {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  // inert tira o fundo da ordem de tab e dos leitores de tela
  const background = () => document.querySelectorAll('main, .site-footer, .brand, .nav-tools > :not(#menuBtn)');

  function open() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    background().forEach(el => el.setAttribute('inert', ''));
    const first = menu.querySelector('a');
    if (first) first.focus();
  }

  function close() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    background().forEach(el => el.removeAttribute('inert'));
    btn.focus();
  }

  btn.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
  matchMedia('(min-width: 861px)').addEventListener('change', e => {
    if (e.matches && !menu.hidden) close();
  });
})();

// ─── TEMA ─────────────────────────────────────────────
// Segue o sistema até o visitante escolher; depois a escolha manda.
(function theme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  function label() {
    const isDark = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-label', t(isDark ? 'theme.toLight' : 'theme.toDark'));
  }

  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { }
    label();
  });

  matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch (err) { }
    if (stored) return;
    root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    label();
  });

  document.addEventListener('langchange', label);
  label();
})();

// ─── SEGREDOS ─────────────────────────────────────────
// Contador no footer. Nenhum conteúdo real depende de achar um segredo.
const secrets = (function () {
  const TOTAL = 4;
  const out = document.getElementById('secretsFound');
  let found = new Set();

  try {
    const raw = localStorage.getItem('secrets');
    if (raw) found = new Set(JSON.parse(raw));
  } catch (e) { }

  function render() {
    if (out) out.textContent = String(found.size);
  }

  function unlock(id) {
    if (found.has(id)) return false;
    found.add(id);
    try { localStorage.setItem('secrets', JSON.stringify([...found])); } catch (e) { }
    render();
    document.dispatchEvent(new CustomEvent('secret', { detail: { id } }));
    return true;
  }

  render();
  return { unlock, total: TOTAL, has: id => found.has(id) };
})();

// Konami: inverte o tema por 3s
(function konami() {
  const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let at = 0;
  let busy = false;

  document.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    at = key === SEQ[at] ? at + 1 : (key === SEQ[0] ? 1 : 0);
    if (at < SEQ.length) return;
    at = 0;
    if (busy) return;
    busy = true;
    secrets.unlock('konami');

    const before = root.getAttribute('data-theme');
    root.setAttribute('data-theme', before === 'dark' ? 'light' : 'dark');
    setTimeout(() => { root.setAttribute('data-theme', before); busy = false; }, 3000);
  });
})();


// ─── TERMINAL ─────────────────────────────────────────
(function terminal() {
  const out = document.getElementById('termOut');
  const input = document.getElementById('termInput');
  const mirror = document.getElementById('termMirror');
  if (!out || !input || !mirror) return;

  const MAIL = input.dataset.mail;
  const WPP = 'https://wa.me/5524974051952';
  const LINKS = {
    github: 'https://github.com/gustavodecamposs',
    linkedin: 'https://www.linkedin.com/in/gustavodecamposs/',
    instagram: 'https://www.instagram.com/gustavoo.dcs/'
  };

  function print(text, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  }

  function echo(cmd) {
    print('guest@gustavodecampos:~$ ' + cmd, 'cmd');
  }

  function boot() {
    out.innerHTML = '';
    print(t('term.boot'), 'dim');
    print(t('term.hint'), 'ok');
  }

  const commands = {
    help() {
      print(t('term.help'));
    },
    wpp() {
      print(t('term.openWpp'), 'ok');
      open(WPP + '?text=' + encodeURIComponent(t('term.wppText')), '_blank', 'noopener');
    },
    async mail() {
      if (!navigator.clipboard) {
        print(MAIL, 'ok');
        return;
      }
      try {
        await navigator.clipboard.writeText(MAIL);
        print(t('term.copied') + ' ' + MAIL, 'ok');
      } catch (e) {
        print(MAIL, 'ok');
      }
    },
    github() {
      print(t('term.opening') + ' GitHub', 'ok');
      open(LINKS.github, '_blank', 'noopener');
    },
    linkedin() {
      print(t('term.opening') + ' LinkedIn', 'ok');
      open(LINKS.linkedin, '_blank', 'noopener');
    },
    instagram() {
      print(t('term.opening') + ' Instagram', 'ok');
      open(LINKS.instagram, '_blank', 'noopener');
    },
    send(rest) {
      if (!rest) {
        print(t('term.sendUsage'), 'warn');
        return;
      }
      print(t('term.sendOpening'), 'ok');
      const url = 'mailto:' + MAIL
        + '?subject=' + encodeURIComponent(t('term.sendSubject'))
        + '&body=' + encodeURIComponent(rest);
      location.href = url;
    },
    clear() {
      out.innerHTML = '';
    },
    coffee() {
      print(t('term.coffee'), 'warn');
      print('   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   `----\'', 'dim');
      secrets.unlock('coffee');
    },
    sudo() {
      print(t('term.sudo'), 'warn');
      secrets.unlock('sudo');
    }
  };

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    echo(line);

    const space = line.indexOf(' ');
    const name = (space === -1 ? line : line.slice(0, space)).toLowerCase();
    const rest = space === -1 ? '' : line.slice(space + 1).trim();

    const fn = commands[name];
    if (fn) fn(rest);
    else print(t('term.unknown').replace('{cmd}', name), 'warn');
  }

  input.addEventListener('input', () => { mirror.textContent = input.value; });
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    run(input.value);
    input.value = '';
    mirror.textContent = '';
  });

  // Clicar em qualquer canto do terminal foca o campo
  input.closest('.term').addEventListener('click', e => {
    if (!e.target.closest('a')) input.focus();
  });

  boot();
  document.addEventListener('langchange', boot);
})();
