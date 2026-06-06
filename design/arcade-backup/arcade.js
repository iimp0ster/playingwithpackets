/* Playing with Packets — arcade engine
   Ported from design/prototype.html. Data-driven via /assets/sections.json.
   FLIP SHELL is only enabled when the URL contains ?dev=1.
*/

/* ============================================================
   COLOR HELPERS
   ============================================================ */
function hexToRgb(h){h=h.replace('#','');return{r:parseInt(h.substr(0,2),16),g:parseInt(h.substr(2,2),16),b:parseInt(h.substr(4,2),16)};}
function rgbToHex(r,g,b){return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}
function darker(hex,pct){const c=hexToRgb(hex);const f=1-pct/100;return rgbToHex(Math.round(c.r*f),Math.round(c.g*f),Math.round(c.b*f));}
function lighter(hex,pct){const c=hexToRgb(hex);const f=pct/100;return rgbToHex(
  Math.min(255,Math.round(c.r+(255-c.r)*f)),Math.min(255,Math.round(c.g+(255-c.g)*f)),
  Math.min(255,Math.round(c.b+(255-c.b)*f)));}

/* ============================================================
   PIXEL ART RENDERER
   ============================================================ */
function pixelArt(grid, palette, scale, offX, offY) {
  let rects = '';
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (ch === '.' || ch === ' ') continue;
      const fill = palette[ch];
      if (!fill) continue;
      rects += `<rect x="${offX + x*scale}" y="${offY + y*scale}" width="${scale}" height="${scale}" fill="${fill}"/>`;
    }
  }
  return rects;
}

/* ============================================================
   WEAPON GLYPHS — 16×16, bold silhouettes
   X=outline 1=color W=white/highlight 2=lighter accent
   All kept in registry even if not currently in sections.yml,
   so future crates can reference them without engine changes.
   ============================================================ */
const W_HMG = [
  '................','................','................','......XXXXX.....',
  '.....X11111X....', '.XXXX22222XXXX..','X111111111111X..','X1WWWWWWWWWW1X..',
  'X1111111111XXX..','XXXXXX111XX.....', '.....X111X......','.....X111X......',
  '....XX111XX.....','....X11111X.....','....XXXXXXX.....','................'
];
const W_ROCKET = [
  '.............X..','............X1X.','...........X1WX.','..........X11X..',
  '.........X11X...','....XXXXXX1X....','...X111111X.....','...X1WWWW1X.....',
  '...X111111X.....','...XXXXXXXX.....','.....X11X.......','.....X11X.......',
  '....XX11XX......','....X1111X......','....XXXXXX......','................'
];
const W_FLAME = [
  '.......X........','......X1X.......','.....X1WX.......','....X1WW1X......',
  '...X1WW2W1X.....','..X1WW222W1X....','..X1W22222W1X...','.X1W2222222W1X..',
  '.X1W22WW22W1X...','..X1W2222W1X....','..XX1WWWW1XX....','...XX1111XX.....',
  '....XXXXXX......','.....X11X.......','.....XXXX.......','................'
];
const W_CHASER = [
  '..XX............','.X11X...........','.X1WX...XX......','.XX1X..X11X.....',
  '..X1X..X1WX.....','..X1X..XX1X.....','..X1X...X1X.....','..X1X...X1X.....',
  '..X1X...X1X.....','..X1X...X1X.....','.XX1XX.XX1XX....','.X111X.X111X....',
  '.X1W1X.X1W1X....','.XXXXX.XXXXX....','................','................'
];
const W_SHOT = [
  '................','................','....XXXXXXXXX...','...X111111111X..',
  '..X11111111111X.','..X1WWWWWWWW11X.','..X11111111XXXX.','..XXXXXX111X....',
  '......X111X.....','......X111X.....','.....XX111XX....','.....X11111X....',
  '.....XXXXXXX....','................','................','................'
];
const W_GRENADE = [
  '.......XX.......','......X11X......','.....X1XX1X.....','....XXXXXXXX....',
  '...X11111111X...','..X1WW111111X...','.X1WW11111111X..','.X111111111111X.',
  '.X111111111111X.','.X111111111111X.','..X11111111111X.','..X11111111111X.',
  '...X1111111111X.','....XXXXXXXX....','................','................'
];
const W_CRATE = [
  '................',
  '....XXXXXXXX....',
  '...X11111111X...',
  '...X1WWWWWW1X...',
  '...X11111111X...',
  '...XXXXXXXXXX...',
  '...X1X2222X1X...',
  '...X1X2222X1X...',
  '...XXXXXXXXXX...',
  '...X11111111X...',
  '...X1WWWWWW1X...',
  '...X11111111X...',
  '....XXXXXXXX....',
  '................',
  '................',
  '................'
];

const GLYPHS = {
  HMG: W_HMG, ROCKET: W_ROCKET, FLAME: W_FLAME,
  CHASER: W_CHASER, SHOT: W_SHOT, GRENADE: W_GRENADE, CRATE: W_CRATE
};

/* ============================================================
   WEAPON PICKUP CAPSULE RENDERER
   ============================================================ */
function weaponPickup(glyph, color, letter) {
  const dk = darker(color, 38);
  const lt = lighter(color, 28);
  const outline = '#160a08';
  const palette = { 'X': outline, '1': color, 'W':'#fff8e8', '2': lighter(color,45), '3': darker(color,18) };
  const gScale = 1.6;
  const gW = 16 * gScale;
  const panelX = 14, panelY = 14, panelW = 32, panelH = 30;
  const offX = panelX + (panelW - gW) / 2;
  const offY = panelY + (panelH - gW) / 2;

  return `<svg viewBox="0 0 60 72" width="100%" height="100%">
    <ellipse cx="30" cy="68" rx="19" ry="3" fill="rgba(0,0,0,.45)"/>
    <rect x="9" y="5" width="42" height="60" rx="9" fill="${outline}"/>
    <rect x="11" y="7" width="38" height="56" rx="7" fill="${color}"/>
    <rect x="11" y="7" width="38" height="22" rx="7" fill="${lt}" opacity="0.55"/>
    <rect x="14" y="9" width="30" height="3" rx="1.5" fill="#fff8e8" opacity="0.6"/>
    <rect x="13" y="13" width="34" height="32" rx="3" fill="${dk}"/>
    <rect x="13" y="13" width="34" height="32" rx="3" fill="none" stroke="${outline}" stroke-width="1"/>
    <g shape-rendering="crispEdges">${pixelArt(glyph, palette, gScale, offX, offY)}</g>
    <rect x="16" y="48" width="28" height="12" rx="2" fill="${outline}"/>
    <rect x="17" y="49" width="26" height="10" rx="1" fill="${color}"/>
    <text x="30" y="57.5" text-anchor="middle" font-family="'Press Start 2P',monospace" font-size="7" fill="#160a08">${letter}</text>
  </svg>`;
}

/* ============================================================
   GAME BOY CARTRIDGE RENDERER
   ============================================================ */
function gameBoyCartridge(section) {
  const color = section.color || '#7a7458';
  const dk = darker(color, 40);
  const lt = lighter(color, 42);
  const body = '#c2bab0';
  const bodyDk = '#9a9288';
  const bodyHi = '#dbd3c8';
  const gold = '#c8a830';
  const goldHi = lighter(gold, 35);
  const outline = '#18100c';

  const sub = (section.sub || section.id.toUpperCase()).split(/\s+/);
  const l1 = sub.slice(0, 2).join(' ');
  const l2 = sub.slice(2).join(' ');

  return `<svg viewBox="0 0 60 72" width="100%" height="100%">
    <ellipse cx="30" cy="70" rx="22" ry="2" fill="rgba(0,0,0,.4)"/>
    <rect x="4" y="12" width="52" height="56" rx="4" fill="${outline}"/>
    <rect x="5" y="13" width="50" height="54" rx="3" fill="${body}"/>
    <rect x="5" y="13" width="50" height="13" rx="3" fill="${bodyDk}"/>
    <rect x="5" y="13" width="50" height="4" rx="3" fill="${bodyHi}" opacity=".4"/>
    <rect x="15" y="4" width="30" height="14" rx="3" fill="${outline}"/>
    <rect x="16" y="5" width="28" height="12" rx="2" fill="#0c0a14"/>
    <rect x="17" y="5" width="4" height="10" rx="1" fill="${gold}"/>
    <rect x="23" y="5" width="4" height="10" rx="1" fill="${gold}"/>
    <rect x="29" y="5" width="4" height="10" rx="1" fill="${gold}"/>
    <rect x="35" y="5" width="4" height="10" rx="1" fill="${gold}"/>
    <rect x="17" y="5" width="4" height="3" rx="1" fill="${goldHi}" opacity=".6"/>
    <rect x="23" y="5" width="4" height="3" rx="1" fill="${goldHi}" opacity=".6"/>
    <rect x="29" y="5" width="4" height="3" rx="1" fill="${goldHi}" opacity=".6"/>
    <rect x="35" y="5" width="4" height="3" rx="1" fill="${goldHi}" opacity=".6"/>
    <rect x="7" y="28" width="46" height="34" rx="2" fill="${outline}"/>
    <rect x="8" y="29" width="44" height="32" rx="1.5" fill="${color}"/>
    <rect x="8" y="29" width="44" height="10" rx="1.5" fill="${lt}" opacity=".38"/>
    <text x="30" y="45" text-anchor="middle" font-family="'Press Start 2P',monospace" font-size="12" fill="rgba(0,0,0,.65)">${section.letter}</text>
    <text x="30" y="54" text-anchor="middle" font-family="'Press Start 2P',monospace" font-size="4" fill="${outline}" opacity=".85">${l1}</text>
    ${l2 ? `<text x="30" y="60" text-anchor="middle" font-family="'Press Start 2P',monospace" font-size="4" fill="${outline}" opacity=".85">${l2}</text>` : ''}
    <rect x="5" y="61" width="8" height="6" rx="2" fill="${bodyDk}"/>
    <rect x="47" y="61" width="8" height="6" rx="2" fill="${bodyDk}"/>
    <rect x="4" y="12" width="52" height="56" rx="4" fill="none" stroke="${outline}" stroke-width="1.5"/>
  </svg>`;
}

/* ============================================================
   ENGINE STATE
   ============================================================ */
let sections = [];
let view = 'boot', selected = 0, cols = 2, activeShell = null;

function isGbShell() {
  if (document.body.classList.contains('force-gb')) return true;
  if (document.body.classList.contains('force-arcade')) return false;
  return window.matchMedia('(max-width: 719px)').matches;
}

/* ============================================================
   SHELL MOUNTING
   ============================================================ */
function mountScreen() {
  const wantsGb = isGbShell();
  const wants = wantsGb ? 'gb' : 'arcade';
  if (wants === activeShell) return;
  activeShell = wants;
  const target = wantsGb ? document.getElementById('gb-screen') : document.getElementById('cab-screen');
  document.getElementById('gb-screen').innerHTML = '';
  document.getElementById('cab-screen').innerHTML = '';
  const tpl = document.getElementById('screen-template').content.cloneNode(true);
  target.appendChild(tpl);
  target.querySelector('.back-btn').addEventListener('click', goBack);
  updateShellCopy();
  if (view === 'boot') runBoot();
  else if (view === 'menu') { showView('menu'); renderGrid(); renderPreview(); }
  else { showView('detail'); renderDetail(sections[selected]); }
}

function updateShellCopy() {
  const isGb = activeShell === 'gb';
  const title = $('.menu-title');
  if (title) title.textContent = isGb ? 'SELECT GAME' : 'SELECT // WEAPON';
  const press = $('.preview-press');
  if (press) press.textContent = isGb ? '▶ PRESS A TO INSERT' : '▶ PRESS A TO EQUIP';
}

function $(sel) {
  const root = activeShell === 'gb' ? document.getElementById('gb-screen') : document.getElementById('cab-screen');
  return root ? root.querySelector(sel) : null;
}
function $$(sel) {
  const root = activeShell === 'gb' ? document.getElementById('gb-screen') : document.getElementById('cab-screen');
  return root ? root.querySelectorAll(sel) : [];
}

/* ============================================================
   BOOT SEQUENCE
   ============================================================ */
const bootLines = [
  '[<span class="ok">OK</span>] SYSTEM POWER ON',
  '[<span class="ok">OK</span>] LOADING DETECTION ROM v6.1',
  '[<span class="ok">OK</span>] ARMORY INITIALIZED',
  '[<span class="ok">OK</span>] MISSION READY'
];

function runBoot() {
  if (activeShell === 'gb') { runGbBoot(); return; }
  runArcadeBoot();
}

function runArcadeBoot() {
  const msgs = $('.boot-msgs'); const fill = $('.loading-fill');
  if (!msgs || !fill) return;
  msgs.innerHTML = bootLines.map(l => `<div class="boot-msg">${l}</div>`).join('');
  const lines = msgs.querySelectorAll('.boot-msg');
  let i = 0;
  const li = setInterval(() => { if (i >= lines.length) { clearInterval(li); return; } lines[i].classList.add('shown'); i++; }, 260);
  let pct = 0;
  const fi = setInterval(() => { pct += 3; if (pct >= 100) { pct = 100; clearInterval(fi); } fill.style.width = pct + '%'; }, 50);
  setTimeout(() => { const ps = $('.press-start'); if (ps) ps.classList.add('shown'); }, 1500);
}

function runGbBoot() {
  const msgs = $('.boot-msgs');
  if (!msgs) return;
  msgs.innerHTML = '<div class="gb-boot-logo">PWP</div><div class="gb-boot-sub">PLAYING WITH PACKETS</div>';
  const logo = msgs.querySelector('.gb-boot-logo');
  const sub = msgs.querySelector('.gb-boot-sub');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (logo) logo.classList.add('drop');
    setTimeout(() => { if (sub) sub.classList.add('shown'); }, 600);
  }));
  setTimeout(() => { const ps = $('.press-start'); if (ps) ps.classList.add('shown'); }, 1500);
}

/* ============================================================
   MENU — grid + preview
   ============================================================ */
function renderGrid() {
  const grid = $('.cart-grid'); if (!grid) return;
  const isGb = activeShell === 'gb';
  grid.innerHTML = sections.map((c, i) => `
    <div class="cart ${i === selected ? 'selected' : ''}" data-idx="${i}">
      <div class="cart-art">${isGb ? gameBoyCartridge(c) : weaponPickup(GLYPHS[c.glyph] || W_HMG, c.color, c.letter)}</div>
      <div class="cart-label">${c.label.replace(/\n/g, '<br>')}</div>
    </div>`).join('');
  grid.querySelectorAll('.cart').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx, 10);
      if (idx === selected) loadCartridge();
      else { selected = idx; renderGrid(); renderPreview(); }
    });
  });
}

function renderPreview() {
  const c = sections[selected];
  if (!c) return;
  const t = $('.preview-title');
  if (t) t.innerHTML = c.title + '<br><span style="font-size:.55rem;color:var(--ink-dim)">' + c.sub + '</span>';
  const d = $('.preview-desc'); if (d) d.textContent = c.desc;
  const m = $('.preview-meta');
  if (m) m.innerHTML = (c.meta || []).map(([k,v]) => `<div>${k}: <b>${v}</b></div>`).join('');
}

function recalcCols() { const grid = $('.cart-grid'); if (!grid) return; cols = grid.clientWidth >= 460 ? 3 : 2; }

function move(dir) {
  if (view !== 'menu') return;
  recalcCols(); const n = sections.length; let next = selected;
  if (dir === 'left')  next = (selected % cols === 0) ? selected : selected - 1;
  if (dir === 'right') next = ((selected + 1) % cols === 0 || selected + 1 >= n) ? selected : selected + 1;
  if (dir === 'up')    next = (selected - cols < 0) ? selected : selected - cols;
  if (dir === 'down')  next = (selected + cols >= n) ? selected : selected + cols;
  if (next !== selected) { selected = next; renderGrid(); renderPreview(); }
}

/* ============================================================
   LOAD CARTRIDGE — routing logic
   ============================================================ */
function loadCartridge() {
  if (view !== 'menu') return;
  const c = sections[selected];
  if (!c) return;

  if (c.external) {
    window.open(c.route, '_blank', 'noopener');
    return;
  }

  if (c.id === 'about') {
    window.location.href = c.route;
    return;
  }

  // blog / archive: show in-screen post list with real links
  flash();
  setTimeout(() => { showView('detail'); renderDetail(c); }, 180);
}

function flash() { const f = $('.flash'); if (!f) return; f.classList.remove('fire'); void f.offsetWidth; f.classList.add('fire'); }

/* ============================================================
   DETAIL VIEW — real post links
   ============================================================ */
function renderDetail(c) {
  const t = $('.detail-title'); if (t) t.textContent = c.sub;
  const b = $('.detail-body'); if (!b) return;

  const posts = c.posts || [];
  let html = `<h3>Recent Transmissions</h3>`;

  if (posts.length > 0) {
    html += posts.map((p, i) =>
      `<a class="post-row" href="${p.url}">
        <span class="num">#${String(posts.length - i).padStart(2,'0')}</span>
        <span class="title">${p.title}</span>
        <span class="date">${p.date}</span>
      </a>`
    ).join('');
    html += `<a class="detail-open-all" href="${c.route}">OPEN ${c.route} →</a>`;
  } else {
    html += `<p style="color:var(--ink-faint);font-family:var(--font-crt)">No transmissions yet.</p>`;
    html += `<a class="detail-open-all" href="${c.route}">OPEN ${c.route} →</a>`;
  }

  b.innerHTML = html;
}

function showView(name) { $$('.view').forEach(v => v.classList.remove('active')); const v = $('#view-' + name); if (v) v.classList.add('active'); view = name; }
function startGame() { if (view !== 'boot') return; showView('menu'); renderGrid(); renderPreview(); }
function goBack() { if (view === 'detail') { flash(); setTimeout(() => { showView('menu'); renderGrid(); renderPreview(); }, 100); } }

function handleAction(action) {
  if (action === 'select') { if (view === 'boot') startGame(); else if (view === 'menu') loadCartridge(); }
  if (action === 'back')   { if (view === 'detail') goBack(); }
}

/* ============================================================
   INPUT — keyboard + on-screen controls
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (view === 'boot') { e.preventDefault(); startGame(); return; }
  if (view === 'menu') {
    if (e.key === 'ArrowUp')    { e.preventDefault(); move('up'); }
    if (e.key === 'ArrowDown')  { e.preventDefault(); move('down'); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); move('left'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); move('right'); }
    if (e.key === 'Enter' || e.key.toLowerCase() === 'z') { e.preventDefault(); loadCartridge(); }
  }
  if (view === 'detail') {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'x') { e.preventDefault(); goBack(); }
  }
});

document.querySelectorAll('[data-dir]').forEach(b => { b.addEventListener('click', (e) => { e.preventDefault(); move(b.dataset.dir); }); });
document.querySelectorAll('[data-action]').forEach(b => { b.addEventListener('click', (e) => { e.preventDefault(); handleAction(b.dataset.action); }); });

/* ============================================================
   FLIP SHELL — dev mode only (?dev=1)
   ============================================================ */
const toggle = document.getElementById('shell-toggle');
if (new URLSearchParams(window.location.search).get('dev') === '1') {
  toggle.classList.add('dev-visible');
  toggle.addEventListener('click', () => {
    const body = document.body;
    const current = body.classList.contains('force-gb') ? 'gb'
      : body.classList.contains('force-arcade') ? 'arcade'
      : (isGbShell() ? 'gb' : 'arcade');
    body.classList.remove('auto', 'force-gb', 'force-arcade');
    body.classList.add(current === 'gb' ? 'force-arcade' : 'force-gb');
    activeShell = null; mountScreen();
  });
}

/* ============================================================
   INIT — fetch sections.json then start
   ============================================================ */
async function init() {
  try {
    const resp = await fetch('/assets/sections.json');
    const data = await resp.json();
    sections = data.sections || [];
  } catch (e) {
    sections = [];
    console.warn('Could not load sections.json:', e);
  }
  mountScreen();
  window.addEventListener('resize', () => { mountScreen(); recalcCols(); });
}

init();
