// @ts-check
const { test, expect } = require("@linebyline/test-helpers");

// ── 1. LRC Parsing Utilities ──────────────────────────────────────────────

test.describe("LRC parsing", () => {
  // -- tsToMs --

  test("tsToMs parses standard timestamp", async ({ page }) => {
    const result = await page.evaluate(() => tsToMs("[01:23.45]"));
    expect(result).toBe(83450);
  });

  test("tsToMs returns 0 for zero timestamp", async ({ page }) => {
    const result = await page.evaluate(() => tsToMs("[00:00.00]"));
    expect(result).toBe(0);
  });

  test("tsToMs parses max 2-digit timestamp", async ({ page }) => {
    const result = await page.evaluate(() => tsToMs("[99:59.99]"));
    expect(result).toBe(5999990);
  });

  test("tsToMs returns null for non-matching line", async ({ page }) => {
    expect(await page.evaluate(() => tsToMs("hello world"))).toBeNull();
  });

  test("tsToMs returns null for single-digit fields", async ({ page }) => {
    expect(await page.evaluate(() => tsToMs("[0:0.0]"))).toBeNull();
  });

  test("tsToMs extracts timestamp from line with trailing content", async ({
    page,
  }) => {
    expect(await page.evaluate(() => tsToMs("[00:05.12] Some lyric"))).toBe(
      5120,
    );
  });

  // -- msToTs --

  test("msToTs converts zero", async ({ page }) => {
    expect(await page.evaluate(() => msToTs(0))).toBe("[00:00.00]");
  });

  test("msToTs converts standard value", async ({ page }) => {
    expect(await page.evaluate(() => msToTs(83450))).toBe("[01:23.45]");
  });

  test("msToTs clamps negative to zero", async ({ page }) => {
    expect(await page.evaluate(() => msToTs(-100))).toBe("[00:00.00]");
  });

  test("msToTs truncates centiseconds instead of rounding", async ({
    page,
  }) => {
    // 129 centiseconds → .12 (not .13)
    expect(await page.evaluate(() => msToTs(129))).toBe("[00:00.12]");
  });

  test("msToTs rounds trip with tsToMs", async ({ page }) => {
    const ms = 83450;
    const roundTrip = await page.evaluate((ms) => tsToMs(msToTs(ms)), ms);
    expect(roundTrip).toBe(ms);
  });

  // -- replaceTs --

  test("replaceTs replaces existing timestamp", async ({ page }) => {
    expect(
      await page.evaluate(() => replaceTs("[00:00.00] Hello", 5000)),
    ).toBe("[00:05.00] Hello");
  });

  test("replaceTs prepends timestamp to line without one", async ({ page }) => {
    expect(await page.evaluate(() => replaceTs("Hello", 5000))).toBe(
      "[00:05.00] Hello",
    );
  });

  test("replaceTs on end-timestamp line (no trailing text)", async ({
    page,
  }) => {
    expect(await page.evaluate(() => replaceTs("[00:00.00]", 5000))).toBe(
      "[00:05.00]",
    );
  });

  // -- isEndTs --

  test("isEndTs true for timestamp-only line", async ({ page }) => {
    expect(await page.evaluate(() => isEndTs("[00:00.00]"))).toBe(true);
  });

  test("isEndTs true for timestamp with trailing whitespace", async ({
    page,
  }) => {
    expect(await page.evaluate(() => isEndTs("[00:00.00]   "))).toBe(true);
  });

  test("isEndTs false for timestamp with content", async ({ page }) => {
    expect(await page.evaluate(() => isEndTs("[00:00.00] Hello"))).toBe(false);
  });

  test("isEndTs false for line without timestamp", async ({ page }) => {
    expect(await page.evaluate(() => isEndTs("Hello"))).toBe(false);
  });

  // -- normalizeLrcTimestamps --

  test("normalizeLrcTimestamps truncates 3-decimal to 2-decimal", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() => normalizeLrcTimestamps("[00:00.000]")),
    ).toBe("[00:00.00]");
  });

  test("normalizeLrcTimestamps leaves 2-decimal unchanged", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() => normalizeLrcTimestamps("[00:05.00]")),
    ).toBe("[00:05.00]");
  });

  test("normalizeLrcTimestamps handles mixed decimal lengths", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() =>
        normalizeLrcTimestamps(
          "[00:00.000]\n[00:05.00]\n[00:10.123]",
        ),
      ),
    ).toBe("[00:00.00]\n[00:05.00]\n[00:10.12]");
  });

  // -- stripSecLine --

  test("stripSecLine removes timestamp and leading space", async ({ page }) => {
    expect(
      await page.evaluate(() => stripSecLine("[00:00.00] Hello")),
    ).toBe("Hello");
  });

  test("stripSecLine returns line unchanged when no timestamp", async ({
    page,
  }) => {
    expect(await page.evaluate(() => stripSecLine("Hello"))).toBe("Hello");
  });

  test("stripSecLine strips only one leading space after timestamp", async ({
    page,
  }) => {
    // Double space after ts → one space remains
    expect(
      await page.evaluate(() => stripSecLine("[00:00.00]  Hello")),
    ).toBe(" Hello");
  });
});

// ── 2. Paren peeling & batch split ────────────────────────────────────────

test.describe("_peelLastParen", () => {
  test("peels simple parenthesized group", async ({ page }) => {
    expect(
      await page.evaluate(() => _peelLastParen("hello (world)")),
    ).toEqual(["hello", "(world)"]);
  });

  test("peels outermost nested group from end", async ({ page }) => {
    expect(
      await page.evaluate(() => _peelLastParen("a (b (c) d)")),
    ).toEqual(["a", "(b (c) d)"]);
  });

  test("returns null for string without parens", async ({ page }) => {
    expect(await page.evaluate(() => _peelLastParen("no parens"))).toBeNull();
  });

  test("returns empty before-group for paren-only content", async ({ page }) => {
    expect(await page.evaluate(() => _peelLastParen("(only)"))).toEqual([
      "",
      "(only)",
    ]);
  });

  test("peels last group when multiple exist", async ({ page }) => {
    expect(
      await page.evaluate(() => _peelLastParen("a (b) and (c)")),
    ).toEqual(["a (b) and", "(c)"]);
  });

  test("handles unbalanced close-paren before open", async ({ page }) => {
    expect(
      await page.evaluate(() => _peelLastParen("a ) b (c)")),
    ).toEqual(["a ) b", "(c)"]);
  });
});

test.describe("batchSplitParens", () => {
  test("splits simple parenthesized translation", async ({ page }) => {
    expect(
      await page.evaluate(() => batchSplitParens("Hello (translation)")),
    ).toBe("Hello\n(translation)");
  });

  test("leaves line without parens unchanged", async ({ page }) => {
    expect(
      await page.evaluate(() => batchSplitParens("Hello world")),
    ).toBe("Hello world");
  });

  test("preserves metadata lines unchanged", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        batchSplitParens("[ti: Title]\n[ar: Artist]"),
      ),
    ).toBe("[ti: Title]\n[ar: Artist]");
  });

  test("splits multiple paren groups in left-to-right order", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() => batchSplitParens("Hello (French)(Spanish)")),
    ).toBe("Hello\n(French)\n(Spanish)");
  });

  test("splits with timestamps and assigns interpolated ts", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() =>
        batchSplitParens(
          "[00:05.00] Hello (trans)\n[00:10.00] Next line",
        ),
      ),
    ).toBe("[00:05.00] Hello\n[00:09.99] (trans)\n[00:10.00] Next line");
  });

  test("keeps nested paren group intact", async ({ page }) => {
    expect(
      await page.evaluate(() => batchSplitParens("Line (outer (inner))")),
    ).toBe("Line\n(outer (inner))");
  });
});

// ── 3. Key normalization & hotkey restriction logic ───────────────────────

test.describe("key normalization", () => {
  test("_normKey uppercases single characters", async ({ page }) => {
    expect(await page.evaluate(() => _normKey("a"))).toBe("A");
  });

  test("_normKey converts space to canonical name", async ({ page }) => {
    expect(await page.evaluate(() => _normKey(" "))).toBe("Space");
  });

  test("_normKey converts Escape to short form", async ({ page }) => {
    expect(await page.evaluate(() => _normKey("Escape"))).toBe("Esc");
  });

  test("_normKey passes multi-char keys through unchanged", async ({ page }) => {
    expect(await page.evaluate(() => _normKey("ArrowUp"))).toBe("ArrowUp");
  });

  test("keyStr normalizes Ctrl+letter combo", async ({ page }) => {
    expect(
      await page.evaluate(() => {
        const e = new KeyboardEvent("keydown", { key: "s", ctrlKey: true });
        return keyStr(e);
      }),
    ).toBe("Ctrl+S");
  });

  test("keyStr normalizes Shift+ArrowUp", async ({ page }) => {
    expect(
      await page.evaluate(() => {
        const e = new KeyboardEvent("keydown", {
          key: "ArrowUp",
          shiftKey: true,
        });
        return keyStr(e);
      }),
    ).toBe("Shift+ArrowUp");
  });

  test("keyStr normalizes bare Space", async ({ page }) => {
    expect(
      await page.evaluate(() => {
        const e = new KeyboardEvent("keydown", { key: " " });
        return keyStr(e);
      }),
    ).toBe("Space");
  });

  test("keyStr returns lone modifier without non-modifier key", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() => {
        const e = new KeyboardEvent("keydown", {
          key: "Control",
          ctrlKey: true,
        });
        return keyStr(e);
      }),
    ).toBe("Ctrl");
  });
});

test.describe("hotkey restriction logic", () => {
  test("isRestrictedForAll blocks Ctrl+C", async ({ page }) => {
    expect(await page.evaluate(() => isRestrictedForAll("Ctrl+C"))).toContain(
      "reserved by the browser",
    );
  });

  test("isRestrictedForAll blocks Escape", async ({ page }) => {
    expect(await page.evaluate(() => isRestrictedForAll("Escape"))).toContain(
      "reserved by the browser",
    );
  });

  test("isRestrictedForAll blocks Tab", async ({ page }) => {
    expect(await page.evaluate(() => isRestrictedForAll("Tab"))).toContain(
      "reserved by the browser",
    );
  });

  test("isRestrictedForAll blocks Alt combos", async ({ page }) => {
    expect(
      await page.evaluate(() => isRestrictedForAll("Alt+F")),
    ).toContain("reserved by the browser");
  });

  test("isRestrictedForAll allows Ctrl+;", async ({ page }) => {
    expect(await page.evaluate(() => isRestrictedForAll("Ctrl+;"))).toBeNull();
  });

  test("isRestrictedForAll allows ArrowDown", async ({ page }) => {
    expect(
      await page.evaluate(() => isRestrictedForAll("ArrowDown")),
    ).toBeNull();
  });

  test("isRestrictedForKey blocks letter for toggle_mode", async ({ page }) => {
    expect(
      await page.evaluate(() => isRestrictedForKey("A", "toggle_mode")),
    ).toContain("Letters, numbers, and Space");
  });

  test("isRestrictedForKey blocks number for toggle_mode", async ({ page }) => {
    expect(
      await page.evaluate(() => isRestrictedForKey("5", "toggle_mode")),
    ).toContain("Letters, numbers, and Space");
  });

  test("isRestrictedForKey blocks Space for toggle_mode", async ({ page }) => {
    expect(
      await page.evaluate(() => isRestrictedForKey("Space", "toggle_mode")),
    ).toContain("Letters, numbers, and Space");
  });

  test("isRestrictedForKey blocks Shift+letter for offset_mode_toggle", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() =>
        isRestrictedForKey("Shift+A", "offset_mode_toggle"),
      ),
    ).toContain("Letters, numbers, and Space");
  });

  test("isRestrictedForKey allows Ctrl+combo for toggle_mode", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() => isRestrictedForKey("Ctrl+;", "toggle_mode")),
    ).toBeNull();
  });

  test("isRestrictedForKey allows letter for non-toggle action", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() => isRestrictedForKey("W", "sync")),
    ).toBeNull();
  });

  test("isRestrictedForKey allows non-alpha non-numeric for toggle_mode", async ({
    page,
  }) => {
    expect(
      await page.evaluate(() =>
        isRestrictedForKey("BracketLeft", "toggle_mode"),
      ),
    ).toBeNull();
  });
});

// ── 4. mergeLrcMeta & ensureReTagDefault ──────────────────────────────────

test.describe("mergeLrcMeta", () => {
  test("overrides defaults with LRC values", async ({ page }) => {
    const result = await page.evaluate(() =>
      mergeLrcMeta("[ti: RealTitle]\n[ar: RealArtist]"),
    );
    expect(result).toContain("[ti: RealTitle]");
    expect(result).toContain("[ar: RealArtist]");
    // Non-overridden fields keep defaults
    expect(result).toContain("[al: Unknown]");
  });

  test("preserves defaults when LRC value is empty", async ({ page }) => {
    const result = await page.evaluate(() =>
      mergeLrcMeta("[ti: ]\n[ar: RealArtist]"),
    );
    // Empty ti value should NOT override the default
    expect(result).toContain("[ti: Unknown]");
    expect(result).toContain("[ar: RealArtist]");
  });

  test("appends extra metadata fields not in defaults", async ({ page }) => {
    const result = await page.evaluate(() =>
      mergeLrcMeta("[ti: Title]\n[by: Lyricist]"),
    );
    expect(result).toContain("[by: Lyricist]");
  });
});

test.describe("ensureReTagDefault", () => {
  test("appends default re URL when missing from existing tag", async ({
    page,
  }) => {
    const result = await page.evaluate(() =>
      ensureReTagDefault("[re: SomeTool]"),
    );
    // Default [re:] includes the linebyline URL
    expect(result).toContain("linebyline");
    expect(result).toContain("SomeTool");
  });

  test("leaves re tag unchanged when default already present", async ({
    page,
  }) => {
    const result = await page.evaluate(() =>
      ensureReTagDefault("[re: https://amokprime.github.io/linebyline/]"),
    );
    expect(result).toBe(
      "[re: https://amokprime.github.io/linebyline/]",
    );
  });

  test("leaves text unchanged when no re tag present", async ({ page }) => {
    const input = "[ti: Title]\n[ar: Artist]";
    const result = await page.evaluate(
      (txt) => ensureReTagDefault(txt),
      input,
    );
    expect(result).toBe(input);
  });
});

// ── 5. cleanPaste & cleanGenius ───────────────────────────────────────────

test.describe("cleanPaste", () => {
  test("strips section headers in paste context", async ({ page }) => {
    expect(
      await page.evaluate(() => cleanPaste("[Verse]\nHello world", "paste")),
    ).toBe("Hello world");
  });

  test("preserves section headers in import context", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        cleanPaste("[Verse]\nHello world", "import"),
      ),
    ).toBe("[Verse]\nHello world");
  });

  test("normalizes 3-decimal timestamps on paste", async ({ page }) => {
    expect(
      await page.evaluate(() => cleanPaste("[00:00.000] Hello", "paste")),
    ).toBe("[00:00.00] Hello");
  });

  test("preserves metadata tags on paste", async ({ page }) => {
    const result = await page.evaluate(() =>
      cleanPaste("[ti: Title]\nHello", "paste"),
    );
    expect(result).toContain("[ti: Title]");
  });
});

test.describe("cleanGenius", () => {
  test("returns null for non-Genius content", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        cleanGenius("Just some regular lyrics\nNothing special here"),
      ),
    ).toBeNull();
  });

  test("extracts and cleans Genius-formatted content", async ({ page }) => {
    const result = await page.evaluate(() =>
      cleanGenius(
        "Song Title Lyrics\nRead More\nFirst lyric line\nSecond lyric line\nAbout",
      ),
    );
    expect(result).toContain("First lyric line");
    expect(result).toContain("Second lyric line");
    expect(result).not.toContain("Read More");
    expect(result).not.toContain("About");
  });

  test("filters You Might Also Like section", async ({ page }) => {
    const result = await page.evaluate(() =>
      cleanGenius(
        "Song Lyrics\nRead More\nLyric line\nYou might also like\nRelated Song\n[Chorus]\nFinal line\nAbout",
      ),
    );
    expect(result).toContain("Lyric line");
    expect(result).toContain("Final line");
    expect(result).not.toContain("You might also like");
    expect(result).not.toContain("Related Song");
  });

  test("strips Genius section headers from lyrics", async ({ page }) => {
    const result = await page.evaluate(() =>
      cleanGenius(
        "Song Lyrics\nRead More\n[Verse]\nLyric here\nAbout",
      ),
    );
    // [Verse] matches the section-header filter /^\[.{2,50}\]$/
    expect(result).not.toContain("[Verse]");
    expect(result).toContain("Lyric here");
  });
});

// ── 6. collapseBlanks ─────────────────────────────────────────────────────

test.describe("collapseBlanks", () => {
  test("collapses consecutive blank lines to one", async ({ page }) => {
    expect(
      await page.evaluate(() => collapseBlanks(["a", "", "", "b"])),
    ).toEqual(["a", "", "b"]);
  });

  test("leaves single blank line unchanged", async ({ page }) => {
    expect(
      await page.evaluate(() => collapseBlanks(["a", "", "b"])),
    ).toEqual(["a", "", "b"]);
  });

  test("leaves no-blank input unchanged", async ({ page }) => {
    expect(
      await page.evaluate(() => collapseBlanks(["a", "b", "c"])),
    ).toEqual(["a", "b", "c"]);
  });

  test("collapses leading consecutive blanks", async ({ page }) => {
    expect(
      await page.evaluate(() => collapseBlanks(["", "", "a"])),
    ).toEqual(["", "a"]);
  });

  test("collapses trailing consecutive blanks", async ({ page }) => {
    expect(
      await page.evaluate(() => collapseBlanks(["a", "", ""])),
    ).toEqual(["a", ""]);
  });

  test("collapses multiple separate runs of blanks", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        collapseBlanks(["a", "", "", "b", "", "", "c"]),
      ),
    ).toEqual(["a", "", "b", "", "c"]);
  });
});

// ── 7. Timestamp interpolation helpers ────────────────────────────────────

test.describe("_findNextTimestampMs", () => {
  test("finds next timestamped line after index", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        _findNextTimestampMs(
          ["[00:00.00] First", "No ts", "[00:10.00] Third"],
          0,
        ),
      ),
    ).toBe(10000);
  });

  test("returns null when no timestamped line follows", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        _findNextTimestampMs(["[00:00.00] First", "No ts"], 0),
      ),
    ).toBeNull();
  });

  test("skips non-timestamped lines to find next", async ({ page }) => {
    expect(
      await page.evaluate(() =>
        _findNextTimestampMs(
          ["[00:00.00] First", "plain", "also plain", "[00:20.00] Last"],
          0,
        ),
      ),
    ).toBe(20000);
  });
});

test.describe("_assignInterpolatedTs", () => {
  test("assigns interpolated ts between two timestamped lines", async ({
    page,
  }) => {
    const result = await page.evaluate(() => {
      const arr = ["[00:00.00] First", "middle line", "[00:10.00] Last"];
      _assignInterpolatedTs(arr);
      return { text: arr[1], ms: tsToMs(arr[1]) };
    });
    expect(result.text).toMatch(/^\[\d{2}:\d{2}\.\d{2}\] middle line$/);
    // 10ms before the next timestamp
    expect(result.ms).toBe(9990);
  });

  test("does not modify already-timestamped lines", async ({ page }) => {
    const result = await page.evaluate(() => {
      const arr = [
        "[00:00.00] First",
        "[00:05.00] Middle",
        "[00:10.00] Last",
      ];
      _assignInterpolatedTs(arr);
      return arr;
    });
    expect(result[1]).toBe("[00:05.00] Middle");
  });

  test("skips meta lines and blank lines", async ({ page }) => {
    const result = await page.evaluate(() => {
      const arr = [
        "[00:00.00] First",
        "[ti: Title]",
        "",
        "plain line",
        "[00:10.00] Last",
      ];
      _assignInterpolatedTs(arr);
      return arr;
    });
    // Meta and blank lines remain unchanged
    expect(result[1]).toBe("[ti: Title]");
    expect(result[2]).toBe("");
    // The plain line after blank/meta gets interpolated ts
    expect(result[3]).toMatch(/^\[\d{2}:\d{2}\.\d{2}\] plain line$/);
  });

  test("interpolates multiple un-timestamped lines with 10ms spacing", async ({
    page,
  }) => {
    const result = await page.evaluate(() => {
      const arr = [
        "[00:00.00] First",
        "line A",
        "line B",
        "[00:10.00] Last",
      ];
      _assignInterpolatedTs(arr);
      return { a: tsToMs(arr[1]), b: tsToMs(arr[2]) };
    });
    // line A: nextMs - (count - k) * 10 = 10000 - (2 - 0) * 10 = 9980
    // line B: nextMs - (count - k) * 10 = 10000 - (2 - 1) * 10 = 9990
    expect(result.a).toBe(9980);
    expect(result.b).toBe(9990);
  });
});
