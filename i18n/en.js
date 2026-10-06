// Inglês é o idioma padrão e a fonte da verdade: o HTML estático já vem em
// inglês, então crawlers e visitantes sem JS leem texto real.
// Toda chave adicionada aqui tem que existir também em pt.js.
window.I18N = window.I18N || {};
window.I18N.en = {
  // ─── META ───────────────────────────────────────────
  'meta.title': 'Gustavo de Campos — Front-End Developer',
  'meta.description': 'Gustavo de Campos is a front-end developer in Angra dos Reis, Brazil, building responsive, accessible web interfaces with care for the details.',
  'meta.ogDescription': 'Responsive, accessible web interfaces, built with care for the details.',
  'meta.locale': 'en_US',

  // ─── NAV ────────────────────────────────────────────
  'skip': 'Skip to content',
  'nav.label': 'Main',
  'nav.home': 'Gustavo de Campos, home',
  'nav.about': 'About',
  'nav.projects': 'Projects',
  'nav.progress': 'Progress',
  'nav.contact': 'Contact',
  'nav.available': 'Available for work',
  'lang.label': 'Language',
  'menu.open': 'Menu',
  'menu.close': 'Close',
  'theme.toLight': 'Switch to light theme',
  'theme.toDark': 'Switch to dark theme',

  // ─── HERO ───────────────────────────────────────────
  'hero.skip': 'Skip intro',
  'hero.avatarAlt': 'Illustration of Gustavo de Campos smiling, on a teal background.',
  'hero.role': 'A <em>detail-minded</em> front-end developer in Angra dos Reis, Brazil.',
  'hero.note': 'I spend hours on details 99% of people will never notice. The ones who do, don’t forget.',

  // ─── ABOUT ──────────────────────────────────────────
  'about.index': '01 — About',
  'about.title': 'Choose your player',
  'about.player': 'Player 1',
  'about.lvl': 'Lvl',
  'about.class': 'Class',
  'about.classValue': 'Front-End Developer',
  'about.loc': 'Base',
  'about.since': 'Since',
  'about.sinceValue': '2024 · 3 years in the field',
  'about.p1': 'I build web interfaces that work for the person on the other side of the screen — not just for the spec. Two of them are running in production for my city hall right now.',
  'about.p2': 'When I am not coding, I am listening to music, hunting for design references, or trying to figure out why that CSS did not do what I wanted.',
  'about.inventory': 'Inventory',
  'about.inProduction': 'in production',
  'about.study': 'Study',
  'about.loginStudy': 'Bootstrap login screen',
  'about.stats': 'Stats',
  'about.passives': 'Passive skills',
  'about.special': 'Special move',
  'about.pr1.title': 'Empathy first',
  'about.pr1.text': 'I think about the person on the other side of the screen before I think about the code.',
  'about.pr2.title': 'Details matter',
  'about.pr2.text': 'Spacing, contrast, the weight of a word. Small decisions are what make a page feel finished.',
  'about.pr3.title': 'Mobile first',
  'about.pr3.text': 'Most people arrive on a phone. That is where I start, not where I patch things up.',
  'about.pr4.title': 'Always learning',
  'about.pr4.text': 'Front end got me in. Back end is where I am heading, one project at a time.',

  // ─── PROJECTS ───────────────────────────────────────
  'projects.index': '02 — Projects',
  'projects.title': 'Look what we shipped',
  'projects.lede': 'Two systems serving the city of Angra dos Reis, both live. Click through and poke at them.',
  'projects.done': 'Completed',
  'projects.client': 'Client',
  'projects.year': 'Year',
  'projects.role': 'Role',
  'projects.stack': 'Stack',
  'projects.visit': 'See it live',
  'projects.side': 'Side quest',
  'projects.sideText': 'My first Bootstrap 5 project — where I learned that plain CSS and a framework complement each other.',
  'projects.note': 'Freelance work shows up here once clients approve publication.',
  'siga.alt': 'SIGA Angra interface showing a city map with data layers.',
  'siga.desc': 'The city hall geographic information system. Residents and staff use it to find what is where across the municipality.',
  'siga.client': 'City of Angra dos Reis',
  'siga.role': 'Entire front end — interface, UX, visual integration with map data',
  'talentos.alt': 'Banco de Talentos interface listing job openings.',
  'talentos.desc': 'Job openings and a registry of local professionals. My first full-stack build: database to interface.',
  'talentos.role': 'Full stack, database to interface',

  // ─── PROGRESS ───────────────────────────────────────
  'progress.index': '03 — Progress',
  'progress.title': 'Three years, two systems live',
  'progress.lede': 'Not a commit graph. The work that actually shipped, year by year.',
  'progress.y1': 'SIGA Angra went live · started front end',
  'progress.y2': 'Banco de Talentos went live · first full-stack build',
  'progress.y3': 'Freelance · going deeper into back end',
  'progress.years': 'years',
  'progress.systems': 'systems in production',
  'progress.city': 'city served',

  // ─── CONTACT ────────────────────────────────────────
  'contact.index': '04 — Contact',
  'contact.title': 'Go on, say hi',
  'contact.lede': 'Type a command, or just use the buttons. Both get to me.',
  'contact.channels': 'Channels',
  'contact.email': 'Email',
  'contact.termLabel': 'Type a command. Try help.',
  'contact.whatsapp': 'https://wa.me/5524974051952?text=Hi%2C%20I%20saw%20your%20portfolio%20and%20would%20like%20to%20talk!',
  'contact.whatsappCta': 'Talk on WhatsApp',

  // ─── TERMINAL (consumido só pelo JS) ────────────────
  'term.boot': 'Connected. 4 secrets hidden on this page.',
  'term.hint': 'Type help to see what I can do.',
  'term.help': 'help       this list\nwpp        open WhatsApp\nmail       copy my email\ngithub     open GitHub\nlinkedin   open LinkedIn\ninstagram  open Instagram\nsend <msg> send me a message\nclear      clear the screen',
  'term.openWpp': 'Opening WhatsApp...',
  'term.wppText': 'Hi, I saw your portfolio and would like to talk!',
  'term.copied': 'Copied:',
  'term.opening': 'Opening',
  'term.sendUsage': 'Usage: send your message here',
  'term.sendOpening': 'Opening your email client...',
  'term.sendSubject': 'Contact from the portfolio',
  'term.unknown': 'Command not found: {cmd}. Try help.',
  'term.coffee': 'Fuel located.',
  'term.sudo': 'Nice try.',

  // ─── FOOTER ─────────────────────────────────────────
  'footer.copy': '© 2026 Gustavo de Campos. Handmade, with plenty of coffee.',
  'footer.secrets': 'Secrets',
  'footer.toTop': 'Back to top'
};
