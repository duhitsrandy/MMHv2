const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const README_PATH = path.join(DOCS_DIR, 'README.md');

function getDocFiles() {
  return fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort((a, b) => a.localeCompare(b));
}

function makeTitle(filename) {
  // Remove extension, replace dashes/underscores with spaces, capitalize
  const base = filename.replace(/\.md$/, '');
  return base
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function generateIndex(files) {
  const lines = [
    '# Documentation Index',
    '',
    'Welcome to the documentation for **Meet Me Halfway v2**! All project documentation is now organized in this `docs/` directory for easy access.',
    '',
    '## Table of Contents',
    '',
    ...files.map(f => `- [${makeTitle(f)}](${f})`),
    '',
    '## How to Use',
    '- Each document covers a specific area of the app or its infrastructure.',
    '- Start with **App Structure** for an overview, then dive into specific topics as needed.',
    '- If you add new documentation, please update this index (or re-run this script)!',
    '',
    '---',
    '',
    'For general project setup, see the main [README.md](../README.md) in the project root.',
    ''
  ];
  return lines.join('\n');
}

function main() {
  const files = getDocFiles();
  const content = generateIndex(files);
  fs.writeFileSync(README_PATH, content, 'utf8');
  console.log(`✅ docs/README.md updated with ${files.length} entries.`);
}

main(); 