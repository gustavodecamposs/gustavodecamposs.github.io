// ─── SMOOTH SCROLL (Lenis) ────────────────────────────
const lenis = new Lenis({
  duration: 0.6,
  easing: (t) => 1 - Math.pow(1 - t, 4), // Easing quartic para ser mais "snappy"
  smoothWheel: true,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// ─── AOS ──────────────────────────────────────────────
AOS.init({
  once: true,
  duration: 400, // Menor duração para surgir mais rápido
  easing: 'ease-out-quad', // Easing mais responsivo e rápido
  offset: 50,
});

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
    navLinks.classList.toggle('open');
  });
}



// ─── CONTACT FORM FEEDBACK ────────────────────────────
const form    = document.getElementById('contactForm');
const sendBtn = document.getElementById('sendBtn');

if (form && sendBtn) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const orig = sendBtn.textContent;
    sendBtn.textContent = 'mensagem enviada ✓';
    sendBtn.style.background = '#22c55e';
    sendBtn.style.borderColor = '#22c55e';
    setTimeout(() => {
      sendBtn.textContent = orig;
      sendBtn.style.background = '';
      sendBtn.style.borderColor = '';
    }, 3000);
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
