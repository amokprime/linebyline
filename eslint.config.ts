// eslint.config.ts — ESLint flat config
//
// Roadmap context (ROADMAP.md, items 2-4):
//   - Item 3 Phase A (2026-09-06) added the Vite + Vue blocks below
//     (sections 5-6): eslint-plugin-vue for src/**/*.vue, with
//     @typescript-eslint/parser for <script lang="ts"> and plain .ts.
//   - Item 4 (Nov 25, 2026) converted the Playwright layer to TypeScript:
//     specs + helpers are .ts, playwright.config is .ts, and the default
//     CommonJS .js block is gone (no .js files remain in the tree).

import tsParser from "@typescript-eslint/parser";
import pluginVue from "eslint-plugin-vue";
import sonarjs from "eslint-plugin-sonarjs";
import vueParser from "vue-eslint-parser";
import globals from "globals";
import type { Linter } from "eslint";

// eslint-plugin-sonarjs v4 types `configs` as a legacy/flat union that may be
// undefined; at runtime `recommended` is a flat config object carrying `rules`.
const sonarRules =
  (sonarjs.configs?.recommended as Linter.Config | undefined)?.rules ?? {};

export default [
  // ────────────────────────────────────────────────────────────
  // 1. Global ignores — mirrors the user's exclusion list
  // ────────────────────────────────────────────────────────────
  {
    ignores: [
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
      "trash/**", // Playwright outputDir from playwright.config.ts

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

      // Built Vite output (roadmap item 3) — never lint
      "dist/**",

      // AI workflow metadata (skills, plans) — documentation, not code
      "ai/**",
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 2. Playwright specs + helpers (roadmap item 4: .spec.ts since
  //    Nov 25, 2026). Owns the full recommended rule set — with the
  //    default CJS .js block gone, nothing else feeds these files.
  // ────────────────────────────────────────────────────────────
  {
    files: ["tests/**/*.spec.ts", "tests/helpers/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: { sonarjs },
    rules: {
      // No js.configs.recommended spread (matches the src/** and tests/unit
      // TS blocks): core no-undef/no-unused-vars false-positive on TS syntax;
      // vue-tsc owns those checks for TS (TS6133 etc, _-prefix exempt).
      ...sonarRules,
      "sonarjs/cognitive-complexity": "warn",

      // ReDoS findings are "Won't Fix" per Roadmap item 5 — client-side
      // processing on user-supplied lyrics, not a real attack surface.
      "sonarjs/super-linear-regex": "off",
      "sonarjs/empty-string-repetition": "off",
      // waitForTimeout is intentional for clipboard-paste settling + undo
      // debounce timing — see playwright-testing-SKILL.md "Common test patterns".
      "sonarjs/no-fixed-wait-in-tests": "off",
      // test.skip(webkit) in workaroundPaste is intentional — webkit clipboard
      // is unreliable per playwright-testing-SKILL.md.
      "sonarjs/no-skipped-tests": "off",
    },
  },

  // ────────────────────────────────────────────────────────────
  // 3. Vite + Vue app modules (roadmap item 3 Phase A). The flat
  //    recommended array carries the vue/* template+script rules for
  //    .vue files; the two blocks after it wire the parsers —
  //    vue-eslint-parser reads the template and delegates <script> to
  //    @typescript-eslint/parser. Plain .ts needs the TS parser itself.
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
      ...sonarRules,
      "sonarjs/cognitive-complexity": "warn",
      "sonarjs/empty-string-repetition": "off",
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
      ...sonarRules,
      "sonarjs/cognitive-complexity": "warn",
      // super-linear-regex is NOT overridden for src/** — the Tranche 4.8
      // blanket "Won't Fix" (verbatim monolith port) ended with Tranche 6:
      // every regex was re-triaged and fixed or NOSONAR'd individually.
      "sonarjs/empty-string-repetition": "off",
    },
  },

  {
    // Vendored shadcn-vue components (src/components/ui/**) — generated code,
    // single-word names and class/variant props are the library's conventions;
    // don't fight them. Regenerated by `shadcn-vue add`, so edits don't persist.
    files: ["src/components/ui/**"],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
    },
  },

  {
    // Ambient declaration files (.d.ts) — type-only, no runtime code, so
    // tsserver still owns the type checking. They were globally ignored
    // before, which made editor integrations (Zed's ESLint LSP lints open
    // buffers explicitly) emit "File ignored because of a matching ignore
    // pattern" on every open. Claiming them here keeps the file linted
    // silently instead.
    files: ["**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: { sonarjs },
    rules: {
      ...sonarRules,
      "sonarjs/cognitive-complexity": "warn",
    },
  },

  {
    // Root config files run in Node under ESM (vite.config.mts,
    // playwright.config.ts, eslint.config.ts — each loaded as ESM by its
    // tool); claiming eslint.config.ts keeps Zed's ESLint LSP from warning
    // "File ignored because no matching configuration was supplied".
    files: ["*.mts", "playwright.config.ts", "eslint.config.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },

  {
    // Phase C unit tests for the ported modules (vitest runner, node env)
    files: ["tests/unit/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    plugins: { sonarjs },
    rules: {
      ...sonarRules,
      "sonarjs/cognitive-complexity": "warn",
      // Audio currentTime + volume comparisons need exact float equality —
      // the values are deterministic in unit tests (no real audio element).
      "sonarjs/no-floating-point-equality": "off",
      // Parameterized tests are a style preference; the existing per-case
      // tests are clearer for the LineByLine test suite's audience.
      "sonarjs/parameterized-tests": "off",
      // Test files use defineComponent inline (not .vue files) — disable
      // the vue/one-component-per-file rule for test files.
      "vue/one-component-per-file": "off",
      // toBe vs toHaveLength is a style preference; leave as warning for
      // Tranche 4.7 triage, not a blocking error.
      "sonarjs/prefer-specific-assertions": "warn",
      // void-use: the remaining instances are intentional (void el.play()
      // suppresses floating-promise warnings). Tranche 4.7 will audit.
      "sonarjs/void-use": "warn",
    },
  },
];
