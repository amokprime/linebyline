<script setup lang="ts">
// Renderless provider — applies the theme to <html> on startup (monolith Init
// runs applyTheme() before first paint). State and cycleTheme live in
// useTheme(); components below the slot consume the composable directly.
import { useTheme } from '../composables/useTheme'

useTheme().applyTheme()
</script>

<template>
  <slot />
</template>
