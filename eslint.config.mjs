// eslint.config.js — ESLint 9 flat config
//
// Roadmap context (archive/modular/plan/0-Roadmap.md, item 2):
//   - This file will be reconfigured twice:
//     1. After item 3 (Vite + Vue refactor): add eslint-plugin-vue, point
//        files at src/** instead of docs/index.html
//     2. After item 4 (TypeScript conversion): swap @eslint/js →
//        typescript-eslint and add a `files: ["**/*.ts"]` block
//   - Until then, this is intentionally minimal: @eslint/js recommended
//     + eslint-plugin-sonarjs recommended, with cognitive complexity
//     as a warning (not error) so vibe-coding isn't blocked.

import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default [
  // ────────────────────────────────────────────────────────────
  // 1. Global ignores — mirrors the user's exclusion list
  // ────────────────────────────────────────────────────────────
  {
    ignores: [
      "**/*.d.ts", // TypeScript ambient declarations — handled by tsserver
      // ── NEW: Obsidian vault metadata (third-party plugin bundles,
      //    workspace state, etc.). You add the repo as a vault per your
      //    workflow; ESLint should never touch this tree.
      ".obsidian/**",

      // ── NEW: local/ scratch/build tree. The Roadmap references this
      //    as where you park pre-push snapshots and WIP. Not source.
      "local/**",
      // Media + Playwright artifacts
      "**/*.mp3",
      "**/*.lrc",
      "**/*.png",
      "**/*.svg",
      "**/*.txt",
      "tests/*snapshots/**",
      "tests/media/**",
      "trash/**", // Playwright outputDir from playwright.config.js

      // Env + lock + project metadata (not source code)
      "**/.env*",
      "**/uv.lock",
      "**/pyproject.toml",
      "**/package-lock.json",
      "**/package.json", // JSON — not ESLint's job; Zed handles it

      // Docs + legal
      "**/*.md",
      "**/LICENSE",

      // Historical archives — never lint
      "archive/**",

      // The monolith — Roadmap item 3 replaces this with src/** via Vite.
      // Linting a 2700-line HTML file is noise; the modular refactor will
      // extract its JS into lintable modules.
      "docs/index.html",

      // AI workflow metadata (skills, plans) — documentation, not code
      "ai/**",
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 2. Default JS rules — CommonJS (matches "type": "commonjs"
  //    in package.json). Tests and helpers all use require().
  // ────────────────────────────────────────────────────────────
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.browser, // Playwright tests run in Node but assert against DOM
      },
    },
    plugins: { sonarjs },
    rules: {
      ...js.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,

      // Solo project, vibe-coded — cognitive complexity is a signal,
      // not a blocker. Many current findings will auto-resolve when
      // item 3 splits the monolith into modules.
      "sonarjs/cognitive-complexity": "warn",

      // Allow unused args prefixed with _ (common in test fixtures)
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // ────────────────────────────────────────────────────────────
  // 3. Override: playwright.config.js is the one ESM file
  //    (Playwright's own loader handles the import syntax despite
  //    "type": "commonjs" in package.json)
  // ────────────────────────────────────────────────────────────
  {
    files: ["playwright.config.js"],
    languageOptions: { sourceType: "module" },
  },

  // ────────────────────────────────────────────────────────────
  // 4. Override: Playwright spec files use ESM import syntax
  //    (tests/accessibility.spec.js does; others use require()
  //    via @linebyline/test-helpers, which works under either)
  // ────────────────────────────────────────────────────────────
  {
    files: ["tests/**/*.spec.js", "tests/helpers/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        // Functions defined in docs/index.html <script> — the spec
        // files call them via page.evaluate(() => fn(...)) which
        // runs in the browser, not Node. ESLint can't see them, so
        // we declare them here. Roadmap item 3 (Vite refactor) will
        // turn these into real imports — this block gets deleted then.
        tsToMs: "readonly",
        msToTs: "readonly",
        replaceTs: "readonly",
        isEndTs: "readonly",
        normalizeLrcTimestamps: "readonly",
        stripSecLine: "readonly",
        _peelLastParen: "readonly",
        batchSplitParens: "readonly",
        _normKey: "readonly",
        keyStr: "readonly",
        isRestrictedForAll: "readonly",
        isRestrictedForKey: "readonly",
        mergeLrcMeta: "readonly",
        ensureReTagDefault: "readonly",
        cleanPaste: "readonly",
        cleanGenius: "readonly",
        collapseBlanks: "readonly",
        _findNextTimestampMs: "readonly",
        _assignInterpolatedTs: "readonly",
        setSearchHkMode: "readonly",
      },
    },
    plugins: { sonarjs },
    rules: {
      // ReDoS findings are "Won't Fix" per Roadmap item 5 — client-side
      // processing on user-supplied lyrics, not a real attack surface.
      "sonarjs/super-linear-regex": "off",
      "sonarjs/empty-string-repetition": "off",
      "no-empty-pattern": "off", // ← NEW: Playwright fixture idiom
    },
  },
];
