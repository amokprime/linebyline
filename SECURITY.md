# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| semantic   | :white_check_mark: |
| pre-semantic   | :x:                |
| python_abandoned   | :x:                |

## Reporting a Vulnerability
You can open a new [Issue](https://github.com/amokprime/linebyline/issues) or [report it privately](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/privately-reporting-a-security-vulnerability). I should see it in a day or two. Since I'm not a developer or security researcher this will boil down to asking Sonnet.

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
