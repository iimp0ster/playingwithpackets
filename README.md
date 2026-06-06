# Playing with Packets

Personal blog for Tyler Bohlmann — detection writeups, adversary infra research, deception, and threat hunting.

Jekyll static site with a Game Boy-themed navigation layer over real static URLs.

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Open http://localhost:4000

## Content structure

- `_data/sections.yml` — Game Boy cartridge / section definitions
- `_posts/` — current blog posts
- `_archive/` — preserved legacy posts (Jekyll `archive` collection)
- `blog/`, `archive/`, `about.md` — readable section landing pages

See [CONTENT.md](CONTENT.md) for front matter and screenshot conventions.

## Deploy (GitHub Pages)

Production deploys via GitHub Actions on push to `main`:

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Custom domain: `playingwithpackets.com` (see root `CNAME`)
3. Push to `main` or run the **Build and Deploy to GitHub Pages** workflow manually

## Migration runbook (DigitalOcean → GitHub Pages)

Do this after content and design milestones are settled.

### Before cutover

1. Confirm `bundle exec JEKYLL_ENV=production jekyll build` succeeds locally.
2. Export nginx config and any redirect rules from the DigitalOcean droplet.
3. Compare live DO site vs GitHub Pages preview for `/`, `/blog/`, `/archive/`, `/about/`, RSS, sitemap.
4. Lower DNS TTL if possible.

### Cutover

1. Enable GitHub Pages custom domain + HTTPS for `playingwithpackets.com`.
2. Point apex/root DNS to GitHub Pages; remove conflicting DigitalOcean records.
3. Dispatch the deploy workflow and verify representative posts + legacy redirects.

### After cutover

1. Keep the droplet online during DNS propagation as rollback insurance.
2. Back up nginx config and any files not in git.
3. Retire DigitalOcean once GitHub Pages is stable.

### Legacy URL redirects

Old paths redirect to archive collection entries:

| Old path | New path |
|----------|----------|
| `/commandinjection/` | `/archive/reverse-shell-via-command-injection/` |
| `/command-injection-mitigation/` | `/archive/command-injection-mitigation/` |
| `/series-brazilian-jiu-jitsu-and-infosec/` | `/archive/series-bjj-infosec/` |
