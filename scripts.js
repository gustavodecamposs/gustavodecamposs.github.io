// ─── INIT AOS ────────────────────────────────────────
AOS.init({ once: true, duration: 650, easing: 'ease-out-cubic', offset: 60 });

// ─── NAVBAR SCROLL STATE ──────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ─── CUSTOM CURSOR ────────────────────────────────────
const cursor = document.getElementById('cursor');
let mx = 0, my = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animateCursor() {
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .project-card, .expertise-card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-expand'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-expand'));
});

// ─── SEND BUTTON FEEDBACK ─────────────────────────────
const sendBtn = document.getElementById('sendBtn');
sendBtn.addEventListener('click', () => {
  const orig = sendBtn.textContent;
  sendBtn.textContent = 'Mensagem enviada ✓';
  sendBtn.style.opacity = '0.8';
  setTimeout(() => {
    sendBtn.textContent = orig;
    sendBtn.style.opacity = '';
  }, 2500);
});

// ─── ACTIVE NAV LINK ON SCROLL ────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (active) active.style.color = 'var(--accent-2)';
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => io.observe(s));