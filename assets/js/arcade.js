/* Playing with Packets — arcade engine
   Boot: Game Boy shell → PRESS START → zoom out → full-page cartridge stage.
   Data-driven via /assets/sections.json.
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
function escapeAttr(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[ch]);
}

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
      rects += `<rect x="${offX + x * scale}" y="${offY + y * scale}" width="${scale}" height="${scale}" fill="${fill}"/>`;
    }
  }
  return rects;
}

/* Chunky Pokémon-style shell — identical grey plastic for every section.
   L/l/D = label fill (section color). y/Y = gold slot contacts. No icons or text. */
const CART_GRID = [
  '....kkkkkkkkkkkkkkkkkkkk....',
  '...kHHHHHHHHHHHHHHHHHHHHk...',
  '..kkggggggggggggggggggkk....',
  '..kggggggggggggggggggggk....',
  '..kggggggggggggggggggggk....',
  '..kggggssssssssssssggggk....',
  '..kggsskkkkkkkkkkkkssggk....',
  '..kggssYYYYYYYYYYYYssggk....',
  '..kggssYyYyYyYyYyYyssggk....',
  '..kggssYYYYYYYYYYYYssggk....',
  '..kggsskkkkkkkkkkkkssggk....',
  '..kggggssssssssssssggggk....',
  '..kggggggggggggggggggggk....',
  '..kggdggggggggggggggdgk.....',
  '..kdkkkkkkkkkkkkkkkkkdk.....',
  '..kdklllllllllllllllldk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdklLLLLLLLLLLLLLLLdk.....',
  '..kdkDDDDDDDDDDDDDDDDdk.....',
  '..kdkkkkkkkkkkkkkkkkkdk.....',
  '..kggdggggggggggggggdgk.....',
  '..kggggggggggggggggggggk....',
  '..kggggttggggggggttggggk....',
  '..kkdddggggggggggdddggkk....',
  '...kkkkkkkkkkkkkkkkkkkk.....',
  '....kkkkkkkkkkkkkkkkkk......',
];

/* ============================================================
   GAME BOY CARTRIDGE RENDERER
   Full PixelLab cartridge art per section when `pixel_art` is set;
   otherwise a generated uniform grey SVG shell (fallback).
   ============================================================ */
function gameBoyCartridge(section) {
  /* Preferred: full PixelLab cartridge PNG (authentic GB shell + section colour + label emblem).
     image-rendering:pixelated keeps the 128px art crisp when scaled up in the stage. */
  if (section.pixel_art) {
    return `<img class="pixel-cartridge-img" src="${escapeAttr(section.pixel_art)}" alt="" aria-hidden="true">`;
  }

  const color = section.color || '#7a7458';
  const palette = {
    k: '#18100c',
    H: '#dbd3c8',
    g: '#c2bab0',
    d: '#9a9288',
    s: '#0c0a14',
    t: '#8a8278',
    Y: '#e0c848',
    y: '#c8a830',
    L: color,
    l: lighter(color, 32),
    D: darker(color, 28),
  };

  const scale = 1;
  const w = CART_GRID[0].length;
  const h = CART_GRID.length;

  return `<svg class="pixel-cartridge-svg" viewBox="0 0 ${w} ${h + 2}" aria-hidden="true" shape-rendering="crispEdges">
    ${pixelArt(CART_GRID, palette, scale, 0, 0)}
    <rect x="2" y="${h}" width="${w - 4}" height="1" fill="rgba(0,0,0,.35)"/>
  </svg>`;
}

/* ============================================================
   ENGINE STATE
   ============================================================ */
let sections = [];
let view = 'boot';
let stageIdx = 0;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Boot-once-per-session flag. The homepage is the only page that loads this
   engine; content pages are static. When a reader leaves a content page and
   returns to "/", the browser reloads index.html and re-runs init(), which used
   to replay the whole loading animation. We stamp a sessionStorage flag the
   first time the reader leaves the boot screen, then skip straight to the menu
   on any later load this session. sessionStorage (not localStorage) so a fresh
   visit in a new tab/session still gets the full boot once. Wrapped in try/catch
   because storage access throws in some privacy modes — failing to `false` just
   means boot plays, i.e. today's behaviour, which is a safe fallback. */
const BOOTED_KEY = 'arcade-booted';
function hasBooted() {
  try { return sessionStorage.getItem(BOOTED_KEY) === '1'; } catch (e) { return false; }
}
function markBooted() {
  try { sessionStorage.setItem(BOOTED_KEY, '1'); } catch (e) {}
}
/* ============================================================
   SHELL MOUNTING
   ============================================================ */
function mountScreen() {
  const target = document.getElementById('gb-screen');
  if (!target) return;
  target.innerHTML = '';
  const tpl = document.getElementById('screen-template').content.cloneNode(true);
  target.appendChild(tpl);

  /* Returning within the same session → land on the weapon-select menu, no
     loader. Fresh visit → play the boot sequence (which then sets the flag). */
  if (hasBooted()) {
    showStageImmediate();
    return;
  }
  runBoot();
}

/* Render and reveal the cartridge stage with no boot/zoom animation. Shared by
   the skip-boot return path and the reduced-motion path — both want to "land"
   on the menu, not watch a transition. */
function showStageImmediate() {
  const device = document.querySelector('.device');
  const stage = document.getElementById('cartridge-stage');
  if (!stage) return;
  renderCartridgeStage(stage);
  if (device) device.hidden = true;
  stage.hidden = false;
  stage.classList.add('visible');
  view = 'stage';
  focusStageCart(0);
}

function $(sel) {
  return document.getElementById('gb-screen')?.querySelector(sel) || null;
}

/* ============================================================
   BOOT SEQUENCE — authentic Game Boy startup feel
   ============================================================ */
function runBoot() {
  const msgs = $('.boot-msgs');
  if (!msgs) return;

  const reduced = REDUCED_MOTION.matches;

  msgs.innerHTML = `
    <div class="gb-boot-stack">
      <div class="gb-boot-logo"><span class="gb-boot-word">PLAYING</span><span class="gb-boot-word">WITH</span><span class="gb-boot-word">PACKETS</span></div>
      <div class="gb-boot-tagline">DETECTION ENGINE</div>
      <div class="gb-boot-load" aria-hidden="true">
        <div class="gb-boot-loadbar"><span class="gb-boot-loadfill"></span></div>
        <div class="gb-boot-loadtext">NOW LOADING</div>
      </div>
    </div>
  `;

  const stack = msgs.querySelector('.gb-boot-stack');
  const logo = msgs.querySelector('.gb-boot-logo');
  const tagline = msgs.querySelector('.gb-boot-tagline');
  const load = msgs.querySelector('.gb-boot-load');

  if (reduced) {
    stack?.classList.add('ready');
    logo?.classList.add('shown');
    tagline?.classList.add('shown');
    load?.classList.add('shown', 'done');
    showPressStart(400);
    return;
  }

  /* Game-loading feel: logo drops in → loading bar fills in chunky steps → PRESS START. */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    stack?.classList.add('power-on');
    setTimeout(() => logo?.classList.add('shown'), 220);
    setTimeout(() => tagline?.classList.add('shown'), 700);
    setTimeout(() => load?.classList.add('shown'), 1000);
    setTimeout(() => load?.classList.add('done'), 1950);
    showPressStart(2050);
  }));
}

function showPressStart(delay) {
  setTimeout(() => {
    const ps = $('.press-start');
    if (ps) ps.classList.add('shown');
  }, delay);
}

/* ============================================================
   START — zoom transition into full-page cartridge stage
   ============================================================ */
function startGame() {
  if (view !== 'boot') return;
  view = 'transition';
  markBooted();          // first exit from boot — return trips this session skip the loader

  const device = document.querySelector('.device');
  const stage = document.getElementById('cartridge-stage');

  if (REDUCED_MOTION.matches) {
    showStageImmediate();
    return;
  }

  renderCartridgeStage(stage);
  document.body.classList.add('boot-zooming');

  setTimeout(() => {
    stage.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('visible')));
  }, 280);

  setTimeout(() => {
    device.hidden = true;
    view = 'stage';
    focusStageCart(0);
  }, 620);
}

/* ============================================================
   CARTRIDGE STAGE — full-page section selector
   ============================================================ */
function sectionCount(section) {
  if (Array.isArray(section.posts)) return section.posts.length;
  return 0;
}

function renderCartridgeStage(stage) {
  const totalGames = sections.length;
  const cards = sections.map((s, i) => {
    const target = s.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const count = sectionCount(s);
    /* External sections leave the site, so signal that instead of the internal
       'READY'/'N SAVES' status (the link already opens in a new tab). The ↗ is
       rendered in VT323 (the .stage-cart-meta font); verified to render, not a
       tofu box. */
    const countLabel = s.external
      ? 'OPEN ↗'
      : (count ? `${count} SAVE${count === 1 ? '' : 'S'}` : 'READY');
    return `<a class="stage-cart" href="${s.route}"${target} data-idx="${i}" tabindex="0" aria-label="${s.label}: ${s.desc || ''}">
      <div class="stage-cart-art">${gameBoyCartridge(s)}</div>
      <div class="stage-cart-name">${s.label.replace(/\n/g, '<br>')}</div>
      <div class="stage-cart-meta">${countLabel}</div>
      <div class="stage-cart-desc">${s.desc || ''}</div>
    </a>`;
  }).join('');

  stage.innerHTML = `
    <div class="stage-shell">
      <div class="stage-header">
        <span class="stage-title">SELECT GAME</span>
        <span class="stage-header-right">
          <span class="stage-hud"><span class="stage-hud-label">GAMES</span> <span class="stage-hud-val">${String(totalGames).padStart(2, '0')}</span></span>
          <button type="button" class="stage-reboot" aria-label="Reboot — replay the boot screen">REBOOT</button>
        </span>
      </div>
      <div class="stage-grid">${cards}</div>
      <div class="stage-footer">
        <span class="stage-hint">◀ ▶ MOVE</span>
        <span class="stage-hint stage-hint-select">A / START SELECT</span>
        <span class="stage-hint">R REBOOT</span>
      </div>
    </div>
  `;
  /* REBOOT is rendered with the stage, so bind it here (the load-time
     [data-action] handler only sees the static Game Boy shell buttons). */
  stage.querySelector('.stage-reboot')?.addEventListener('click', (e) => { e.preventDefault(); reboot(); });
}

/* Power-cycle: tear down the menu, bring the Game Boy shell back, and replay the
   boot/loading sequence so the reader lands on PRESS START. The skip-boot
   sessionStorage flag is left as-is — this is an in-session replay, not a reset
   of the once-per-session loader behaviour. */
function reboot() {
  if (view !== 'stage') return;
  const device = document.querySelector('.device');
  const stage = document.getElementById('cartridge-stage');
  if (stage) { stage.classList.remove('visible'); stage.hidden = true; stage.innerHTML = ''; }
  /* startGame() adds boot-zooming and never clears it; left on, its deviceZoom
     animation would distort the shell when we show it again. */
  document.body.classList.remove('boot-zooming');
  if (device) device.hidden = false;
  view = 'boot';
  const ps = $('.press-start');
  if (ps) ps.classList.remove('shown');   // let it blink back in after the boot
  runBoot();
}

function focusStageCart(idx) {
  const carts = document.querySelectorAll('.stage-cart');
  if (!carts.length) return;
  stageIdx = Math.max(0, Math.min(idx, carts.length - 1));
  carts.forEach((c, i) => c.classList.toggle('focused', i === stageIdx));
  carts[stageIdx]?.focus();
}

function stageColCount() {
  const grid = document.querySelector('.stage-grid');
  const first = document.querySelector('.stage-cart');
  if (!grid || !first) return 2;
  return Math.max(1, Math.round(grid.clientWidth / first.offsetWidth));
}

function moveStage(dir) {
  if (view !== 'stage') return;
  const carts = document.querySelectorAll('.stage-cart');
  const n = carts.length;
  if (!n) return;
  const cols = stageColCount();
  let next = stageIdx;

  if (dir === 'right') next = Math.min(stageIdx + 1, n - 1);
  if (dir === 'left') next = Math.max(stageIdx - 1, 0);
  if (dir === 'down') next = Math.min(stageIdx + cols, n - 1);
  if (dir === 'up') next = Math.max(stageIdx - cols, 0);

  if (next !== stageIdx) focusStageCart(next);
}

function selectStageCart() {
  if (view !== 'stage') return;
  document.querySelectorAll('.stage-cart')[stageIdx]?.click();
}

/* ============================================================
   INPUT — keyboard + on-screen controls
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (view === 'boot') {
    if (['Enter', ' ', 'z', 'Z', 'x', 'X'].includes(e.key)) {
      e.preventDefault();
      startGame();
    }
    return;
  }

  if (view === 'stage') {
    if (e.key === 'ArrowRight') { e.preventDefault(); moveStage('right'); return; }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); moveStage('left'); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); moveStage('down'); return; }
    if (e.key === 'ArrowUp')    { e.preventDefault(); moveStage('up'); return; }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reboot(); return; }
    if (e.key === 'Enter' || e.key.toLowerCase() === 'z') {
      /* If the REBOOT button holds focus, let its native activation fire instead
         of selecting a cartridge. */
      if (document.activeElement && document.activeElement.classList.contains('stage-reboot')) return;
      e.preventDefault();
      selectStageCart();
    }
  }
});

document.querySelectorAll('[data-action]').forEach(b => {
  b.addEventListener('click', (e) => {
    e.preventDefault();
    if (b.dataset.action === 'select' && view === 'boot') startGame();
    if (b.dataset.action === 'select' && view === 'stage') selectStageCart();
    /* 'back' (B / SELECT pill) is intentionally inert. These gameboy controls
       only exist on the boot/title screen — the .device shell is hidden once the
       menu mounts — and the title screen is the top of the arcade, with nothing
       behind it. Real return-navigation from content pages is the <a> links in
       default.html, which now land on the menu via skip-boot instead of the
       loader. Do NOT wire this to history.back(): on the title screen that would
       walk the reader off the site. */
  });
});

document.querySelectorAll('[data-dir]').forEach(b => {
  b.addEventListener('click', (e) => {
    e.preventDefault();
    if (view === 'stage') moveStage(b.dataset.dir);
  });
});

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
}

init();
