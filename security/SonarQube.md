python.png

Do these need to be patched considering Python port is abandoned? Could I just delete the python_abandoned folder and commit to main?

---

Yes, just delete the folder and commit. Since it's abandoned code that's not part of any build or deployment, there's no reason to fix vulnerabilities in it — removing it is strictly better than patching it.

The issues will disappear from SonarQube automatically on the next scan after the files are gone.

---

#### Denial of Service
```
#archive/pre-semantic/0_html/linebyline.html line 456
const ti=(text.match(/^\[ti:\s*(.+)\]/m)||[])[1],ar=(text.match(/^\[ar:\s*(.+)\]/m)||[])[1],al=(text.match(/^\[al:\s*(.+)\]/m)||[])[1];

#archive/pre-semantic/0_html/linebyline.html #line 486
  const text=getTA(),ti=text.match(/^\[ti:\s*(.+)\]/m),raw=ti?ti[1].trim():'';
  
#docs/index.html line 801
const defReMatch=cfg.default_meta.match(/^\[re:\s*(.*)\]/m);
```
"Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service." - referring to all `text.match()`, affects pretty much every version of LineByLine has this

#### Review priority: Low
```
#docs/index.html line 2430
  if(hk.issues&&hkMatch(ks,hk.issues)){e.preventDefault();window.open('https://github.com/amokprime/linebyline/issues','_blank');return;}
```
"Make sure not using "noopener" is safe here." - referring to window.**open**, affects newer versions around 0.34.XX up to present

---

More findings, about 548 DOS and 61 Others (Low priority). Shouldn't DOS be impossible given that LineByLine runs fully offline once loaded from the GitHub Page?

---

Yes, exactly right. DOS via regex backtracking is a server-side concern — an attacker submits crafted input to exhaust server resources. Since LineByLine runs entirely in the user's own browser with no server processing the input, the only "victim" of a slow regex would be the user themselves on their own machine, which isn't a meaningful attack surface.

You can safely mark all of those as **Won't Fix** or **False Positive** in SonarQube. "False Positive" is technically the more accurate choice since the vulnerability class doesn't apply to the execution model.

For the `noopener` one — that's also low stakes. The concern is that the opened page could access `window.opener` to manipulate the originating page. Since it's opening a GitHub issues page (a trusted, fixed URL you control, not user-supplied), there's no real risk. Same treatment: Won't Fix or False Positive is fine.

---

#### Old
```
      <div>
        <div class="s-sec-label">Intervals</div>
        <div class="s-row"><label>Tiny</label><input class="s-num" id="s-tiny" type="number" value="100"><span class="s-unit">ms</span></div>
        <div class="s-row"><label>Small</label><input class="s-num" id="s-small" type="number" value="200"><span class="s-unit">ms</span></div>
        <div class="s-row"><label>Medium</label><input class="s-num" id="s-medium" type="number" value="400"><span class="s-unit">ms</span></div>
        <div class="s-row"><label>Large</label><input class="s-num" id="s-large" type="number" value="1000"><span class="s-unit">ms</span></div>
        <div class="s-row"><label>Seek increment</label><input class="s-num" id="s-seek-inc" type="number" value="5" min="1" max="600"><span class="s-unit">s</span></div>
        <div class="s-row"><label>Speed ratio</label><input class="s-num" id="s-speed-ratio" type="number" value="1.10" step="0.01" min="1.01" max="2"><span class="s-unit">×</span></div>
        <div class="s-row"><label>Volume increment</label><input class="s-num" id="s-vol-inc" type="number" value="10" min="1" max="100"><span class="s-unit">%</span></div>
        <div class="s-row"><label>Undo window</label><input class="s-num" id="s-undo-debounce" type="number" value="150" min="1" max="5000"><span class="s-unit">ms</span></div>
      </div>
```

#### Latest
```
      <div>
        <div class="s-sec-label">Intervals</div>
        <div class="s-row"><label for="s-tiny">Tiny</label><input class="s-num" id="s-tiny" type="number" value="100"><span class="s-unit">ms</span></div>
        <div class="s-row"><label for="s-small">Small</label><input class="s-num" id="s-small" type="number" value="200"><span class="s-unit">ms</span></div>
        <div class="s-row"><label for="s-medium">Medium</label><input class="s-num" id="s-medium" type="number" value="400"><span class="s-unit">ms</span></div>
        <div class="s-row"><label for="s-large">Large</label><input class="s-num" id="s-large" type="number" value="1000"><span class="s-unit">ms</span></div>
        <div class="s-row"><label for="s-seek-inc">Seek increment</label><input class="s-num" id="s-seek-inc" type="number" value="5" min="1" max="600"><span class="s-unit">s</span></div>
        <div class="s-row"><label for="s-speed-ratio">Speed ratio</label><input class="s-num" id="s-speed-ratio" type="number" value="1.10" step="0.01" min="1.01" max="2"><span class="s-unit">×</span></div>
        <div class="s-row"><label for="s-vol-inc">Volume increment</label><input class="s-num" id="s-vol-inc" type="number" value="10" min="1" max="100"><span class="s-unit">%</span></div>
        <div class="s-row"><label for="s-undo-debounce">Undo window</label><input class="s-num" id="s-undo-debounce" type="number" value="150" min="1" max="5000"><span class="s-unit">ms</span></div>
      </div>
```

For Reliability the older label tags in about 31 versions single handedly dropped score from A to C for each version

---

That's a disproportionate penalty for missing `for=` attributes — it's a legitimate accessibility issue but hardly a reliability concern. The fix you've already applied in the latest version is correct and complete.

For the old archived versions, you have two practical options:

1. **Exclude the archive from analysis** — add `-Dsonar.exclusions=archive/**` to your workflow args. Cleanest solution since that code is never shipped.
2. **Mark all as Won't Fix** — more tedious at 31 versions × N instances.

Option 1 is the obvious call. Archive code shouldn't be dragging down your project grade at all.

---

```
archive/pre-semantic/29/Themes/linebyline_github_mockups.html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">

archive/pre-semantic/29/Themes/linebyline_themes_mockup.html
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&family=Ubuntu+Mono:wght@400;700&family=Cantarell:wght@400;700&family=Noto+Sans:wght@400;500;700&family=Noto+Sans+Mono:wght@400&display=swap" rel="stylesheet">

archive/pre-semantic/29/linebyline_29.html
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&family=Ubuntu+Mono&family=Cantarell:wght@400;700&family=Noto+Sans:wght@400;500&family=Noto+Sans+Mono&display=swap" rel="stylesheet">
```

SonarQube-"Make sure not using resource integrity feature is safe here."

---

Also archive noise — the integrity check (SRI) concern is about ensuring a CDN-delivered script hasn't been tampered with in transit. Since those are archived mockup/dev files that never ship, there's no attack surface.

The exclusion you're already adding (`-Dsonar.exclusions=archive/**`) will silence these too. One fix covers all the archive findings.