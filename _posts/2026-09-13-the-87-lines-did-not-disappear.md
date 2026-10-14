---
layout: post
title: "Beyond DLL Names: Extending Elastic's DLL Hijacking Detection"
date: 2026-10-13
published: true
tags: [detection, chokepoints, windows, dll-hijacking, elastic]
excerpt: "Elastic moved DLL identity logic to the endpoint and replaced thousands of query conditions with one reusable field. The same idea can help normalize trusted host and DLL relationships."
---

Elastic Security Labs recently published a DLL search-order hijacking detection that caught my
attention since they're discussing a DLL side-loading chokepoint of their own. Their old rule was about 88 lines long. It carried roughly 2,600 DLL names along with path,
signature, and file-age conditions. Now, in Elastic Defend 9.5.0, the query is reduced to one line:

```sql
library where host.os.type == "windows" and event.action == "load" and
  dll.Ext.defense_evasions : "DLL Hijack: Masquerading"
```

## Where the 87 lines went

Now, the Elastic Defend sensor maintains a cached inventory of Windows and system-library DLL names. When a process
loads a DLL that is not Microsoft-signed and its name appears in that inventory, the sensor can add
the `DLL Hijack: Masquerading` value to the event.

The sensor has normalized DLL search-order hijacking into:

> Did this process load a non-Microsoft DLL that is using the name of a Windows library?

The Elastic rule consumes the classification
and decides what to do with it. Recent creation, prevalence, product allowlists, and alert policy can
still live downstream in a rule that's a lot easier to maintain over time.

## Why the loader allows it

When an application asks for a DLL without a full path, Windows has to resolve the name. Several
mechanisms affect that decision, but the application directory normally appears before System32 for
an unpackaged application.

That behavior is useful for software that ships its own dependencies. It also creates an opening for
side-loading. If an attacker places a compatible DLL beside a trusted executable and gives it the
name that executable requests, Windows may select the adjacent copy before the protected system copy.

Safe DLL search mode does not remove application-directory precedence. Developers can avoid the
ambiguity by requesting a fully qualified path or using a constrained library search policy.

## One loader, many names

[Elastic's reconstruction](https://www.elastic.co/security-labs/threat-command/dll-search-order-hijacking-elastic-defend)
starts with a ClickFix campaign reported by eSentire. The chain places a signed Microsoft utility,
`vb7to8.exe`, beside a malicious `mscoree.dll`. The utility imports functions from `mscoree.dll`, so
Windows maps the adjacent file into the trusted process. The chain later hollows
`ServiceModelReg.exe` to run the Remus infostealer.

The specific pair matters during an investigation, but the export table is more interesting for
detection design. Elastic counted 231 exports matching functions found across common Windows DLLs.
Normalizing or doing a meta-analysis of commonly imported functions from malware could be another chokepoint as well. You only care about what the malware is trying to import from a benign DLL.
That suggests the same loader could be renamed and packaged beside other vulnerable executables.

A rule for `vb7to8.exe` plus `mscoree.dll` catches one implementation.
The same normalization pattern can extend beyond the DLL name. Many side-loading opportunities are
defined by a relationship: a particular executable is known to request a particular DLL. That adds
the host executable as a second dimension.

## From DLL names to host and DLL relationships

Elastic's inventory answers a one-dimensional question:

```text
does this dll name exist in the Windows system-library inventory?
```

The Trusted Binary DLL Side-Loading chokepoint asks a related two-dimensional question:

```text
(does this trusted host identity and dll name) exist in a catalog of vulnerable relationships?
```

[HijackLibs](https://hijacklibs.net/api/) already publishes this kind of knowledge. Its generated
datasets connect DLL names with executables known to load them. The entries also carry useful context
about paths, loading methods, and sources.

Instead of putting those pairs into every rule, a detection pipeline could turn the dataset into a
relationship classifier. When a module-load event arrives, the classifier asks whether the host and
DLL match a documented relationship. It can then retain the match as context alongside the process
path, DLL path, signer information, and file age.

{% include post-screenshot.html src="/assets/img/posts/the-87-lines-did-not-disappear/loader-normalization.svg" alt="A signed executable loading an adjacent DLL through the Windows PE loader, followed by two normalization paths: Elastic's system-library name inventory and a HijackLibs host-to-DLL relationship catalog" caption="The module-load event does not change. Elastic classifies a DLL-name collision; the proposed relationship catalog classifies a documented host-to-module pair." %}

A catalog match would not prove that side-loading occurred. Vulnerable applications still load their
dependencies during normal use. The runtime relationship matters too. If HijackLibs documents a
same-directory load, the observed executable and DLL should appear in that arrangement before the
event receives a stronger candidate label.

A candidate classification can combine the relationship with runtime context:

```text
known host/DLL pair
    + documented loading relationship
    + suspicious runtime context
    = side-loading candidate
```

The proposed classification belongs in a custom namespace rather than Elastic's schema:

```text
custom.side_load.classification: known_pair_candidate
```

A backend hunt can then consume the result:

```sql
library where host.os.type == "windows" and event.action == "load" and
  custom.side_load.classification == "known_pair_candidate"
```

The catalog and classifier perform the lookup once instead of making every rule rebuild it.

## How the chokepoint page can contribute

My [Trusted Binary DLL Side-Loading draft](https://github.com/iimp0ster/detection-chokepoints/blob/iimp0ster/trusted-binary-dll-sideloading/chokepoints/defense-evasion/trusted-binary-dll-sideloading.yml)
already records several source-backed relationships:

- `fltMC.exe` loading `FLTLIB.dll` in a JFMBackdoor chain
- `GameBox.exe` loading `utility.dll` in a ValleyRAT chain
- `mscorsvw.exe` loading `mscorsvc.dll` in a HazyBeacon chain
- `vb7to8.exe` loading `mscoree.dll` in the Remus chain

The page also includes the source, variation ID, campaign context, and a short explanation of how each
example crosses the chokepoint. Those records could feed the same relationship catalog as reviewed
examples. HijackLibs provides breadth. The chokepoint page adds campaign evidence and explains why the
relationship matters.

Only source-backed values belong in the feed. Where a source names both files, the page can expose the
observed host name, DLL name, and loading relationship as structured fields. The current AGINGFLY
entry does not name the files, so it would not emit a host/DLL pair.

The page remains the source for the invariant and its evidence. A separate build step can convert the
structured records into a versioned catalog.

## Known pairs and unknown pairs

The catalog-backed idea covers documented relationships, but the catalog is not the chokepoint. An
attacker can find a vulnerable executable that HijackLibs and my page have never recorded. The host
still has to map the selected DLL.

That leaves two detection arms:

1. A catalog-backed arm looks for a documented host/DLL relationship plus the expected loading method
   and suspicious context. It is easier to explain, but it only knows documented pairs.
2. A catalog-independent arm looks for broader behavior such as a trusted executable relocated to an
   unusual directory and loading an adjacent, newly created, or unexpected DLL.

{% include post-screenshot.html src="/assets/img/posts/the-87-lines-did-not-disappear/detection-arms.svg" alt="The host-to-module load chokepoint branching into a catalog-backed analytic for known HijackLibs pairs and a catalog-independent analytic for relocated trusted hosts loading unusual adjacent DLLs" caption="The catalog produces the precise branch. The broader relationship hunt keeps coverage when the attacker chooses an undocumented pair." %}

The two arms share the same observation: process X mapped module Y. The difference is how much prior
knowledge the classifier has about that relationship. For unknown pairs, this is a great place to start a hunting hypothesis for benign applications that can be abused for DLL side-loading.

## Sources

- [Elastic Security Labs: From 88 lines to 1](https://www.elastic.co/security-labs/threat-command/dll-search-order-hijacking-elastic-defend)
- [Elastic detection-rules: pre-9.5.0 masquerading DLL rule snapshot](https://github.com/elastic/detection-rules/blob/27db996cef5fd3d5630f16fe2066eee45df03412/rules/windows/defense_evasion_masquerading_windows_dll.toml)
- [Detection Chokepoints: Trusted Binary DLL Side-Loading draft](https://github.com/iimp0ster/detection-chokepoints/blob/iimp0ster/trusted-binary-dll-sideloading/chokepoints/defense-evasion/trusted-binary-dll-sideloading.yml)
- [HijackLibs: generated DLL/EXE relationship datasets](https://hijacklibs.net/api/)
- [Microsoft: Dynamic-link library search order](https://learn.microsoft.com/windows/win32/dlls/dynamic-link-library-search-order)
- [MITRE ATT&CK T1574.001: Hijack Execution Flow, DLL](https://attack.mitre.org/techniques/T1574/001/)
