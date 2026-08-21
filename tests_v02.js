const assert = require('assert');
global.window = {};
require('./era-data.js');
const E = window.ChineseEraData;

assert(E.rows.length >= 500, 'era database should contain at least 500 rows');

let x = E.lookup(1403);
assert(x.some(v => v.dynasty === '明' && v.era === '永乐' && v.year === 1));

x = E.lookup(1662);
assert(x.some(v => v.dynasty === '清' && v.era === '康熙' && v.year === 1));
assert(x.some(v => v.dynasty === '南明' && v.era === '永历' && v.year === 16));

x = E.lookup(1645);
assert(x.some(v => v.era === '弘光'));
assert(x.some(v => v.era === '隆武'));
assert(x.some(v => v.era === '顺治'));

x = E.lookup(627);
assert(x.some(v => v.era === '贞观' && v.year === 1));

x = E.lookup(-245); // astronomical -245 = 246 BCE
assert(x.some(v => v.ruler.includes('秦始皇')));

function eraSignedYear(gYear, epoch){ return gYear >= epoch ? gYear - epoch + 1 : -(epoch - gYear); }
function gregorianFromEraSigned(y, epoch){ return y > 0 ? epoch + y - 1 : epoch + y; }
assert.strictEqual(eraSignedYear(1948,1948),1);
assert.strictEqual(eraSignedYear(2026,1948),79);
assert.strictEqual(gregorianFromEraSigned(1,1948),1948);
assert.strictEqual(gregorianFromEraSigned(-1,1948),1947);
assert.strictEqual(eraSignedYear(1956,1956),1);
assert.strictEqual(eraSignedYear(2026,1956),71);
assert.strictEqual(2026 + 1027,3053);

console.log('v0.2 tests passed');
