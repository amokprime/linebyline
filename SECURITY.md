# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| semantic   | :white_check_mark: |
| pre-semantic   | :x:                |
| python_abandoned   | :x:                |

## Reporting a Vulnerability
You can open a new [Issue](https://github.com/amokprime/linebyline/issues) or [report it privately](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/privately-reporting-a-security-vulnerability). There are some known [false positives](https://share.note.sx/9wimmaly). I am not a cybersecurity professional or security researcher. What I can do about any true positives:
1. Me asking Sonnet - hopefully it's solved here🤷
2. GitHub account compromise - I change all my passwords
3. Code issue AI can't solve confined to recent version of the app - `git revert` that commit or range of commits
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
