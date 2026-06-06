# Content Guide

## Section cartridges

Top-level navigation cartridges are defined in `_data/sections.yml`. Each cartridge must map to a real static URL.

Current sections:

| Cartridge | Route | Content source |
|-----------|-------|----------------|
| Blog | `/blog/` | `_posts/` |
| Archive | `/archive/` | `_archive/` (Jekyll `archive` collection) |
| About | `/about/` | `about.md` |

## Front matter

### New blog posts (`_posts/`)

```yaml
---
layout: post
title: "Post Title"
date: 2026-06-01
tags: [detection, sigma]
excerpt: "One-line summary for listings and SEO."
---
```

### Archived posts (`_archive/`)

```yaml
---
layout: archive
title: "Post Title"
date: 2018-06-15
description: "Short summary for archive listings."
original_url: https://playingwithpackets.com/old-path/
archived: true
---
```

## Screenshots

Store images under `assets/img/`. Prefer per-post folders: `assets/img/posts/<slug>/`.

Use the screenshot figure pattern for technical captures (terminals, UIs, logs):

```html
<figure class="post-screenshot">
  <img src="{{ '/assets/img/posts/example/capture.png' | relative_url }}" alt="Describe what the reader should see">
  <figcaption>What this screenshot demonstrates.</figcaption>
</figure>
```

Do not pixelate screenshots that need to stay readable. Captions use the body font (JetBrains Mono), not pixel display fonts.

## PixelLab artwork

Use PixelLab when a post or section needs original pixel art that explains an idea simply. Keep the rule simple: pixel art explains; screenshots prove.

Recommended export folders:

| Use | Folder | Notes |
|-----|--------|-------|
| Boot/loading mark | `assets/img/pixel/boot/` | Export `pwp-boot-logo.png` to automatically replace the text mark on the boot screen. |
| Cartridge art | `assets/img/pixel/cartridges/` | Full PixelLab GB-cartridge PNG per section (`<id>.png`), wired via `pixel_art:` and rendered as the whole cartridge. |
| Concept diagrams | `assets/img/pixel/concepts/` | Use for simple visual explanations before evidence screenshots. |
| Post-specific art | `assets/img/posts/<slug>/` | Use when the art belongs to one post only. |

Suggested native sizes:

- Boot mark: `64x48` or `96x64`
- Cartridge sticker-only art: `32x24` or `48x32`
- Concept art: `128x128`, `160x144`, or another small Game Boy-like canvas

Each section's cartridge is a full PixelLab Game Boy cartridge PNG (authentic shell, per-section color, small label emblem). Reference it from `_data/sections.yml` like this:

```yaml
pixel_art: /assets/img/pixel/cartridges/blog.png
```

PixelLab PNGs should stay crisp when scaled. Do not use JPEG for pixel art.

Use the PixelLab concept-art include in posts:

```liquid
{% include post-pixel-art.html src="/assets/img/pixel/concepts/chokepoint.png" alt="Simple chokepoint diagram" caption="Attack paths collapse into one detection point." %}
```

Use the screenshot include for evidence:

```liquid
{% include post-screenshot.html src="/assets/img/posts/example/evidence.png" alt="Terminal output showing the detection event" caption="The process tree confirms the explorer.exe launch relationship." %}
```

## Concept icon library

Original detection-engineering pixel icons (PixelLab), 128×128 PNG, in `assets/img/pixel/concepts/`.
Use as post lead-ins via `post-pixel-art.html`. Flagship: chokepoint. Keep the set cohesive — same
style when adding new ones.

| Icon | File | Use for |
|------|------|---------|
| Chokepoint ★ | `chokepoint.png` | Invariant-anchored detection; variants converging to one step |
| Attack chain | `attack-chain.png` | Kill-chain stages; where actors converge |
| Invariant / anchor | `invariant.png` | The unavoidable step a technique depends on |
| Telemetry | `telemetry.png` | Log sources / data-source coverage |
| IOC vs behavior | `ioc-behavior.png` | Indicators vs behavioral detection |
| AiTM proxy | `aitm-proxy.png` | Adversary-in-the-middle / phishing relay |
| Threat hunt | `threat-hunt.png` | Hunting telemetry for anomalies |
| Coverage gap | `coverage-gap.png` | Detection gaps / missing coverage |
| Sigma rule | `sigma-rule.png` | Sigma / detection-as-code |
| Intel pipeline | `intel-pipeline.png` | OSINT → structured intel → detection |
