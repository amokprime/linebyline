// eslint.config.js — ESLint 9 flat config
//
// Roadmap context (archive/modular/plan/0-Roadmap.md, items 2-4):
//   - Item 3 Phase A (2026-09-06) added the Vite + Vue blocks below
//     (sections 5-6): eslint-plugin-vue for src/**/*.vue, with
//     @typescript-eslint/parser for <script lang="ts"> and plain .ts.
//     The docs/index.html monolith ignore stays until Phase E deletes it.
//   - Item 4 will deepen this: full typescript-eslint ruleset and the
//     test suite blocks move to .spec.ts (globals list below shrinks).

import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import sonarjs from "eslint-plugin-sonarjs";
import vueParser from "vue-eslint-parser";
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

      // Built Vite output (roadmap item 3) — never lint
      "dist/**",

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

  // ────────────────────────────────────────────────────────────
  // 5. Vite + Vue app modules (roadmap item 3 Phase A). The flat
  //    recommended array carries the vue/* template+script rules for
  //    .vue files; the two blocks after it wire the parsers —
  //    vue-eslint-parser reads the template and delegates <script> to
  //    @typescript-eslint/parser. Plain .ts needs the TS parser itself.
  //    Full typescript-eslint rules land in item 4.
  // ────────────────────────────────────────────────────────────
  ...pluginVue.configs["flat/recommended"],

  {
    files: ["src/**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: { ...globals.browser },
    },
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs.recommended.rules,
      "sonarjs/cognitive-complexity": "warn",
    },
  },

  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs.recommended.rules,
      "sonarjs/cognitive-complexity": "warn",
    },
  },

  {
    // Vite/TS config files run in Node under ESM (e.g. vite.config.mts)
    files: ["*.mts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
];
