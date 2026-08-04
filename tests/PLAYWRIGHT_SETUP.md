### Fedora 44
##### Headless
1. Pull the official Microsoft Playwright Podman image
```sh
podman pull mcr.microsoft.com/playwright:v1.61.0-noble
```

2. Run from project root
```sh
# Headless
podman run --rm -it --userns=keep-id \
	-v $PWD:/workspace:z -w /workspace \
	-e HOME=/tmp \
	-e PW_CONTAINER=1 \
	mcr.microsoft.com/playwright:v1.61.0-noble \
	npx playwright test
```

3. Or run with a Fish function:
```sh
# Setup
function tst
    if not test -f playwright.config.js
        echo "tsta: not in a Playwright repo (no playwright.config.js in $PWD)"
        echo "tsta: cd into your repo first, e.g. cd ~/GitHub/linebyline"
        return 1
    end
    podman run --rm -it \
                --userns=keep-id \
                --security-opt label=disable \
                -v $PWD:/workspace -w /workspace \
                -v ~/.local/share/podman-npm-cache:/tmp/.npm \
                -e HOME=/tmp \
                -e NPM_CONFIG_CACHE=/tmp/.npm \
                -e NPM_CONFIG_UPDATE_NOTIFIER=false \
                -e PW_CONTAINER=1 \
                mcr.microsoft.com/playwright:v1.61.0-noble \
                npx playwright test $argv
end

funcsave tst
# Usage examples: tst, tst tests/fields-merge.spec.js --project firefox
```

##### UI mode
⚠️Webkit is disabled for host in `playwright.config.js` because it's unstable on Linux
1. Install the npm version of Playwright from project root
```sh
npm install
npx playwright install
npx playwright install-deps
```

2. Run from project root
```sh
# Open Playwright Test window
npx playwright test --ui

# Open Codegen
npx serve . -l 3004 #  ← Run this in another terminal tab or window
set -l path (node -e "const{findLatestVersion}=require('@linebyline/test-helpers');process.stdout.write(findLatestVersion())")
npx playwright codegen "http://localhost:3004$path" #default chromium
npx playwright codegen "http://localhost:3004$path" --browser firefox
```

3. Or run with Fish functions:
```sh
function tsta
  cd ~/GitHub/linebyline
  npx playwright test --ui $argv
end
function cgn
    cd ~/GitHub/linebyline
    set -l need_cleanup false
    # Ensure dev server is running on port 3004
    if not ss -tlnq 2>/dev/null | grep -q ':3004 '
        echo "cgn: starting dev server on :3004 …"
        npx serve . -l 3004 >/dev/null 2>&1 &
        set need_cleanup true
        # Wait up to 5s for it to be ready
        for i in (seq 1 20)
            if ss -tlnq 2>/dev/null | grep -q ':3004 '
                break
            end
            sleep 0.25
        end
    end
    npx playwright codegen "http://localhost:3004/docs/index.html" $argv
    # Kill the server we started; leave pre-existing ones alone
    if test "$need_cleanup" = true
        fuser -k 3004/tcp 2>/dev/null; or true
    end
end
funcsave tsta
funcsave cgn
# Usage: tsta, cgn, cgn --browser firefox
```
