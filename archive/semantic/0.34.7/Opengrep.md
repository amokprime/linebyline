Many versions seem to flag this same false positive. Assuming it is indeed the same pattern, how do I make Opengrep ignore it in future scans?

``` cmd
opengrep scan --config auto --taint-intrafile --verbose
[00.08][INFO]: Opengrep version: 1.19.0

┌──────────────┐
│ Opengrep CLI │
└──────────────┘

✔ Opengrep OSS
  ✔ Basic security coverage for first-party code vulnerabilities.

[00.08][INFO]: Getting the rules
  Loading rules from registry...
[00.08][INFO]: trying to download from https://semgrep.dev/c/p/default
[00.29][INFO]: finished downloading from https://semgrep.dev/c/p/default
[01.04][INFO]: loading local config from C:\Users\me\AppData\Local\Temp\opengrep0-0-afd389.yaml
[02.08][INFO]: Done loading local config from C:\Users\me\AppData\Local\Temp\opengrep0-0-afd389.yaml
[02.09][INFO]: Computing the targets
[02.09][INFO]: Running external command: "git" "-C" "A:\Scripts\GitHub\linebyline" "ls-files" "-z" "--cached" "A:\Scripts\GitHub\linebyline"\
[02.13][INFO]: Running external command: "git" "-C" "A:\Scripts\GitHub\linebyline" "ls-files" "-z" "--others" "--exclude-standard" "A:\Scripts\GitHub\linebyline"\
[02.19][INFO]: running 1059 rules from 1 config auto
Rules:
<SKIPPED DATA (too many entries; adjust with --max-log-list-entries)>
[02.19][INFO]: scan subcommand: 1059 valid rules, 0 invalid rules, 187 targets
[02.19][INFO]: running the opengrep engine


┌─────────────┐
│ Scan Status │
└─────────────┘
  Scanning 187 files tracked by git with 1059 Code rules:

  Language      Rules   Files          Origin      Rules
 ─────────────────────────────        ───────────────────
  <multilang>      95     187          Community     344
  html              1      65
  python          243      37
  bash              4       1

[02.21][INFO]: scan: processing 664 files (skipping 0), with 344 rules (skipping 0 )
[02.24][WARNING]: Cross-function taint analysis (--taint-intrafile) may not be fully supported for Bash. Results may be limited to intraprocedural analysis only.
[25.11][INFO]: reporting matches if any


┌──────────────────┐
│ 31 Code Findings │
└──────────────────┘

    app\linebyline.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\27\linebyline_27.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_1.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_2.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_3.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_4.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_5.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_6.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_7.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_8.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\28\linebyline_28_9.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\29\linebyline_29.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

           10┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\30\linebyline_30.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\30\linebyline_30_1.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\30\linebyline_30_2.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\30\linebyline_30_3.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\31\linebyline_31.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\32\linebyline_32.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\33\linebyline_33.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\33\linebyline_33_1.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\pre-semantic\33\linebyline_33_2.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.33.3\linebyline_33_3.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.0\linebyline-0.34.0.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.1\linebyline-0.34.1.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.2-0.34.3\linebyline-0.34.2.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.2-0.34.3\linebyline-0.34.3.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.4\linebyline-0.34.4.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.5\linebyline-0.34.5.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.6\linebyline-0.34.6.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

    archive\semantic\0.34.7\linebyline-0.34.7.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The 'integrity' attribute allows
          for the browser to verify that externally hosted files (for example from a CDN) are delivered
          without unexpected manipulation. Without this attribute, if an attacker can modify the externally
          hosted resource, this could lead to XSS and other types of attacks. To prevent this, include the
          base64-encoded cryptographic hash of the resource (file) you’re telling the browser to fetch in
          the 'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

            7┆ <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect ...
            [shortened a long line from output, adjust with --max-chars-per-line]

[25.26][INFO]:
========================================
Files skipped:
========================================

  Always skipped by Opengrep:

   • <none>

  Skipped by .gitignore:
  (Disable by passing --no-git-ignore)

   • <all files not listed by `git ls-files` were skipped>

  Skipped by .semgrepignore:
  (See: https://semgrep.dev/docs/ignoring-files-folders-code/#understand-semgrep-defaults)

   • .github\ISSUE_TEMPLATE\bug_report.md
   • .github\ISSUE_TEMPLATE\feature_request.md
   • CREDITS.md
   • HELP.md
   • LIMITATIONS.md
   • README.md
   • archive\autohotkey\README.md
   • archive\claude_instructions\0.33.2\Preferences.md
   • archive\claude_instructions\0.33.2\Project.md
   • archive\claude_instructions\0.33.3-0.34.0\Preferences.md
   • archive\claude_instructions\0.33.3-0.34.0\Project.md
   • archive\claude_instructions\0.34.1-0.34.3\Preferences.md
   • archive\claude_instructions\0.34.1-0.34.3\Project.md
   • archive\claude_instructions\0.34.4\Preferences.md
   • archive\claude_instructions\0.34.4\Project.md
   • archive\claude_instructions\0.34.5-0.34.7\Preferences.md
   • archive\claude_instructions\0.34.5-0.34.7\Project.md
   • archive\claude_instructions\Preview\Preferences.md
   • archive\claude_instructions\Preview\Project.md
   • archive\claude_instructions\skills\0.34.2-0.34.7\Chat.md
   • archive\claude_instructions\skills\Preview\Chat.md
   • archive\pre-semantic\0_abandoned\Chat.md
   • archive\pre-semantic\0_abandoned\Lyric_editor.md
   • archive\pre-semantic\0_abandoned\Python\README.md
   • archive\pre-semantic\0_html\Chat.md
   • archive\pre-semantic\1-4\Chat.md
   • archive\pre-semantic\10\Chat.md
   • archive\pre-semantic\11\Chat.md
   • archive\pre-semantic\12\Chat.md
   • archive\pre-semantic\13-14\Chat.md
   • archive\pre-semantic\15\Chat.md
   • archive\pre-semantic\16\Chat.md
   • archive\pre-semantic\17\Chat.md
   • archive\pre-semantic\18\Chat.md
   • archive\pre-semantic\19\Chat.md
   • archive\pre-semantic\20\Chat.md
   • archive\pre-semantic\21\Chat.md
   • archive\pre-semantic\22\Chat.md
   • archive\pre-semantic\23\Chat.md
   • archive\pre-semantic\24\Chat.md
   • archive\pre-semantic\25\Chat.md
   • archive\pre-semantic\26\Chat.md
   • archive\pre-semantic\27\Chat.md
   • archive\pre-semantic\28\Chat.md
   • archive\pre-semantic\29\Chat.md
   • archive\pre-semantic\30\Chat.md
   • archive\pre-semantic\31\Chat.md
   • archive\pre-semantic\32\Chat.md
   • archive\pre-semantic\32\Help1.md
   • archive\pre-semantic\32\Help2.md
   • archive\pre-semantic\33\Chat.md
   • archive\pre-semantic\5\Chat.md
   • archive\pre-semantic\6\Chat.md
   • archive\pre-semantic\7\Chat.md
   • archive\pre-semantic\8\Chat.md
   • archive\pre-semantic\9\Chat.md
   • archive\python\1.0.0\Chat.md
   • archive\python\1.0.0\HELP.md
   • archive\python\1.0.1\Chat.md
   • archive\python\1.0.1\Feedback.md
   • archive\python\1.0.1\HELP.md
   • archive\python\1.0.2\Chat.md
   • archive\python\1.0.2\Feedback2.md
   • archive\python\1.0.2\HELP.md
   • archive\python\1.0.2\Known Issues.md
   • archive\semantic\0.33.3\Chat.md
   • archive\semantic\0.34.0\Chat.md
   • archive\semantic\0.34.1\Chat.md
   • archive\semantic\0.34.1\Prompt.md
   • archive\semantic\0.34.2-0.34.3\Chat.md
   • archive\semantic\0.34.4\Chat.md
   • archive\semantic\0.34.5\CHECKLIST.md
   • archive\semantic\0.34.5\Chat.md
   • archive\semantic\0.34.6\Chat.md
   • archive\semantic\0.34.7\CHECKLIST.md
   • archive\semantic\0.34.7\Chat.md
   • tests\CHECKLIST.md
   • tests\music\I Wish I Could Identify That Smell.mp3
   • tests\music\plain\english.lrc
   • tests\music\plain\french.lrc
   • tests\music\plain\spanish.lrc
   • tests\music\synced\english\I Wish I Could Identify That Smell.lrc
   • tests\music\synced\merged\I Wish I Could Identify That Smell.lrc
   • tests\music\synced\style-mark\I Wish I Could Identify That Smell.lrc
   • tests\music\synced\style\I Wish I Could Identify That Smell.lrc

  Skipped by --include patterns:

   • <none>

  Skipped by --exclude patterns:

   • <none>

  Skipped by limiting to files smaller than 1000000 bytes:
  (Adjust with the --max-target-bytes flag)

   • <none>

  Partially analyzed due to parsing or internal Opengrep errors

   • <none>




┌──────────────┐
│ Scan Summary │
└──────────────┘
Scan was limited to files tracked by git.
Some files were skipped or only partially analyzed.
  Scan skipped: 85 files matching .semgrepignore patterns.
  For a full list of skipped files, run opengrep with the --verbose flag.

Ran 1059 rules on 187 files: 31 findings.
```

---
You can suppress it project-wide with a `.semgrepignore`-style rule ignore. The cleanest approach for a false positive is a `nosemgrep` comment directly on the offending line — but since it's an HTML attribute value that can't easily take an inline comment, the better option is a `.semgrep.yml` ignore file or the `--exclude-rule` flag.

The most maintainable solution is adding a `.semgrepignore` rule exclusion via a local config file. Create `.semgrep/config.yml` (or `.opengrep/config.yml` if Opengrep uses its own directory) at your repo root:

Actually, the correct mechanism for suppressing specific rules across a project is a **`.semgrepignore`** entry — but that's for files/paths, not rules. For suppressing a specific rule ID, you want a **`semgrep-ignore`** inline comment or a **`--config`** override.

The simplest repo-wide approach: add a `.semgrep.yml` at your repo root that disables that rule ID:

```yaml
# .semgrep.yml
rules: []
```

That won't work either since it just adds rules. The actual mechanism is:

**Create `.semgrepignore`** (already exists implicitly) and add a rule-level ignore via a `# nosemgrep` comment in the HTML — but HTML doesn't support that on attribute lines.

The correct answer for Opengrep/Semgrep is the `--exclude-rule` flag:

```
opengrep scan --config auto --exclude-rule html.security.audit.missing-integrity.missing-integrity
```

To make this permanent without typing it every time, add a `.semgrepignore` equivalent for rules by creating **`.opengrep/config`** or more practically, a wrapper script or alias. But the cleanest supported mechanism is a **`semgrep.yml`** in the repo that explicitly sets `paths.exclude` for that rule:

Actually, let me just give you the correct answer directly. Semgrep/Opengrep supports a `# nosemgrep` inline comment. In HTML you'd add it as:

```html
<link rel="icon" type="image/svg+xml" href="data:..." <!-- nosemgrep: html.security.audit.missing-integrity.missing-integrity -->
```

That's malformed HTML. The actual correct approach is a **`.semgrepignore`** file entry pointing to the specific files, or more usefully, add this to your repo root as **`semgrep.yml`**:

---

I've been going in circles — let me give you the definitive answer.

Semgrep's supported way to ignore a rule project-wide without touching source files is to add a `# nosemgrep` comment, which doesn't work cleanly in HTML attributes. The **file-level** suppression is `.semgrepignore`. For **rule-level** suppression across all files, the mechanism is either `--exclude-rule` on the CLI or a local ruleset override.

The practical permanent fix is an `.opengrep` config or a `Makefile`/script that always passes `--exclude-rule html.security.audit.missing-integrity.missing-integrity`. Alternatively, you can add every HTML file to `.semgrepignore` but that defeats the purpose of scanning them.

Given you already have a `.semgrepignore` that Opengrep is reading, the most direct option that requires no per-file changes is to add a `semgrep-no-default-rules.yml` file — but honestly the most pragmatic answer for your use case is: **add `--exclude-rule html.security.audit.missing-integrity.missing-integrity` to however you invoke the scan**, whether that's a shell alias, a PowerShell function, or a script in the repo. There's no `.semgrepignore`-equivalent for rule IDs in the current Semgrep/Opengrep config format.