# CLAUDE.md — playingwithpackets.com

Personal blog for Tyler Bohlmann (detection engineer @ Huntress). Jekyll static site with a
custom retro-arcade theme. Read this at session start so you don't re-derive the structure
each time. Verify specifics against the repo only when something here looks stale.

## Stack
- Jekyll (Ruby + Bundler), `markdown: kramdown`, `highlighter: rouge`.
- Static output (`_site/`) deployed to GitHub Pages via `.github/workflows/deploy.yml`.
- Domain via `CNAME` → playingwithpackets.com. DigitalOcean VPS is legacy hosting — retire after DNS cutover (see `README.md`).
- Run locally (Windows): `bundle exec jekyll serve` → http://localhost:4000
- `permalink: /blog/:title/` — blog posts live at `/blog/<title>/`.
- Plugins: jekyll-feed, jekyll-seo-tag, jekyll-sitemap.

## Theme — core concept
Retro arcade. Homepage is an interactive arcade boot → weapon-select hub. **One shell at every
breakpoint: the Game Boy** (`_includes/gameboy-shell.html`). On desktop (≥720px) the same shell
scales up and centers; below 720px it fills the viewport. The boot screen is the Game Boy LCD; the
weapon-select menu is a shared full-page stage. (A Metal Slug arcade cabinet was prototyped but
retired per user direction — the Game Boy is the single house shell; the old cabinet lives only in
`design/arcade-backup/` as reference, not in the live build.)
The arcade is a NAVIGATION LAYER over real pages, not a JS-only SPA. Every post/section is a
real static URL, readable without JS. `_includes/nav-fallback.html` is the no-JS path. Keep
real URLs, SEO, RSS, accessibility intact.

## Actual repo structure
- `index.html` — entry (arcade hub)
- `about.md` — about page
- `_config.yml` — config (permalink, plugins, `archive` collection, post/archive defaults)
- `_layouts/` — `default.html`, `arcade.html`, `section.html`, `post.html`, `archive.html`
  (note: there is NO project layout — sections cover projects)
- `_includes/` — `head.html`, `gameboy-shell.html`,
  `screen-template.html`, `nav-fallback.html`, `post-pixel-art.html`, `post-screenshot.html`
- `_data/sections.yml` — SOURCE OF TRUTH for the arcade sections/weapons (3 live for launch).
  Edits to sections happen HERE, not in JS.
- `assets/sections.json` — generated/derived sections data the arcade JS reads at runtime.
  If you change `_data/sections.yml`, make sure `sections.json` stays in sync (confirm how it's
  generated — Liquid template or build step — before editing by hand).
- `assets/css/` — stylesheets (tokens + main styles live here)
- `assets/js/` — the arcade engine (boot → menu → detail, keyboard/dpad/button input, shell mount)
- `assets/fonts/` — self-hosted fonts
- `assets/img/` — images; keep pixel art as PNG
- `_posts/` — blog markdown
- `blog/` — blog index/listing area (confirm role vs `_posts` if editing)
- `_archive/` — SOURCE for the live `archive` Jekyll collection: the migrated legacy posts
  (`command-injection-mitigation`, `reverse-shell-via-command-injection`, `series-bjj-infosec`).
  These ARE published at `/archive/:name/` — they are live content, not a private backup.
- `archive/` — just the section landing page (`index.html`, lists the collection).
  (No separate old-site "Ghost backup" directory exists in the repo. The only backup is the arcade
  prototype in `design/arcade-backup/`. Earlier docs warned about a Phase-0 content backup — stale.)
- `design/` — prototype reference (excluded from build via `_config.yml`)
- `_site/` — build output, generated, do not hand-edit
- `.github/` — Actions (deploy workflow)

## Sections = Game Boy cartridge icons
Defined in `_data/sections.yml` (source of truth). Each section's cartridge is a **full PixelLab
pixel-art Game Boy cartridge PNG** (authentic shell + per-section colour + a small label emblem),
referenced via `pixel_art:` and rendered as a full `<img>` by `gameBoyCartridge()` in
`assets/js/arcade.js`. With no `pixel_art`, the renderer falls back to a generated grey SVG
cartridge. **3 sections are live for launch:**
| Cartridge | Letter | Color   | Section | Route     |
|-----------|--------|---------|---------|-----------|
| Blog      | B      | #ffd23a | Blog    | /blog/    |
| Archive   | A      | #6a8caf | Archive | /archive/ |
| About     | P      | #4a9ec4 | About   | /about/   |

(Confirm exact values against `_data/sections.yml`. The `letter`/`glyph` fields are vestigial —
the renderer ignores them. Cartridge PNGs live in `assets/img/pixel/cartridges/<id>.png`.)

### Backlog — full 6 weapon-crate vision (deferred, NOT built)
The original concept was six Metal Slug weapon-crates; superseded for launch (3 sections) to ship
the migration first — revisit post-cutover. Each future crate needs a real destination before it
ships: Blog `/blog/` · Detection Chokepoints (external) · Tacklebox (project page) · IOK Detection
Lab (project page) · Podcast (project page) · About `/about/`.

## Design tokens (palette) — in `assets/css`
- Screen bg #1c1010  panel #2a1614  darker #0e0606
- Ink #f4e8d0  dim #c8b598  faint #8a6f5a
- Metal Slug red #c8201c / bright #e8352a / dark #7a1010 / deep #4a0808
- Yellow #ffd23a  orange #ff8c1a  cream #f4e8d0  black #160d0d
- Crate metal #7a7458 / hi #a39a78 / dk #4e4a36 / outline #15110a

## Fonts — STRICT usage
- Press Start 2P, Black Ops One, VT323 = DISPLAY/CHROME ONLY (logos, labels, HUD, headers).
- JetBrains Mono = ALL body text and image captions.
- Never set body copy or long captions in a pixel display font — it kills readability.

## Image rules
- Pixel art = PNG, never JPEG (JPEG smears pixel edges).
- Apply `image-rendering: pixelated` to scaled-up pixel PNGs so they stay crisp.
- Screenshots that must stay readable: do NOT pixelate/heavily filter. Frame them in themed
  window/border chrome (--black outline + a colored inset like the crates).
- Reconcile photos with the arcade look via a chunky pixel frame and/or a warm palette filter
  so they belong to the cabinet instead of looking foreign.

## PixelLab / visual explanation workflow
- Use PixelLab as the preferred source for original pixel-art assets when a post needs a simple
  conceptual visual, section icon, cartridge embellishment, hero image, or lightweight diagram.
- Design rule: pixel art should simplify ideas; screenshots should prove them.
- For technical posts, prefer this flow when it fits: concept pixel art → short explanation →
  real screenshot/evidence → caption explaining what to notice.
- Pixel art should translate complex topics into basic, memorable images. Less is more:
  avoid over-rendering details that make the idea harder to understand.
- Do not replace evidence screenshots with pixel art when exact UI, logs, packet captures,
  terminal output, or code details matter. Use pixel art as a companion or lead-in.
- Store PixelLab PNG exports under `assets/img/pixel/` or the relevant
  `assets/img/posts/<slug>/` folder. Keep native sizes small (for example 64x64, 128x128,
  160x144) and scale with CSS using `image-rendering: pixelated`.
- Boot screen hook: export `assets/img/pixel/boot/pwp-boot-logo.png` to replace the text PWP
  boot mark automatically.
- Cartridge rule: each section's cartridge is a full PixelLab GB-cartridge PNG (authentic shell,
  per-section colour, small label emblem) at `assets/img/pixel/cartridges/<id>.png`, wired via
  `pixel_art:` and rendered as a full `<img>`. The generated grey SVG cartridge is now only a
  no-art fallback. Keep the set cohesive (one PixelLab style/size).
- `pixel_art: /assets/img/pixel/cartridges/<section-id>.png` in `_data/sections.yml` points at the
  section's full cartridge PNG; `assets/sections.json` passes it to `assets/js/arcade.js`, which
  renders it as the cartridge image.
- Use `{% include post-pixel-art.html ... %}` for simple PixelLab concept art and
  `{% include post-screenshot.html ... %}` for evidence screenshots.
- When planning work, recommend the implementation route: Cursor/Composer for visual,
  iterative Game Boy/pixel-art work; Claude Code is fine for focused non-visual chunks.

## Visual verification (Playwright MCP)
Whenever changing anything visual: ensure `jekyll serve` is running, then screenshot the affected
page at **375×812 (mobile / Game Boy shell)** and **1440×900 (desktop / arcade cabinet)**. Inspect
the screenshots, fix, re-screenshot. A clean capture at BOTH breakpoints is the done-criteria.
Verify visually — don't assume layout is correct.

**Playwright MCP workaround:** The MCP server is registered in `.claude.json` but requires a trust
dialog to connect. If Playwright MCP tools are unavailable, use the Node script at
`C:\Users\Bob\pwp-audit\screenshot.js` (requires `playwright` npm package, already installed):
```
cd C:\Users\Bob\pwp-audit && node screenshot.js
```
Saves PNGs to `C:\Users\Bob\pwp-audit\`. Read them with the Read tool to inspect visually.

## Known layout rules (don't regress)
- `default.html` has `<style>html{height:auto;overflow:auto}</style>` — do not remove; it overrides
  the global arcade reset so content pages can window-scroll.
- `body.page` is `display:flex; flex-direction:column; min-height:100vh` — footer sticks to bottom.
- `.page-content` has `flex:1` — do not remove; it pushes the footer down on short pages.
- `post.html` post-meta has date only — tags are in the sticky header via `default.html`, not here.
- `.page-content table` is `display:block; overflow-x:auto` — tables scroll horizontally on mobile.

## Conventions / guardrails
- Keep hand-written CSS. No CSS framework, no component library (they fight the theme).
- Don't change the visual identity or palette — refine within it.
- Edit sections in `_data/sections.yml`, not in JS. Keep `assets/sections.json` in sync.
- Never hand-edit `_site/` (generated). Don't publish or delete the old-content backup in
  `archive/` or `_archive/` — confirm which is the backup first.
- Make minimal, targeted edits; summarize what changed and why.
- Author is not a web-dev expert — explain reasoning briefly in plain terms.
- Windows environment (PowerShell). Use Windows-appropriate shell commands.
- Use Context7 MCP for current Jekyll/Liquid/plugin/CSS syntax rather than memory.
