// tests/helpers/test-files.js
const path = require('path');
const FILES = {
  synced: { audio: 'media/audio.mp3', lrc: 'media/synced_english.lrc' },
  plain: { audio: 'media/audio.mp3', lrc: 'media/I Wish I Could Identify That Smell.lrc' },
  translationInline: { lrc: 'media/translation_inline.lrc' },
  translationSplit: { lrc: 'media/translation_split.lrc' },
  bilingual: { lrc: 'media/synced_english.lrc', translationSpanish: 'media/spanish.lrc',  },
};

function loadFiles(page, key) {
  const files = FILES[key];
  // Use page.locator('#file-picker').setInputFiles(...)
}