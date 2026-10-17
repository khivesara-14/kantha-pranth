#!/usr/bin/env node
// Run from the root of the kantha-pranth repo:  node apply-jain-changes.js
const fs = require('fs');
const PAGE = 'app/page.js', CSS = 'app/globals.css';
if (!fs.existsSync(PAGE)) { console.error('Run this from the repo root (app/page.js not found).'); process.exit(1); }
let s = fs.readFileSync(PAGE, 'utf8');
const W = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const report = [];

// 1. Replace the three Unsplash stock photos with Jain photos (Wikimedia Commons)
const photos = [
  ['photo-1511632765486', W + 'Shravanabelagola_Bahubali_wideframe.jpg?width=640', 'Community card'],
  ['photo-1511795409834', W + 'Gommateshwara_statue.jpg?width=640', 'Events card'],
  ['photo-1497366754035', W + 'New_Jain_temple_in_Jaiynagar,_Bengaluru.jpg?width=640', 'Services card'],
];
for (const [id, url, label] of photos) {
  const re = new RegExp('https://images\\.unsplash\\.com/' + id + '[^"\'`\\s)]*', 'g');
  let n = 0; s = s.replace(re, () => { n++; return url; });
  report.push([n > 0, label + ' photo', n + ' replaced']);
}
const left = s.match(/https:\/\/images\.unsplash\.com\/[^"'`\s)]*/g) || [];
if (left.length) report.push([false, 'Other Unsplash URLs still present', left.join(', ')]);

// 2. Welcome greeting
let g = 0;
s = s.replace(/Namaste\s*(?:&amp;|&)\s*welcome/gi, m => { g++; return m === m.toUpperCase() ? 'JAI JINENDRA' : 'Jai Jinendra'; });
report.push([g > 0, 'Greeting "Namaste & welcome" -> "Jai Jinendra"', g + ' replaced']);

// 3. Hero emoji -> Jain emblem
let h = 0;
s = s.replace(/(className=["']hero-symbol["'][^>]*>\s*)🙏(\s*<)/g, (m, a, b) => { h++; return a + '<img src="/kantha-pranth-emblem.svg" alt="" />' + b; });
report.push([h > 0, 'Hero emoji -> emblem', h + ' replaced']);

// 4. Photo credit (CC BY-SA requires attribution)
const tail = 'Help our community grow by sharing updates, events and trusted local services.';
const credit = 'Photos: Wikimedia Commons (Ananth H V, CC BY-SA; Jayanagar Jain temple). ';
let c = 0;
if (s.includes(tail) && !s.includes('Wikimedia Commons (')) { s = s.replace(tail, credit + tail); c = 1; }
report.push([c > 0 || s.includes('Wikimedia Commons ('), 'Photo credit line', c ? 'added' : 'not found: add the credit by hand']);

fs.writeFileSync(PAGE, s);

// 5. Emblem sizing in the hero
if (fs.existsSync(CSS)) {
  let css = fs.readFileSync(CSS, 'utf8');
  if (!css.includes('.hero-symbol img')) {
    css += '\n/* Jain emblem in hero */\n.hero-symbol img{width:56px;height:56px;display:block;margin:0 auto}\n';
    fs.writeFileSync(CSS, css);
    report.push([true, 'CSS for hero emblem', 'appended to globals.css']);
  }
}
console.log('\nKantha Pranth Jain update\n');
for (const [ok, what, note] of report) console.log((ok ? '  OK   ' : '  CHECK') + '  ' + what + ': ' + note);
console.log('\nThe emblem file public/kantha-pranth-emblem.svg is replaced by unzipping.');
console.log('Review with "git diff", then commit.\n');
