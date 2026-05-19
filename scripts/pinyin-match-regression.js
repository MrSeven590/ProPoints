// Minimal regression check for MrS590-pinyin-match dictionary correctness.
// Run: node scripts/pinyin-match-regression.js
// Note: this script parses the UTS dict source directly (Node can't import .uts).

'use strict';

const fs = require('fs');

const utsPath = 'uni_modules/MrS590-pinyin-match/utssdk/pinyin-match.uts';
const text = fs.readFileSync(utsPath, 'utf8');

const re = /SIMPLIFIED_DICT\.set\("(.*?)",\s*"(.*?)"\)/g;
const charToPinyins = new Map();

let m;
while ((m = re.exec(text)) !== null) {
  const py = m[1];
  const chars = m[2];
  for (const ch of chars) {
    const arr = charToPinyins.get(ch);
    if (arr) arr.push(py);
    else charToPinyins.set(ch, [py]);
  }
}

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  }
}

const guangPys = Array.from(new Set(charToPinyins.get('广') || [])).sort();
const zhouPys = Array.from(new Set(charToPinyins.get('州') || [])).sort();

console.log('广 ->', guangPys);
console.log('州 ->', zhouPys);

// Guard against the reported bug: 广 should not map to an.
assert(!guangPys.includes('an'), 'Dictionary error: "广" unexpectedly mapped to "an"');
assert(guangPys.includes('guang'), 'Dictionary error: "广" must include "guang"');
assert(zhouPys.includes('zhou'), 'Dictionary error: "州" must include "zhou"');

if (!process.exitCode) {
  console.log('OK');
}
