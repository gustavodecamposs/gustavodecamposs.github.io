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

// ─── CUSTOM CURSOR ────────────────────────────────────
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursor-trail');

if (cursor && trail) {
  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  function animTrail() {
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animTrail);
  }
  animTrail();

  document.querySelectorAll('a, button, .card-small, .project-item, .channel-item').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
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