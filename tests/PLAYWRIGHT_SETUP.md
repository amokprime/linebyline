### Windows Terminal/Git Bash Profile
1. Install fnm
``` cmd
winget install Schniz.fnm
```
2. Add shell integration to Git Bash
``` bash
echo 'eval "$(fnm env --use-on-cd --shell bash)"' >> ~/.bashrc
source ~/.bashrc
fnm --version
```
3. Install Node.js and npm
``` bash
fnm install --lts
#close and reopen terminal window
node --version
npm --version
```
4. Install Playwright
``` bash
npm init playwright@latest
```
5. Relevant .bashrc lines (alias names don't matter and port can be whatever as long as it's consistent)
``` bash
eval "$(fnm env --use-on-cd --shell bash)"
alias rld="source ~/.bashrc"
alias bsr="nano ~/.bashrc"
alias srv="npx serve . -l 3004"
alias tsta="npx playwright test --ui --project=firefox"
alias tst="npx playwright test --project=firefox"
cgn() {
  local path=$(node -e "const{findLatestVersion}=require('@linebyline/test-helpers');process.stdout.write(findLatestVersion())")
  npx playwright codegen "http://localhost:3004${path}" --browser firefox
}
```