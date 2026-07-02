/**
 * Build step: assemble the storefront homepage from HTML partials.
 *
 * Reads src/template.html, replaces every `<!--#include NAME-->` directive
 * with the contents of src/partials/NAME.html, and writes the result to
 * public/index.html. Vercel runs this at deploy time (see vercel.json).
 *
 * Run locally with:  node build.js
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const PARTIALS_DIR = path.join(SRC_DIR, 'partials');
const OUTPUT = path.join(__dirname, 'public', 'index.html');

const template = fs.readFileSync(path.join(SRC_DIR, 'template.html'), 'utf8');

const html = template.replace(/<!--#include\s+([\w-]+)-->/g, (match, name) => {
  const file = path.join(PARTIALS_DIR, `${name}.html`);
  if (!fs.existsSync(file)) {
    throw new Error(`build.js: missing partial "${name}" (expected ${file})`);
  }
  return fs.readFileSync(file, 'utf8').replace(/\n+$/, '') + '\n';
});

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, html);
console.log(`build.js: wrote ${OUTPUT} (${html.length} bytes)`);
