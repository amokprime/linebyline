// Ported from docs/index.html "── Keyboard → Key normalization ──" plus
// _normKey from the Settings search section (roadmap item 3 Phase C, tranche 1).
// Verbatim; _normKey exported as normKey. Note the pinned quirk: normKey maps
// Escape to "Esc", so hkMatch's stored==='Escape' branch is unreachable via
// keyStr — kept as-is until the keyboard handler tranche revisits it.

export function normKey(k: string): string {
  if (k === 'Escape') return 'Esc';
  if (k === ' ') return 'Space';
  return k.length === 1 ? k.toUpperCase() : k;
}

export function keyStr(e: {
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  key: string
}): string {
  const p: string[] = [];
  if (e.ctrlKey) p.push('Ctrl');
  if (e.shiftKey) p.push('Shift');
  if (e.altKey) p.push('Alt');
  const k = e.key;
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(k)) p.push(normKey(k));
  return p.join('+');
}

export function hkMatch(ks: string, stored: string): boolean {
  return ks === stored || (stored === 'Escape' && ks === 'Escape');
}
