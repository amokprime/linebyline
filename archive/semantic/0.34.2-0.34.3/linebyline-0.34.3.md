Add `Ctrl+Space` as "Play/pause (alternate)" hotkey in Settings right below "Play/pause" Note the three media buttons that were dropped after legacy version /archive/pre-semantic/1-4/linebyline_3.html and attached as screenshot oldv6.png. If none of their icons are copyrighted, reuse the icons and conform icon and button colors to the current GitHub themes in latest semantic linebyline.html (attached as screenshot newv0.34.2.png) and give them tooltips like:

- "Seek back 5s (Ctrl+A)"
- "Play/pause (Ctrl+Space)"
- "Seek forward 5s (Ctrl+D)" If they are copyrighted, use attached fallback Lucide icons skip-back.svg, play.svg, and skip-forward.svg These should update if Settings/Seek increment is changed from default 5s or if the Seek back or Seek forward hotkeys are remapped from defaults Ctrl+A and Ctrl+D After all changes are successful, update version to 0.34.3
___
Good, 0.34.2 exists. 
Now let me check the old version's icons and copy the file.
Now let me check the old version for its SVG icons, and also look at the uploaded SVG fallbacks:The old file wasn't copied yet.
Let me copy it:These are pure geometric SVG shapes (polygons, rects) — no brand/copyright. They're hand-drawn primitives. 
Now let me read the relevant sections of 0.34.2:
Now let me read the HTML structure around the player buttons and the Settings section for the hotkey rows:Good. The current version has no media buttons (seek back/play/forward). They were dropped. 
Now let me read the Settings section to find where play_pause hotkey row is:
Now let me read the Global KD section to see how hotkeys are dispatched, and the Button wiring section:
Now I have a complete picture.
Let me also check the Button wiring section and how `updatePlayBtn` / `rebuildHkPanel` work to understand how to update button tooltips dynamically:The old version's media button icons are pure geometric SVGs (polygon/rect primitives) — no copyright concern. They're hand-drawn, completely unbranded.

Now I have everything I need. Let me now look at the uploaded SVG files too, then build all the changes:
___
Now I'll build all changes. 
Let me copy the working file and apply patches:
**Patch 1: Add `play_pause_alt` hotkey to Config (DEFAULT_CFG, HK_SECTIONS, HK_LABELS)**
**Patch 2: Add media buttons HTML (seek back / play/pause / seek forward) below vol-row**
**Patch 3: Add CSS for media buttons**
**Patch 4: Add `play_pause_alt` to CTRL_ACTIONS and HOTKEY_ONLY**
**Patch 5: Update `updatePlayBtn` to also update media button icons, and update `updateDynamicTooltips` for media buttons**
**Patch 6: Update `updateDynamicTooltips` to set media button tooltips**
**Patch 7: Add `play_pause_alt` dispatch to Global KD, alongside seek_back/seek_fwd which are already there (those are outside hotkeyMode check so they work always)**
**Patch 8: Wire media buttons in Button wiring section**
**Patch 9: Update title and version**
Now update SECTIONS line — check what shifted:
Now validate and check:
All good. Copy to output and save to project:
___
Here's what changed in 0.34.3:

**New hotkey:** `Ctrl+Space` added as "Play/pause (alternate)" in Settings > Hotkeys > Playback, right below "Play/pause". It's remappable and works outside hotkey mode (same as `Ctrl+A`/`Ctrl+D`).

**Media buttons restored:** Three buttons — seek back, play/pause, seek forward — added below the volume row in the Now Playing panel. Icons are the original geometric SVG shapes from `linebyline_3.html` (pure polygon/rect primitives, no copyright concern), styled to match the current GitHub Light/Dark themes via `--border`, `--text`, `--btn-bg`/`--btn-hover` CSS vars. The play/pause button toggles its icon to match actual playback state.

**Dynamic tooltips:** All three button tooltips update when Seek increment changes in Settings or when Seek back/Seek forward hotkeys are remapped.
___
Made some GUI changes manually:

First set of changes:
```
/*Before*/
#speed-row{display:flex;align-items:center;gap:5px;margin-bottom:2px;}
#speed-val{width:42px;height:24.2px;font-size:12px;font-family:var(--font-mono);text-align:right;padding:0 4px;border:1px solid var(--border-mid);border-radius:var(--radius);background:transparent;color:var(--text);-moz-appearance:textfield;}
#speed-val::-webkit-inner-spin-button,#speed-val::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
#vol-row{display:flex;align-items:center;gap:6px;margin-top:2px;}
#media-btn-row{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;}

/*After*/
#media-row{display:flex;align-items:center;gap:5px;margin-bottom:2px;}
#speed-val{width:42px;height:24.2px;font-size:12px;font-family:var(--font-mono);text-align:right;padding:0 4px;border:1px solid var(--border-mid);border-radius:var(--radius);background:transparent;color:var(--text);-moz-appearance:textfield;}
#speed-val::-webkit-inner-spin-button,#speed-val::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
#vol-row{display:flex;align-items:center;gap:6px;margin-top:2px;}
```


Second set of changes:
```
/*Before*/
      <div id="seek-row">
        <input id="seek-offset" type="number" value="0" title="Seek offset (ms): shifts playback position when clicking a timestamped line">
        <span>ms</span>
        <button class="seek-arr" id="seek-arr-back" title="Decrease seek offset">&#9664;</button>
        <button class="seek-arr" id="seek-arr-fwd"  title="Increase seek offset">&#9654;</button>
        <button id="sync-file-btn" title="Sync file">Sync file</button>
        <span id="sync-file-hk"></span>
      </div>
      <div id="speed-row">
        <input id="speed-val" type="number" value="1" min="0.05" max="4" step="0.01" title="Playback speed">
        <span style="font-size:12px;color:var(--text-muted)">x</span>
        <button class="seek-arr" id="speed-down-btn" title="Reduce speed">−</button>
        <button class="seek-arr" id="speed-up-btn" title="Increase speed">+</button>
        <button class="seek-arr" id="speed-reset-btn" title="Reset speed">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4l2-2-2-2v4z"/></svg>
        </button>
      </div>
      <div id="vol-row">
        <button id="vol-mute-btn" title="Mute (Ctrl+M)">
          <svg id="vol-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM12.07 5.07a5 5 0 010 5.86M13.5 3.5a7.5 7.5 0 010 9"/></svg>
          <svg id="mute-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display:none"><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM11.5 6l3 4m0-4l-3 4"/></svg>
        </button>
        <input id="vol-slider" type="range" min="0" max="1" step="0.01" value="1">
        <span id="vol-pct">100%</span>
      </div>
      <div id="media-btn-row">
        <button class="media-btn" id="btn-seek-back" title="Seek back 5s (Ctrl+A)">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor"><polygon points="9,0 1,7 9,14"/><rect x="10" y="0" width="4" height="14" rx="1.5"/></svg>
        </button>
        <button class="media-btn" id="btn-play-pause" title="Play/pause (Ctrl+Space)">
          <svg id="media-play-icon" width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><polygon points="1,0 11,6.5 1,13"/></svg>
          <svg id="media-pause-icon" width="11" height="13" viewBox="0 0 11 13" fill="currentColor" style="display:none"><rect x="0" y="0" width="4" height="13" rx="1.5"/><rect x="7" y="0" width="4" height="13" rx="1.5"/></svg>
        </button>
        <button class="media-btn" id="btn-seek-fwd" title="Seek forward 5s (Ctrl+D)">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor"><rect x="4" y="0" width="4" height="14" rx="1.5"/><polygon points="9,0 17,7 9,14"/></svg>
        </button>

/*After*/
     <div id="media-row">
        <input id="speed-val" type="number" value="1" min="0.05" max="4" step="0.01" title="Playback speed">
        <span style="font-size:12px;color:var(--text-muted)">x</span>
        <button class="seek-arr" id="speed-down-btn" title="Reduce speed">−</button>
        <button class="seek-arr" id="speed-up-btn" title="Increase speed">+</button>
        <button class="seek-arr" id="speed-reset-btn" title="Reset speed">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4l2-2-2-2v4z"/></svg>
        </button>
        <button class="media-btn" id="btn-seek-back" title="Seek back 5s (Ctrl+A)">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor"><polygon points="9,0 1,7 9,14"/><rect x="10" y="0" width="4" height="14" rx="1.5"/></svg>
        </button>
        <button class="media-btn" id="btn-play-pause" title="Play/pause (Ctrl+Space)">
          <svg id="media-play-icon" width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><polygon points="1,0 11,6.5 1,13"/></svg>
          <svg id="media-pause-icon" width="11" height="13" viewBox="0 0 11 13" fill="currentColor" style="display:none"><rect x="0" y="0" width="4" height="13" rx="1.5"/><rect x="7" y="0" width="4" height="13" rx="1.5"/></svg>
        </button>
        <button class="media-btn" id="btn-seek-fwd" title="Seek forward 5s (Ctrl+D)">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor"><rect x="4" y="0" width="4" height="14" rx="1.5"/><polygon points="9,0 17,7 9,14"/></svg>
        </button>
      </div>
      <div id="seek-row">
        <input id="seek-offset" type="number" value="0" title="Seek offset (ms): shifts playback position when clicking a timestamped line">
        <span>ms</span>
        <button class="seek-arr" id="seek-arr-back" title="Decrease seek offset">&#9664;</button>
        <button class="seek-arr" id="seek-arr-fwd"  title="Increase seek offset">&#9654;</button>
        <button id="sync-file-btn" title="Sync file">Sync file</button>
        <span id="sync-file-hk"></span>
      </div>
      <div id="vol-row">
        <button id="vol-mute-btn" title="Mute (Ctrl+M)">
          <svg id="vol-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM12.07 5.07a5 5 0 010 5.86M13.5 3.5a7.5 7.5 0 010 9"/></svg>
          <svg id="mute-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display:none"><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM11.5 6l3 4m0-4l-3 4"/></svg>
        </button>
        <input id="vol-slider" type="range" min="0" max="1" step="0.01" value="1">
        <span id="vol-pct">100%</span>
      </div>
```
Also changed Help window title and bolded "?" button icon