// @ts-check
'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Scans archive/semantic/ for the highest semver directory
 * and returns the URL path to the matching linebyline HTML file.
 *
 * Pattern: archive/semantic/X.X.X/linebyline-X.X.X.html
 * where each X is a non-negative integer.
 *
 * @param {string} [archiveRoot='archive/semantic'] - Relative path from project root
 * @returns {string} URL path like /archive/semantic/0.35.18/linebyline-0.35.18.html
 */
function findLatestVersion(archiveRoot = 'archive/semantic') {
  const absRoot = path.resolve(process.cwd(), archiveRoot);

  if (!fs.existsSync(absRoot)) {
    throw new Error(`Archive directory not found: ${absRoot}`);
  }

  const entries = fs.readdirSync(absRoot, { withFileTypes: true });

  const versions = entries
    .filter(d => d.isDirectory() && /^\d+\.\d+\.\d+$/.test(d.name))
    .map(d => {
      const [major, minor, patch] = d.name.split('.').map(Number);
      return { name: d.name, major, minor, patch };
    })
    .sort((a, b) =>
      b.major - a.major || b.minor - a.minor || b.patch - a.patch
    );

  if (versions.length === 0) {
    throw new Error(`No semver directories (X.X.X) found in ${absRoot}`);
  }

  const latest = versions[0].name;
  const htmlFile = `linebyline-${latest}.html`;
  const htmlAbsPath = path.resolve(process.cwd(), archiveRoot, latest, htmlFile);

  if (!fs.existsSync(htmlAbsPath)) {
    throw new Error(
      `Version directory ${latest} exists but expected file not found: ${htmlAbsPath}`
    );
  }

  return `/${archiveRoot}/${latest}/${htmlFile}`;
}

module.exports = { findLatestVersion };