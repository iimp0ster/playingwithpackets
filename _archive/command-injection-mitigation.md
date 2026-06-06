---
layout: archive
title: "Command Injection Mitigation"
date: 2018-12-02
description: "Defensive controls for command injection — input validation, least privilege, and sandboxing."
original_url: https://playingwithpackets.com/command-injection-mitigation/
archived: true
---

## Input Validation

Input validation involves verifying user data before it passes through an application, ensuring users can only input a limited data range. One approach creates a whitelist of pre-approved commands for specific application use. Another strategy defines allowed regular expressions. Since only domain names should be accepted, a regex pattern like `/a-zA-Z0-9/` restricts input to "lowercase and uppercase letters A through Z as well as numbers 0 through 9."

## Least Privilege

The principle of least privilege means computer system users possess only the minimum functions necessary for their tasks. On Windows systems, regular users shouldn't open command prompts with administrative privileges — only System or Network Administrators should. For web applications, the `www-data` user shouldn't execute system commands. Alternatively, whitelist a single command (like `nslookup`) if that's the application's only function, blocking all other system commands to reduce attack surface.

## Web Shell Detection

File Integrity Monitoring (FIM) establishes a baseline of specific system files, then monitors for deviations. Security teams receive alerts on anomalies for further analysis. SANS provides a list of file paths for both UNIX and Windows where FIM can be deployed.

Additionally, watch for suspicious shell commands. With least privilege enforcement, commands like `cat /etc/passwd` or `cat /etc/shadow` would be unusual and warrant investigation.
