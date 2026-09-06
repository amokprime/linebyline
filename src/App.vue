<script setup lang="ts">
// Phase B placeholder — swatches for the mapped shadcn + app tokens so the
// GitHub Light/Dark theme can be eyeballed in the browser (toggle class="dark"
// on <html> to compare). Phase C replaces this with the real LineByLine layout.
const swatches = [
  { label: 'bg', cls: 'bg-background' },
  { label: 'card', cls: 'bg-card' },
  { label: 'primary', cls: 'bg-primary' },
  { label: 'accent tint', cls: 'bg-accent' },
  { label: 'accent-border', cls: 'bg-accent-border' },
  { label: 'muted', cls: 'bg-muted' },
  { label: 'secondary', cls: 'bg-secondary' },
  { label: 'border', cls: 'bg-border' },
  { label: 'input', cls: 'bg-input' },
  { label: 'active', cls: 'bg-active-bg' },
  { label: 'warn', cls: 'bg-warn-bg' },
  { label: 'hk-key', cls: 'bg-hk-key-bg' },
]
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-foreground">
    <p class="text-lg">
      LineByLine Phase B —
      <span class="font-semibold text-primary">GitHub Light/Dark tokens</span>
    </p>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <div
        v-for="t in swatches"
        :key="t.label"
        class="flex flex-col items-center gap-1"
      >
        <div
          class="h-12 w-16 rounded-md border border-border"
          :class="t.cls"
        />
        <span class="text-xs text-muted-foreground">{{ t.label }}</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="rounded-md border border-accent-border bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground"
      >
        Accent tint
      </button>
      <button class="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm hover:bg-muted">
        Outline
      </button>
      <button class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
        Primary
      </button>
      <code class="rounded bg-hk-key-bg px-2 py-0.5 font-mono text-xs">Ctrl+Space</code>
    </div>
  </main>
</template>
