---
layout: post
title: "Convergence Is Architecture, Not Coincidence"
date: 2026-06-25
published: true
tags: [detection, chokepoints, attack-chains, sigma, threat-hunting]
excerpt: "A section-by-section read of the ransomware attack chain: the overlap graph where five actors collapse to three cells, the per-stage chokepoints, and the actor matrix whose bottom row outlives every tool in it. Plus why catching one chain is an early warning for the next."
---

As you dig into investigations over time, you'll start to notice that some threats start to blur together. The names change and the tooling changes, but the general attack path remains. For example, after observing TTPs of different ransomware operators, you'll start seeing the one shape they all move through.

## Different actors, same boxes

In my [first post](/blog/detection-chokepoints-where-to-start/) I discussed the concept of pinning detections to invariants instead of things an attacker can control; in the [second post](/blog/inside-a-chokepoint-entry/) I went through my ClickFix chokepoint and explained how a defender could leverage it. This post zooms out to a whole kill chain, focusing on five ransomware actors, and the page that lines them up.

Why do unrelated threat actors keep landing on the same techniques? This is most likely caused by creating your own tools, using cracked or open source tools. Regardless, an operator who copied nothing is still subjected to the protocols of the environment they're operating in. When a LockBit affiliate and a nation-state actor both dump LSASS, stop the backup service, and execute remote commands via SMB on another endpoint, they aren't imitating each other; they're obeying the same constraints. Convergence is architecture, not coincidence, and the spot where every threat is *forced* to converge is another way to think about where to invest your detection effort.

{% include post-screenshot.html src="/assets/img/posts/convergence-is-architecture/ransomware-chain-graph.png" alt="Force-directed graph of the ransomware chain: five actors on the left, their techniques fanned across the kill-chain phases, edges converging on the techniques they all share at impact." caption="The ransomware chain as a convergence graph. Five operators on the left, every technique they use fanned across the phases, the edges pulling together on the handful they all share. The ringed nodes on the right (inhibit recovery, encrypt) are used by every actor." %}

## The ransomware attack chain explained

The [ransomware attack chain](https://iimp0ster.github.io/detection-chokepoints/attack-chains/ransomware/) is a great place to see it: five operators who share nothing but a business model (BlackBasta, LockBit 3.0, Akira, Alphv/BlackCat, Play). The whole approach is adapted from Kaspersky's [Common TTPs of Modern Ransomware (2022)](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2022/06/23093553/Common-TTPs-of-the-modern-ransomware_low-res.pdf), which analyzed eight ransomware groups and found they all ran the same core kill chain no matter the tooling. This chain rebuilds that overlap analysis from 260 procedures across 36 reports through the [Kitsune](https://github.com/christina23/kitsune) and [ORKL](https://orkl.eu/) pipeline.

The first view drops all five onto the full kill chain, every technique any of them used as a card with a dot per actor. It's deliberately busy, and that's the point: initial access alone shows five different techniques, so nobody converges on how they get in. The orange-bordered cards highlight when a TTP is used by all actors. Out of dozens, three light up: command and scripting interpreter (T1059) at execution, inhibit system recovery (T1490) and data encrypted for impact (T1486) at the end. Run code, neutralize recovery, encrypt. Everywhere else the threat actors diverge; here they can't.

The graph also filters by actor. Select the two still active, Akira and Play, and nineteen cells light as shared, a common theme through execution, discovery, credential access, lateral movement, and impact. These two actors are otherwise unrelated, yet run nineteen of the same techniques.

{% include post-screenshot.html src="/assets/img/posts/convergence-is-architecture/ttp-overlap-convergence.png" alt="TTP overlap grid with Akira and Play selected: the nineteen techniques both use glow cyan as a shared spine down the chain, single-actor cells faded, three cells orange-bordered for being used by all five actors." caption="The overlap grid with the two still-active actors selected, Akira and Play. The cyan cells are the nineteen both use, their shared path through the chain; single-actor cells fade back. The three orange-bordered cells (T1059, T1490, T1486) are the ones shared by all five actors." %}

## From convergence to chokepoint to variation

Cells converge for two reasons. Sometimes the platform forces it: you can't skip running code, killing recovery, or encrypting, so a detection there can't be evaded. Other times a technique just isn't worth avoiding, so nearly every actor takes the same cheap, reliable road, RDP for lateral movement or vssadmin for shadow-copy deletion. Either way the cell lights up across actors, and that's your cue to look closer.

Looking closer takes two moves, and they line up with steps four and six of the project's [framework](https://iimp0ster.github.io/detection-chokepoints/framework/). First, name the chokepoint inside the convergence, the invariant the technique depends on, written to survive a tool swap: inhibit-recovery isn't "vssadmin ran," it's "a SYSTEM-level process deleted the shadow copies." That's what the page's per-stage chokepoint cards state, with the signals that expose each one. Second, track the variations inside it, every tool that satisfies that one prerequisite: `vssadmin delete shadows`, `wmic shadowcopy delete`, a PowerShell `Win32_Shadowcopy` call, a raw write to the volume. The variations are where evasion and false positives live, so you tune against them without moving the detection off the invariant.

{% include post-screenshot.html src="/assets/img/posts/convergence-is-architecture/stage-chokepoints.png" alt="Per-stage chokepoint cards for the ransomware chain, each showing the invariant, detection signals, and a link to the full chokepoint entry." caption="Each stage states the invariant the OS forces, the signals that expose it, and a link to the full chokepoint entry behind it." %}

## The bottom shows the shape of the attack path

The third view is the table that names the page: five operators down the side, five stages across, each cell holding that actor's tooling. The same actor filter drives it, so selecting actors lights their rows and fades the rest. Take the two still active, Akira and Play: their rows light up with completely different tooling (Akira on PowerTool and a Zemana driver, Play on GMER and IOBit) running the very same five stages.

The three rows dimmed behind them are already gone: BlackBasta inactive, LockBit disrupted, Alphv defunct, their tooling dead with the brand. Akira, the most prolific operator in the 2026 reporting (about 22% of cases per Sophos), runs nothing its predecessors ran and still lands in the same five boxes. The bottom row, labeled The Chokepoint, hasn't moved. Detections written against the cells would have been rewritten several times in two years. If your detection approach maps the bottom row, you'd need to write a rule only once (an oversimplification of course, but trying to make a point).

{% include post-screenshot.html src="/assets/img/posts/convergence-is-architecture/actor-convergence-matrix.png" alt="Actor convergence matrix with Akira and Play selected: their rows highlighted in green and blue, the three defunct actors (BlackBasta, LockBit, Alphv) dimmed, and the orange chokepoint invariant row fixed at the bottom." caption="The matrix with the same two actors selected as the grid above, Akira and Play. Their rows light in their filter colors, the three defunct actors fade behind them, and the orange chokepoint row stays fixed. Columns are the kill-chain stages; the bottom row is the invariant your detection must cover regardless of actor." %}

## From a matrix cell to a deployed rule

Let's zoom in on the credential-access column. The bottom-row invariant is `Elevated process reads memory/registry containing credential material`, and the prime example is usually dumping LSASS. The chokepoint entry behind it lists two dozen tools (Mimikatz, comsvcs.dll, the built-in dumpers in Cobalt Strike and Sliver) and collapses them to one requirement:

> A process must open a kernel-mediated handle to lsass.exe and read its virtual memory to extract credential material

For any user-mode credential dumper, this generally holds: `NtOpenProcess` has to cross into the kernel for the handle, and the kernel's `ObRegisterCallbacks` fires on every request, standard API or direct syscall. The kernel emits **Sysmon Event ID 10** when it does, so one telemetry source sits under all two dozen tools. A trimmed analyst-tier cut:

```yaml
title: 'LSASS Credential Dump: Non-Standard Process with Dump Mechanism and Suspicious Access Rights'
logsource:
  category: process_access
  product: windows
detection:
  selection_lsass_target:
    TargetImage|endswith: '\lsass.exe'
    GrantedAccess|contains:
      - '0x1FFFFF'
      - '0x1010'
  selection_dump_mechanism:
    CallTrace|contains:
      - 'dbgcore.dll'
      - 'dbghelp.dll'
      - 'UNKNOWN'
  # selection_nonstandard_source and filter_os_core elided for brevity
  condition: >
    (selection_lsass_target and selection_dump_mechanism and selection_nonstandard_source and not filter_os_core)
level: high
```

Reading the Sigma above, `TargetImage` is the invariant; `GrantedAccess` and `CallTrace` lift it out of the noise. It isn't quite one rule (handle-duplication tools like HandleKatz and kernel-mode BYOVD reads shift or skip the handle), but those are variations on the chokepoint, not escapes from it. Which is why the same chokepoint ships at three tiers, scoped to exactly this behavior:

| Tier | What it keys on for LSASS | False positives |
|------|---------------------------|-----------------|
| <img class="tier-badge" src="/assets/img/pixel/tiers/research.png" alt=""> **Research** | Any process opening a handle to `lsass.exe` (Sysmon EID 10) | High: AV, EDR, and backup agents all touch it |
| <img class="tier-badge" src="/assets/img/pixel/tiers/hunt.png" alt=""> **Hunt** | EID 10 with a dump access mask (`0x1010`/`0x1FFFFF`) and a `dbghelp`/`dbgcore`/`UNKNOWN` CallTrace | Medium: some admin and forensic tooling |
| <img class="tier-badge" src="/assets/img/pixel/tiers/analyst.png" alt=""> **Analyst** | The above, plus a source outside System32/Program Files, known-good filtered | Low: production alert |

Start at the Research tier to confirm you even see EID 10 on lsass in your environment, then add context to climb to Hunt and Analyst. The invariant never changes across the three. That shape does two jobs at once: every known variant funnels through it, and when a new tool deviates from it, you're seeing emerging tradecraft before it has a name.

## What next year's tradecraft does to the chain

These five ransomware operators are from a 2024-2025 snapshot. The real test is what happens when something genuinely new shows up, and three examples from this year each drop into a row that was already on the page.

**Remote ransomware.** Adversaries run the encryptor from an unmanaged box (an IoT device, a webcam) and encrypt managed shares over SMB, so process-based EDR is fairly blind to it. [Sophos](https://www.sophos.com/en-us/blog/the-sophos-annual-threat-report-cybercrime-on-main-street-2025), which named it, tracks it up more than 50% in a year. It looks like an EDR bypass, but the impact invariant doesn't vanish, it relocates: encryption still needs file writes, so the chokepoint moves to a flood of file renames from one remote source. New technique, same row, but you can identify it from a different data source. In this case, it would be file audit events (5140/5145 etc.) instead of process telemetry.

**BYOVD EDR killers.** The defense-evasion cells already list Backstab and a Zemana driver; the 2026 version is bigger. ESET documented the Gentlemen gang's [EDR-killer suite](https://www.welivesecurity.com/en/eset-research/killing-me-gently-inside-gentlemens-edr-killer-framework/), its GentleKiller framework alone carrying eight-plus variants, each abusing a different vulnerable driver. Two more 2025 actors crowd into the same cell: WarLock (Storm-2603) cycles the Antiy, NsecSoft, and Rising drivers, and DragonForce brings the TrueSight and Hangzhou Shunwang ones. Different actors, but they all share the same move. Every one still loads a signed-but-vulnerable driver to reach the kernel, and that driver load is the chokepoint.

**Legitimate RMM.** Microsoft's [2025 Digital Defense Report](https://www.microsoft.com/en-us/corporate-responsibility/cybersecurity/microsoft-digital-defense-report-2025/) ties remote-management tooling to 79% of ransomware incidents. The product rotates (AnyDesk, ConnectWise, Atera), but an RMM installed outside the IT workflow is the invariant, in the same initial-access box the five tracked actors sit in.

## The chains predict each other

The ransomware page's last section lists related chains, and that housekeeping is the most forward-looking thing on it. Infostealers feed ransomware; AiTM feeds account takeover. Each chain produces exactly the input the next one needs: a stealer harvests credentials, a broker resells them, another group detonates an encryptor. One chain's output is the next chain's prerequisite.

That makes the map directional, and a directional map predicts. Detect the infostealer collection chokepoint, a non-browser process reading Chrome's credential store, and you're looking at the front of a pipeline whose far end is ransomware. Detect AiTM token theft and the next thing to watch is identity-domination credential access and new mailbox rules. If you can detect one chain, it could serve as an early warning for future activity.

Lastly, due to the efficiency in RaaS ecosystems, dev cycles have shortened. Mandiant's M-Trends 2026 puts the median handoff from access broker to ransomware operator at 22 seconds, down from more than eight hours. By the time the operator logs in there's nothing left to react to, so the upstream detection is the warning you actually get to use. The cases are on the record: infostealer credentials behind the 2024 Snowflake breach (165+ orgs), RansomHub running ClickFix to stealer to broker to ransomware, Scattered Spider going AiTM to an Okta session to ransomware. Same seam every time, and that seam is a chokepoint you already know how to detect.

*Gentlemen, WarLock, and DragonForce are already lining up the same way: three actors, three different vulnerable drivers, one chokepoint under all of them. I'll give that cluster its own post.*
