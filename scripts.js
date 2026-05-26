// ─── INTRO OVERLAY ────────────────────────────────────
(function () {
  const overlay = document.getElementById('intro-overlay');
  const textEl  = document.getElementById('introText');

  function startAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({ once: true, duration: 400, easing: 'ease-out-quad', offset: 50 });
    }
  }

  if (!overlay || !textEl) { startAOS(); return; }

  const full = 'Gustavo Campos';
  let i = 0;

  document.body.style.overflow = 'hidden';

  function type() {
    if (i <= full.length) {
      textEl.textContent = full.slice(0, i++);
      setTimeout(type, 46);
    }
  }

  setTimeout(type, 100);

  // Abre a cortina após o nome estar escrito
  setTimeout(() => overlay.classList.add('open'), 1000);

  // Remove overlay, libera scroll, inicia AOS
  setTimeout(() => {
    overlay.classList.add('done');
    document.body.style.overflow = '';
    startAOS();
  }, 2000);
})();

// ─── SMOOTH SCROLL (Lenis) ────────────────────────────
const lenis = new Lenis({
  duration: 0.6,
  easing: (t) => 1 - Math.pow(1 - t, 4),
  smoothWheel: true,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// ─── NAVBAR ── muda de estilo ao sair do hero ─────────
const navbar = document.getElementById('navbar');
const hero   = document.getElementById('hero');

function updateNavbar() {
  const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 80;
  navbar.classList.toggle('scrolled', window.scrollY >= heroBottom - 80);
}
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

// ─── MOBILE TOGGLE ────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}



// ─── CONTACT FORM FEEDBACK ────────────────────────────
const form    = document.getElementById('contactForm');
const sendBtn = document.getElementById('sendBtn');

if (form && sendBtn) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome     = document.getElementById('nome').value.trim();
    const email    = document.getElementById('email').value.trim();
    const assunto  = document.getElementById('assunto').value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    const orig = sendBtn.textContent;
    sendBtn.textContent = 'enviando...';
    sendBtn.disabled = true;

    const mailtoUrl = `mailto:gustavoo.dcsilva@gmail.com`
      + `?subject=${encodeURIComponent(assunto || 'Contato pelo portfólio')}`
      + `&body=${encodeURIComponent(`Nome: ${nome}\nEmail: ${email}\n\n${mensagem}`)}`;

    setTimeout(() => {
      window.location.href = mailtoUrl;

      sendBtn.textContent = 'recebido, obrigado! ✓';
      sendBtn.style.background = '#22c55e';
      sendBtn.style.borderColor = '#22c55e';
      sendBtn.disabled = false;

      setTimeout(() => {
        sendBtn.textContent = orig;
        sendBtn.style.background = '';
        sendBtn.style.borderColor = '';
        form.reset();
      }, 4000);
    }, 600);
  });
}

// ─── ACTIVE NAV LINK ──────────────────────────────────
const sections   = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinkEls.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (active) active.style.color = 'var(--ink)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ─── THEME TOGGLE ──────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function getStoredTheme() { try { return localStorage.getItem('theme'); } catch(e) { return null; } }
function getSystemTheme() { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
function getActiveTheme() { return getStoredTheme() || getSystemTheme(); }

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  try { localStorage.setItem('theme', theme); } catch(e) {}
}

function toggleTheme() {
  const current = html.getAttribute('data-theme') || getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Aplica o tema correto ao carregar (o script anti-FOUC já fez, mas garante consistência)
applyTheme(getActiveTheme());

// Botão de toggle
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// Escuta mudanças de preferência do sistema (só aplica se não houver escolha manual)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

// ─── BACK TO TOP ───────────────────────────────────────
const backToTop = document.getElementById('backToTop');

if (backToTop) {
  // Mostra o botão ao passar de 400px de scroll
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  // Clique: sobe suavemente ao topo
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
