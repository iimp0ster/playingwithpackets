# Pixel Icon Spec — Playing with Packets

Working design brief for the site's original pixel art. Turnkey for PixelLab generation:
each entry below is a one-line prompt seed + target size + destination path. This doc lives in
`design/` (excluded from the Jekyll build). The published index of finished icons goes in
`CONTENT.md` once they exist.

Status: **cartridges DONE** — built as full PixelLab GB-cartridge PNGs (not the label-sticker
approach in §2, which was superseded per user direction). `gameBoyCartridge()` renders
`section.pixel_art` as the whole cartridge `<img>`, SVG body as fallback. **Section-nav icon set
(chokepoint, attack-chain, trends, framework) DONE at 64×64 (also used as the section links on the
detection-chokepoints site); rest of the concept-icon set (§3) pending.**

---

## 1. Global style system (keep every asset cohesive)

These rules are what make the set read as *one family* and become recognizable — the point of
"original to the site, referenced by others."

- **House-style anchor (match the cartridges):** every icon's *rendering* should match the section
  cartridges in `assets/img/pixel/cartridges/` — **bold single-colour black outline**, simple
  **two-step cel shading** (flat fill + one shadow + one highlight), **high contrast**, **crisp
  chunky pixels**, clean readable forms. Prompt with these traits so the whole set stays one family.
  (Match their *rendering*, not the cartridge label/shape.) Validated on the chokepoint flagship —
  the anchored version read cleaner and more cohesive than free-form prompting, so this is the
  default for this site and other projects.
- **Canvas:** section-nav concept icons `64×64` native (read at ~22px beside a link, scale up for
  blog lead-ins). Older concept art is `128×128`. Cartridge stickers `32×24` (fills the wider label
  window). Boot mark `96×64`.
- **Palette:** pull from `assets/css/tokens.css`. Max **3–4 colors per icon** + transparent bg.
  Base ink `--gbc-lcd #8ab43a` / bright `--gbc-lcd-bright #b6df5a` on transparent; use one accent
  from the Metal Slug set (`--neon-yellow #ffd23a`, `--neon-pink #e8352a`, `--neon-cyan #ff8c1a`)
  only to mark the "attacker"/"alert" element. Outline `--crate-outline #15110a`.
- **Form language:** chunky 1–2px outline, flat fill, single light source top-left, no anti-alias,
  no gradients. Readable as a silhouette at 16px. **Less is more** — one idea per icon (CLAUDE.md).
- **Rendering:** PNG only (never JPEG). Always displayed with `image-rendering:pixelated`.
- **Naming:** `assets/img/pixel/concepts/<concept>.png`, `assets/img/pixel/cartridges/<id>.png`.
- **Signature motif:** a recurring **green "signal" pixel** (single bright `--gbc-lcd-bright` dot)
  hidden in each icon — a subtle through-line that ties the set together and is "spot the packet"
  for regulars. Optional but recommended as the brand thread.

---

## 2. Cartridge stickers (3 — the launch sections)

Small concept mark centered in the uniform gray cartridge's label window. Wire each via
`pixel_art:` in `_data/sections.yml`. Keep them simple — the cartridge body already carries the
retro weight; the sticker is a glance-level identifier.

| id | path | color anchor | brief |
|----|------|--------------|-------|
| blog | `/assets/img/pixel/cartridges/blog.png` | `#ffd23a` yellow | A pixel "transmission" mark — a small CRT/monitor or signal-burst with a blinking cursor. "Rapid-fire writeups." |
| archive | `/assets/img/pixel/cartridges/archive.png` | `#6a8caf` blue | A floppy disk or stacked tape reels — "old transmissions preserved." Slightly faded palette. |
| about | `/assets/img/pixel/cartridges/about.png` | `#4a9ec4` cyan | "Player 1" — a tiny pixel avatar / 1-up head, or a coffee cup + gi belt nod (jiu-jitsu). Personal mark. |

After generation: add the `pixel_art:` line per section, run `jekyll build`, screenshot the
cartridge select at 375×812 and 1440×900, confirm the sticker sits crisp inside the label and the
color-only fallback still works if a path is removed.

---

## 3. Detection-engineering concept-icon set (the signature library)

Reusable lead-in art for posts (`{% include post-pixel-art.html %}`). Grounded in the operator's
domain (invariant-anchored detection, AiTM, IOK rules, OSINT→JSON→detection pipeline). The
**chokepoint bear trap is the flagship mark** — it ties to the Detection Chokepoints project and is
the most "ownable" image. The first four below are the detection-chokepoints **section-nav set**
(64×64): chokepoint, attack-chain, trends, framework.

| concept | file | one-line visual brief |
|---------|------|------------------------|
| chokepoint ★ | `chokepoint.png` | **A bear trap** — jaws + teeth, glowing yellow bait. The chokepoint as the trap you lure and catch the enemy in (the unavoidable step). Section-nav; flagship. |
| attack-chain | `attack-chain.png` | **A ball-and-chain chomp**, side profile, mouth open mid-bite, straining to break its chain. Section-nav. |
| trends | `trends.png` | **A cresting wave** with yellow foam — the rising tide of what's accelerating. Section-nav. |
| framework | `framework.png` | **A blueprint scroll** with a schematic — the methodology that ties it together. Section-nav. |
| invariant / anchor | `invariant.png` | A heavy anchor or keystone — "the step the attacker can't avoid." Solid, immovable. |
| telemetry | `telemetry.png` | A stacked log/ledger emitting 3 ascending signal blips, or a small radar sweep. |
| ioc-vs-behavior | `ioc-behavior.png` | Split: a fingerprint (IOC, dim) vs a footprint/motion trail (behavior, bright). Behavior wins. |
| aitm-proxy | `aitm-proxy.png` | Two endpoints with a malicious relay box between them passing a stolen token/cookie. |
| threat-hunt | `threat-hunt.png` | A magnifier (or crosshair) over a grid where one cell is the accent — finding the anomaly. |
| coverage-gap | `coverage-gap.png` | A shield/grid with one missing segment glowing the alert accent — the gap. |
| sigma-rule | `sigma-rule.png` | A small rule card / scroll stamped with a Σ — detection-as-code. |
| intel-pipeline | `intel-pipeline.png` | Funnel → `{ }` braces → shield: OSINT collapses to structured JSON to a detection. |

★ = flagship. Optional later: `deception` (honeypot), `mitre-technique` (ATT&CK matrix cell),
`lolbin` (a trusted binary with a small horn).

**PixelLab generation notes (learned building the section set):** use `create_1_direction_object`
at `size: 64` (yields a 16-candidate review pack). Use **`view: sidescroller`** for clean
transparent output — `view: top-down` adds an opaque light-grey background box that must be keyed
out afterward (see `pwp-audit/process-trap.js`: key bright low-saturation pixels to transparent,
then keep only the largest connected blob to drop stray specks). Prompt for a **single subject**
("one creature only, no duplicates") — multi-candidate packs sometimes render two. Anchor every
prompt to the house style above so the set stays one family.

### Usage pattern (CLAUDE.md flow)
concept pixel art → short explanation → real screenshot/evidence → caption on what to notice.
```liquid
{% include post-pixel-art.html src="/assets/img/pixel/concepts/chokepoint.png" alt="Attack paths converge into one detection point" caption="Every variant funnels through the same unavoidable step." %}
```

---

## 4. Generation + wiring workflow (once PixelLab is connected)

1. Generate per the briefs above, iterating for set cohesion (same outline weight, palette, light).
2. Export to the paths listed; keep native sizes small.
3. Cartridges: add `pixel_art:` to `_data/sections.yml` → `jekyll build` → visual-verify both breakpoints.
4. Concepts: drop into a post via the include; verify in-context.
5. Add the finished set to `CONTENT.md` as the published index (filename + one-line meaning) so the
   icons are reusable and citable — the documentation is what lets others reference them.

---

## 5. Style influences (era + feel, NOT characters)

The house look is inspired by the classic 16-bit console + arcade sprite art the author grew up on
(SNES platformers, early-90s fighters, run-and-gun action). We emulate the **qualities**, never the
characters — every generated mark is an original (see the attack-chain creature: an original
ball-and-chain enemy that evokes the era, not a copy of any specific game's sprite). Reference
sheets, if kept, stay **local and gitignored** — they are mood reference, never reproduced and
never published.

Qualities to carry into original icons:
- **Disciplined limited palette** — a few well-chosen hues per icon, strong value contrast.
- **Bold 1–2px outline**, mostly single-colour, with clean cel shading (flat fill + one shadow +
  one highlight). No gradients, no anti-aliasing.
- **Confident, readable silhouette** — the shape reads instantly at small size.
- **Expressive energy** — dynamic angles; for effect/FX icons, a bright cyan/white core fading to
  the edge, like classic projectile and energy effects.
- **Chunky, deliberate pixels** — chunkier reads more nostalgic than high-res-detailed.

Hard rule: inspiration informs *style* (palette, line weight, shading, pose energy). It never
authorises reproducing or tracing a specific copyrighted character or sprite.
