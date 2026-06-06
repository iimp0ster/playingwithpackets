---
layout: post
title: "Detection Chokepoints: Where to Start When Everything Is on Fire"
date: 2026-06-01
tags: [detection, chokepoints, sigma, threat-hunting, attack-chains]
excerpt: "Introducing Detection Chokepoints — a knowledge base for defenders who don't know where to start. Anchor detection to what attackers can't avoid, not the tool of the week."
---

Every defender I know is on the same treadmill. A new loader drops Monday, a renamed RMM
campaign Tuesday, a fresh phishing kit Wednesday. You write a detection for each one, ship it,
and by Friday the tooling has rotated and half your rules are matching a binary nobody uses
anymore. The backlog never shrinks. You're always one report behind.

The problem isn't effort. It's the unit of work. We keep building detections around **tools**,
and tools are the one thing the attacker fully controls. They can recompile, rename, obfuscate,
or swap the whole framework. If your detection is pinned to `mimikatz.exe`, you've signed up to
lose every time someone changes a filename.

So I built something to fix where I start. It's called **Detection Chokepoints**, and it's live:
[iimp0ster.github.io/detection-chokepoints](https://iimp0ster.github.io/detection-chokepoints/).

{% include post-pixel-art.html src="/assets/img/pixel/concepts/chokepoint.png" alt="A funnel where many attack paths converge down to a single point" caption="A chokepoint: every variant funnels through the one step the attacker can't avoid." %}

## The lesson hiding in the last post

Last post I mapped [ClickFix variants](/blog/clickfix-variant-coverage-map/) — mshta, the
PowerShell paste-to-Run one-liner, the MSIX/AppInstaller lure. Three delivery shapes, and the
list keeps growing. If you chase the variants, you're back on the treadmill.

But look at what *didn't* change across all three. Every ClickFix variant ends with the victim
pasting an attacker-supplied command into the Run dialog, which means the payload launches as a
child of `explorer.exe`. The lure art changes. The binary changes. The clipboard trick changes.
**The `explorer.exe → child process` step does not.** It can't — that's the entire mechanism of
the technique. The user *is* the execution primitive.

That unavoidable step is a **chokepoint**. And once you start looking for them, they're
everywhere.

## What a chokepoint actually is

The framework comes from Matt Graeber's threat-research method (Red Canary). For any technique,
you ask six questions in order, but the one that matters most is the fourth:

1. What is this technique, technically?
2. What must be true for it to succeed?
3. What does the attacker control?
4. **What *can't* the attacker control?** ← the chokepoint
5. Can we observe it independent of intent?
6. What are all the possible variations?

Question four is where durable detection lives. Take LSASS credential dumping. There are
**22 tools** in the project tracking this one behavior — Mimikatz, comsvcs.dll, ProcDump,
Nanodump, HandleKatz, PPLBlade, Pypykatz, secretsdump, the C2 built-ins in Cobalt Strike,
Sliver, Havoc, Brute Ratel, Mythic, and more. Different authors, different syscalls, different
evasion tricks. Every single one has to do the same thing:

> A process must open a kernel-mediated handle to `lsass.exe` and read its virtual memory to
> extract credential material.

It cannot dump what it cannot read. The kernel mediates the handle. That's the chokepoint, and
it has survived since Mimikatz dropped in 2011 — through the LOLBin era, the direct-syscall era,
the handle-duplication era, the BYOVD-PPL-bypass era. The tools rotated constantly. The
chokepoint never moved.

**TTPs evolve. Chokepoints don't.** That's the whole bet.

The site is organized into three sections, and each one does a different job for you.

## Section 1 — Chokepoints

This is the core: **9 entries across 6 ATT&CK tactics** (credential access, defense evasion,
discovery, initial access, lateral movement, persistence), with more in the pipeline. LSASS
dumping, browser credential theft, AiTM WebSocket relay, ransomware service manipulation, EDR
bypass via BYOVD, ClickFix, renamed RMM tools, remote execution tooling.

Each entry isn't a single rule — it's the invariant broken into a **detection chain**. For
LSASS that's three stages:

- **Handle Acquisition** — the process requests a handle to `lsass.exe` with read access
  (Sysmon EID 10 / ETW Threat Intelligence)
- **Memory Read** — it reads LSASS memory via `NtReadVirtualMemory` or `MiniDumpWriteDump`
  (Sysmon EID 10 CallTrace)
- **Credential Extraction** — it parses the memory structures or dump file
  (Sysmon EID 10 + EID 7 + EID 11)

For every stage there's the **invariant**, the **observable**, an explicit *why the attacker
can't bypass this*, the log sources that cover it, and a Sigma rule.

And the Sigma rules ship at **three maturity tiers**, so you pick based on where your SOC is:

| Tier | Goal | FP rate | Use it when |
|---|---|---|---|
| **Research** | Establish visibility, baseline | High | You're validating log sources / baselining your environment |
| **Hunt** | Cut noise, keep coverage | Medium | You're running periodic sweeps and campaign hunts |
| **Analyst** | Production alerting | Low | You want an automated alert that pages someone |

That tiering is deliberate. The most common reason a good detection idea dies is that someone
deploys the high-fidelity Analyst rule into an environment that was never baselined, drowns in
false positives, and rips it out. Start at Research, learn your noise, climb the tiers.

Back to **ClickFix** — it's one of the nine entries, mapped exactly this way: the chokepoint is
the `explorer.exe` parent chain plus a network-origin payload, and there's even an **IOK rule**
(Indicator of Knowledge) for the lure page itself — detecting the clipboard-seed-plus-execution-
instruction behavior regardless of how the fake CAPTCHA is skinned. Same philosophy, pushed all
the way out to the web layer.

## Section 2 — Attack Chains

{% include post-pixel-art.html src="/assets/img/pixel/concepts/attack-chain.png" alt="A chain of linked kill-chain stages with one link highlighted" caption="When unrelated actors converge on the same kill-chain stage, that overlap is your priority." %}

Here's the part for the defender staring at the backlog asking *which one first?*

The **attack chains** take procedure-level data from 60+ vendor and government reports
(260+ procedures across 36 reports for the ransomware chain alone) and show where **different
threat actors converge on the same kill-chain stage**. Five chains so far:

- **Ransomware** — BlackBasta, LockBit 3.0, Akira, ALPHV/BlackCat, Play
- **Infostealers** — RedLine, LummaC2, Vidar, StealC, Raccoon
- **AiTM / phishing kits** — Tycoon 2FA, Evilginx, EvilProxy, Sneaky 2FA, Device Code
- **Hypervisor compromise** — BRICKSTORM/UNC5221, UNC3886, Scattered Spider, Play, ALPHV
- **Identity domination** — APT29, Storm-0501, Storm-2372, Scattered Spider, ransomware ops

When five unrelated ransomware crews all route through *Credential Access → LSASS* and
*Lateral Movement → valid admin creds over 445/3389/135*, that convergence is your priority
signal. You're not guessing which detection matters — the actors voted for you. Each chain links
the converged stage straight to the chokepoint entry that covers it, so the path from "five groups
do this" to "here's the Sigma rule" is two clicks.

**This is the answer to "where do I start."** Don't start at a random technique. Start where the
threats you actually face overlap.

## Section 3 — Trends

The last section keeps you from instrumenting yesterday's problem. **Trends** is data-driven
analysis of how the landscape is *shifting*:

- **ClickFix / ClickGrab delivery** — 10 months of data (April 2025–March 2026) across 20K+
  malicious sites: how the cradle families evolved, when self-delete and CDN staging showed up,
  which evasion techniques are accelerating.
- **Edge-device exploits** — honeypot telemetry across 25 decoy types: CitrixBleed 2
  proliferation, the SAP CVE-2022-22536 burst, multi-stage kill chains, self-replicating worms.

Chokepoints tell you what's invariant. Trends tell you what's *moving* — which variant is about
to become the dominant one, so you tune the Hunt-tier rule before the wave, not after the
incident. Each chokepoint entry also carries an **evolution timeline** for the same reason: you
can see every era of bypass for a technique and confirm, every time, which condition held
constant. That constant is what you instrument.

## So — where do you actually start?

If you're underwater and don't know where to begin, here's the three-step move the site is built
to support:

1. **Pick your threat from the Attack Chains.** Ransomware-focused? Identity? Open the chain that
   matches your reality and find the stage where the most actors converge. That's your highest-
   leverage target — chosen by the adversaries, not by you.
2. **Open the linked Chokepoint and deploy the Research-tier Sigma rule.** Don't reach for the
   production alert yet. Get visibility, watch it for a week, learn what normal looks like in
   *your* environment.
3. **Climb the tiers and check Trends before you tune.** Move Research → Hunt → Analyst as your
   noise model firms up, and glance at the trend data so you're hardening against where the
   technique is going, not where it was.

One chain, one chokepoint, one rule. That's a real first step, and it's durable — when the tool
rotates next month, your detection is still sitting on the thing that can't change.

The whole thing is open and free:
[**iimp0ster.github.io/detection-chokepoints**](https://iimp0ster.github.io/detection-chokepoints/).
Every chokepoint has its Sigma rules, log sources, variations, and lab emulation scripts in the
open. If you've got a technique you've reverse-engineered down to its invariant, or a variation
the project is missing, contributions are welcome — there are templates and a contribution guide
in the repo.

TTPs evolve. Chokepoints don't. Go pick one.
