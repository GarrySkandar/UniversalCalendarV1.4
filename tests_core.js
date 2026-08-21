const C=require('./calendar-core.js').CalendarCore;
let fails=0;
function same(a,b){return a.year===b.year&&a.month===b.month&&a.day===b.day}
function check(name,ok,detail=''){if(!ok){fails++;console.error('FAIL',name,detail)}else console.log('OK',name)}
check('JDN 2000-01-01',C.gregorianToJdn(2000,1,1)===2451545);
check('Julian 1582-10-04',C.julianToJdn(1582,10,4)===2299160);
check('Hebrew New Year 5785',same(C.jdnToGregorian(C.hebrewToJdn(5785,7,1)),{year:2024,month:10,day:3}));
check('Persian 1403 New Year',same(C.jdnToGregorian(C.persianToJdn(1403,1,1)),{year:2024,month:3,day:20}));
check('Coptic 1741 New Year',same(C.jdnToGregorian(C.alexToJdn(C.COPTIC_EPOCH,1741,1,1)),{year:2024,month:9,day:11}));
check('Ethiopic 2017 New Year',same(C.jdnToGregorian(C.alexToJdn(C.ETHIOPIC_EPOCH,2017,1,1)),{year:2024,month:9,day:11}));
check('Indian Civil 1946 New Year',same(C.jdnToGregorian(C.indianToJdn(1946,1,1)),{year:2024,month:3,day:21}));
check('Mayan 13.0.0.0.0',JSON.stringify(C.mayanFromJdn(C.gregorianToJdn(2012,12,21)))===JSON.stringify({baktun:13,katun:0,tun:0,uinal:0,kin:0}));
for(const y of [-4700,-1000,0,1,1582,2026,2500,3000,5000]){
  const j=C.gregorianToJdn(y,12,31); check(`Gregorian round-trip ${y}`,same(C.jdnToGregorian(j),{year:y,month:12,day:31}),C.jdnToGregorian(j));
}
console.log(fails?`${fails} failure(s)`:'All core tests passed');
process.exitCode=fails?1:0;
