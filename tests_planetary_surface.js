const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const globeJs=fs.readFileSync('ui/planetary-surface-globe.js','utf8');
const pageJs=fs.readFileSync('ui/pages/planetary-calendar-pages.js','utf8');
function ok(condition,message){if(!condition)throw new Error(`FAIL: ${message}`);console.log(`OK: ${message}`);}

const sandbox={window:{},setTimeout};
vm.createContext(sandbox);vm.runInContext(globeJs,sandbox);
const G=sandbox.window.PlanetarySurfaceGlobe;
ok(G&&typeof G.create==='function','surface globe module loads');

const projected=G.projectPoint(20,30,10,15);
const restored=G.unprojectPoint(projected.x,projected.y,10,15);
ok(projected.z>0&&Math.abs(restored.lat-20)<1e-9&&Math.abs(restored.lon-30)<1e-9,'orthographic projection round-trips visible coordinates');
ok(G.illuminationAt(0,0,0,0).state==='day','subsolar point is in daylight');
ok(G.illuminationAt(0,180,0,0).state==='night','antipode is in night');
ok(G.illuminationAt(0,90,0,0).state==='terminator','90-degree point is on terminator');
const marsNoon=G.marsSubsolarPoint('12:00:00',0),marsMidnight=G.marsSubsolarPoint('00:00:00',90);
ok(Math.abs(marsNoon.lat)<1e-9&&Math.abs(marsNoon.lon)<1e-9,'Mars AMT noon and Ls zero place subsolar point at Airy equator');
ok(Math.abs(Math.abs(marsMidnight.lon)-180)<1e-9&&marsMidnight.lat>24&&marsMidnight.lat<26,'Mars AMT and Ls derive night-side longitude and seasonal declination');

const gradient={addColorStop:()=>{}},context={createRadialGradient:()=>gradient,fillRect:()=>{},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{},save:()=>{},restore:()=>{},beginPath:()=>{},arc:()=>{},stroke:()=>{},fill:()=>{},setLineDash:()=>{},moveTo:()=>{},lineTo:()=>{},fillText:()=>{}};
const canvas={width:0,height:0,style:{},dataset:{},getContext:()=>context,getBoundingClientRect:()=>({width:360,height:320,left:0,top:0}),addEventListener:()=>{},setAttribute:()=>{}};
const rendered=G.create(canvas,{body:'moon',lat:0,lon:0});rendered.draw();
ok(canvas.width===360&&canvas.height===320&&rendered.getState().earthSide==='near','procedural Moon globe renders and identifies Earth-facing hemisphere');

for(const id of ['lunarSurfaceGlobe','marsSurfaceGlobe','lunarSurfaceCoordinates','lunarSurfaceEarthSide','lunarSurfaceLight','marsSurfaceCoordinates','marsSurfaceLight','marsSurfaceSubsolar','marsLat'])ok(html.includes(`id="${id}"`),`surface UI includes ${id}`);
ok(html.includes('ui/planetary-surface-globe.js?v=1.4.0'),'surface globe asset is loaded');
ok(pageJs.includes("$('#calculateLunar')?.click()")&&pageJs.includes("$('#calculateMars')?.click()"),'surface picks trigger calendar recalculation');
ok(pageJs.includes('subsolar_latitude_deg')&&pageJs.includes('marsSubsolarPoint'),'Moon and Mars daylight regions consume computed solar geometry');
console.log('Planetary surface picker tests passed.');
