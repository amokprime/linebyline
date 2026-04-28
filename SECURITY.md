# Security Policy

## Supported Versions

| Version                                                                                | Supported          |
| -------------------------------------------------------------------------------------- | ------------------ |
| [docs/index.html](https://github.com/amokprime/linebyline/blob/main/docs/index.html)   | :white_check_mark: |
| [semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic)         | :x:                |
| [pre-semantic](https://github.com/amokprime/linebyline/tree/main/archive/pre-semantic) | :x:                |

## Reporting a Vulnerability
You can open a new [Issue](https://github.com/amokprime/linebyline/issues) or [report it privately](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/privately-reporting-a-security-vulnerability). There are many known [false positives](https://github.com/amokprime/linebyline/blob/main/SECURITY.md#false-positives) that boil down to these points:
1. LineByLine is an offline app. Loading the GitHub Page is basically the same as downloading index.html and opening it in a browser.
2. Scanners treat it like a website that stores and processes data server-side. SonarQube Cloud is especially spammy here. I'm using it more to check Claude's code quality as CodeQL already covers security.

I am not a cybersecurity professional or security researcher. What I can do about any [true positives](https://github.com/amokprime/linebyline/blob/main/SECURITY.md#true-positives):
1. Me asking Sonnet - hopefully it's solved here🤷
2. GitHub account compromise - I change all my passwords
3. Code issue AI can't solve confined to recent version of the app - delete folder and commit
4. Code issue AI can't solve affecting most versions of the app - archive whole repo

## Deprecated tools
I am switching to CodeQL + making PRs for future changes instead of directly committing.
Opengrep Windows CMD check:
``` cmd
for /f "tokens=*" %v in ('opengrep --version') do @for /f "tokens=*" %r in ('curl -s https://api.github.com/repos/opengrep/opengrep/releases/latest ^| findstr "tag_name"') do @echo Installed: %v & echo Latest: %r
```
Opengrep/Semgrep scan
```
opengrep scan --config auto --taint-intrafile --exclude-rule html.security.audit.missing-integrity.missing-integrity
```

## True positives
- SonarQube Cloud warning "Change this code to not construct the path from user-controlled data" (affects abandoned Python code)
	- Action: Move [python_abandoned](https://github.com/amokprime/linebyline/blob/main/archive/python_abandoned) and [Python](https://github.com/amokprime/linebyline/blob/main/archive/pre-semantic/0_abandoned/Python) folders out of repo and commit
	- Probably an overreaction, but I wanted to clean up the repo architecture anyway to just show HTML/JS. If someone wants to work on the Python I'll share them.

## False positives
- [Semgrep](https://github.com/amokprime/linebyline/blob/main/security/Semgrep.md)/[Opengrep](https://github.com/amokprime/linebyline/blob/main/security/Opengrep.md) scans flag `html.security.audit.missing-integrity.missing-integrity`. Claude Sonnet 4.6 says it's a false positive so I'm just going to use `--exclude-rule html.security.audit.missing-integrity.missing-integrity` until I get supporting errors from another tool (i.e. Mozilla Observatory), or a human programmer or security researcher says it's a real problem
- [Mozilla Observatory](https://github.com/amokprime/linebyline/blob/main/security/Mozilla.pdf) scan flags Content Security Policy, X-Content-Type-Options, and X-Frame-Options. Again [Sonnet](https://github.com/amokprime/linebyline/blob/main/security/Mozilla.md) says it's not a problem so I'll ignore those for now.
- [CodeQL](https://github.com/amokprime/linebyline/blob/main/security/CodeQL.md) scan warned that Node.js 20 is deprecated and would be replaced with Node.js 24 starting June 2nd this year. I opted into it now.
- [SonarQube Cloud](https://github.com/amokprime/linebyline/blob/main/security/SonarQube.md) 
	- Denial of Service: "Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service."
		- 548 cases that look like `text.match(/^\[ti:\s*(.+)\]/m)`
		- LineByLine is a client-side app. All processing happens in the user's browser.
	- Weak Cryptography: "Make sure that using this pseudorandom number generator is safe here."
		- 26 cases that look like `const DEFAULT_META = '[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: Genius, GeniusLyricsCopier, LineByLine]\n[by: contributor'+Math.floor(1000+Math.random()*9000)+']\n\n';`
		- This was used to append `[by: contributor 9124]` in early versions.
	- "Make sure not using resource integrity feature is safe here."
		- 3 cases that look like `<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">`
		- All three files are in `archive/pre-semantic/29/` which predated the GitHub Page and will not be deployed. 
			- The GitHub Page only ever deploys a copy of the latest `archive/semantic/` version that was QA tested and passed CodeQL
	- "Make sure not using "noopener" is safe here."
		- 58 cases that look like one of these:
			- `function openHelp({window.open('https://github.com/amokprime/linebyline/blob/main/HELP.md','_blank');}`
			- `if(hk.issues&&hkMatch(ks,hk.issues)){e.preventDefault();window.open('https://github.com/amokprime/linebyline/issues','_blank');return;}`
		- Those are pages for this repo.