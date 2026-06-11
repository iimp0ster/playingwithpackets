---
layout: post
title: "Inside a Chokepoint Entry: A ClickFix Walkthrough"
date: 2026-06-08
tags: [detection, chokepoints, clickfix, sigma]
excerpt: "The chokepoints post made the case for anchoring detection to what attackers can't avoid. This one is the practical side: what an actual entry gives you, walked through with ClickFix."
---

In the [Detection Chokepoints](/blog/detection-chokepoints-where-to-start/) post I made the case
for anchoring detection to the one step an attacker can't avoid. That's the idea. This post is the
practical side: what an actual entry gives you and how to work through one. I'll use the
[ClickFix entry](https://iimp0ster.github.io/detection-chokepoints/chokepoints/clickfix-techniques/)
as the tour, since it's a technique most defenders are already fighting.

## The constant, up top

Every entry leads with the invariant, the thing that doesn't change. For ClickFix it's:

> Clipboard write → user pastes into interpreter → outbound C2 connection.

Alongside it you get the quick read on the technique: severity (HIGH), prevalence (HIGH),
detection difficulty (LOW), and the ATT&CK mapping (T1204.004, malicious copy-paste). That one
line is the whole reason the entry exists. It holds across every variant the project tracks, so
if you instrument it, you're not chasing names.

## The chokepoint, broken into stages

The entry doesn't hand you a single rule. It breaks the invariant into the stages the attacker
has to move through, and each stage is its own detection opportunity:

1. **Clipboard Seeding**: the lure page writes a command to the clipboard via JavaScript *and*
   shows paste instructions. Both have to be true; that co-occurrence is the tell.
2. **Interpreter Execution**: a script interpreter spawns as a child of `explorer.exe`, a
   browser, or `wt.exe`.
3. **Second Stage Retrieval**: the interpreter reaches out to attacker infrastructure to pull
   the real payload.

The reason this matters: if one stage is blind in your environment, you still have two more shots
at it. You're not betting the detection on a single event.

## Detection at the tier your SOC can actually run

Each stage carries rules at the maturity tiers, and, where it's possible, earlier pre-execution
options like an ETW clipboard-write rule or an IOK rule on the lure page itself. For every rule
the entry spells out:

- **Goal**: what the rule is trying to catch
- **Log / Data Sources**: what you need to be collecting for it to work
- **FP Rate**: how noisy it'll be
- **Use Case**: when to deploy it (baseline, hunt, or production alert)
- **Detection Logic**: the condition in plain pseudocode
- **Bypass Risk**: how it can be evaded, stated honestly
- **Sigma rule**: the full YAML, copy it or pull it from GitHub

So you're not just told "detect ClickFix." You're told what to deploy, where, and what it'll cost
you in noise, which is the part that decides whether a detection survives contact with a real SOC.

## Variations: the proof the chokepoint holds

The entry tracks nine variants: the original ClickFix, FileFix, TerminalFix, DownloadFix, the
JackFix/GlitchFix/ConsentFix family, WebDAV ClickFix, InstallFix, a Windows Terminal version that
parents off `wt.exe`, and a DNS-based one that stages its payload through `nslookup` to dodge URL
filtering. Each one shows the lure the user sees, a defanged copy of the clipboard payload, and a
one-line note that it routes through the *same* chokepoint.

That's the point of the section. It's not a list to memorize: it's evidence. Every new lure since
2024 still funnels through clipboard seeding, interpreter execution, and a network callback. The
constant held.

## The evidence, and a way to generate it yourself

Two sections I lean on the most. **Raw Log Samples** shows the real Sysmon events the chain
produces: process creation (the interpreter spawning), the DNS query, and the outbound network
connection, so you know exactly what you're looking for before you go looking. And **Emulation**
gives you a lab-only script that reproduces the behavior, so you can fire the chain in a controlled
box and confirm your rules actually trigger. I don't deploy a detection I've never watched fire,
and this is how you avoid having to.

Rounding it out, **OSINT Pivots** gives URLScan and VirusTotal queries to hunt the infrastructure,
and **Related Chokepoints** links out to the entries this commonly chains with (Renamed RMM Tools,
Ransomware Service Manipulation) so you can follow the kill chain instead of stopping at one step.

## That's the whole shape

Invariant up top, staged detections in the middle, variants and raw telemetry to back it,
emulation to test it. Every chokepoint in the project is built the same way; ClickFix is just a
good one to learn on. Pick the stage your telemetry already covers, deploy the Research-tier rule,
watch it in your environment, and climb from there.

Browse it for yourself:
[**the ClickFix entry**](https://iimp0ster.github.io/detection-chokepoints/chokepoints/clickfix-techniques/).
