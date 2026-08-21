(function(root){
  'use strict';
  const T=root.TemporalCore,S=root.AppState,DEG=Math.PI/180,RAD=180/Math.PI;
  const q=s=>document.querySelector(s),mod=(a,n)=>((a%n)+n)%n,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const pad=n=>String(Math.floor(n)).padStart(2,'0');
  let timer=null,currentLocation=null,visible=true,orbitView={scale:1,x:0,y:0},orbitDrag=null;

  function solarPosition(date,loc){
    const p=T.zoneParts(date,loc.timezone,loc.utcOffsetMinutes),start=Date.UTC(p.year,0,0),current=Date.UTC(p.year,p.month-1,p.day),day=(current-start)/86400000;
    const localMinutes=p.hour*60+p.minute+p.second/60,yearLength=new Date(Date.UTC(p.year,1,29)).getUTCDate()===29?366:365;
    const gamma=2*Math.PI/yearLength*(day-1+(localMinutes/60-12)/24);
    const eqtime=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
    const decl=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
    const offset=T.zoneOffsetMinutes(date,loc.timezone)??loc.utcOffsetMinutes??T.approxOffsetMinutes(loc.lon);
    const trueSolar=mod(localMinutes+eqtime+4*loc.lon-offset,1440),hourAngle=(trueSolar/4-180)*DEG,lat=loc.lat*DEG;
    const cosZen=clamp(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(hourAngle),-1,1),altitude=90-Math.acos(cosZen)*RAD;
    const azimuth=mod(Math.atan2(Math.sin(hourAngle),Math.cos(hourAngle)*Math.sin(lat)-Math.tan(decl)*Math.cos(lat))*RAD+180,360);
    return {altitude,azimuth,declination:decl*RAD,equationOfTime:eqtime,trueSolar,hourAngle:hourAngle*RAD,parts:p};
  }
  function polar(cx,cy,r,deg){const a=(deg-90)*DEG;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];}
  function esc(x){return String(x).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function fmtSolar(minutes){return `${pad(minutes/60)}:${pad(minutes%60)}:${pad((minutes-Math.floor(minutes))*60)}`;}

  function sundialSvg(pos,loc){
    const cx=300,cy=265,rx=224,ry=clamp(106+Math.abs(loc.lat)*.35,106,136),hemi=loc.lat>=0?'北半球':'南半球',face=pos.declination>=0?'北晷面':'南晷面',daylight=pos.altitude>0;
    const plateRotation=(loc.lat>=0?7:-7)+(face==='南晷面'?2:-2),rotation=plateRotation*DEG;
    const project=(angle,scale=1)=>{const a=(angle-90)*DEG,x=rx*scale*Math.cos(a),y=ry*scale*Math.sin(a);return [cx+x*Math.cos(rotation)-y*Math.sin(rotation),cy+x*Math.sin(rotation)+y*Math.cos(rotation)];};
    const shadowAngle=mod(pos.hourAngle+(loc.lat<0?180:0),360),shadowScale=daylight?clamp(.28+.62/Math.max(.75,Math.tan(pos.altitude*DEG)),.38,.9):0,tip=project(shadowAngle+180,shadowScale);
    const sunX=clamp(300-235*Math.sin(pos.azimuth*DEG),76,524),sunY=clamp(96-38*Math.sin(Math.max(0,pos.altitude)*DEG),48,104),ticks=[];
    const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    for(let i=0;i<24;i++){
      const deg=i*15,p1=project(deg,i%2?.38:.3),p2=project(deg,.9);ticks.push(`<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" class="sd-tick ${i%2?'minor':'major'}"/>`);
      if(i%2===0){const t=project(deg,.72);ticks.push(`<text x="${t[0].toFixed(1)}" y="${(t[1]+5).toFixed(1)}" class="sd-hour">${branches[i/2]}</text>`);}
    }
    const axisSign=loc.lat>=0?1:-1,axisTop=[cx+axisSign*(76+Math.cos(Math.abs(loc.lat)*DEG)*16),cy-178],axisBottom=[cx,cy];
    const dx=axisTop[0]-axisBottom[0],dy=axisTop[1]-axisBottom[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,px=-uy,py=ux;
    const body=[
      [axisBottom[0]+px*9,axisBottom[1]+py*9],[axisTop[0]+px*5,axisTop[1]+py*5],
      [axisTop[0]-px*5,axisTop[1]-py*5],[axisBottom[0]-px*9,axisBottom[1]-py*9]
    ].map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');
    const spear=[axisTop[0]+ux*22,axisTop[1]+uy*22],spearLeft=[axisTop[0]+px*10-ux*2,axisTop[1]+py*10-uy*2],spearRight=[axisTop[0]-px*10-ux*2,axisTop[1]-py*10-uy*2];
    const shadow=daylight?`<path d="M ${cx} ${cy} Q ${(cx+tip[0])*.5+10} ${(cy+tip[1])*.5+5} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}" class="sd-shadow soft"/><path d="M ${cx} ${cy} Q ${(cx+tip[0])*.5+10} ${(cy+tip[1])*.5+5} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}" class="sd-shadow core"/>`:'';
    const illumination=daylight?`<path d="M ${sunX.toFixed(1)} ${sunY.toFixed(1)} L ${axisTop[0].toFixed(1)} ${axisTop[1].toFixed(1)} L ${tip[0].toFixed(1)} ${tip[1].toFixed(1)} Z" fill="url(#sdLightCone)"/><line x1="${sunX.toFixed(1)}" y1="${sunY.toFixed(1)}" x2="${cx}" y2="${cy}" class="sd-ray"/>`:'';
    return `<svg viewBox="0 0 600 470" aria-hidden="true">
      <defs>
        <radialGradient id="sdPlate" cx="36%" cy="24%"><stop offset="0" stop-color="#fbf5df"/><stop offset=".52" stop-color="#ded8bf"/><stop offset=".84" stop-color="#bbb49e"/><stop offset="1" stop-color="#928b7a"/></radialGradient>
        <linearGradient id="sdRim" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c7c1aa"/><stop offset=".35" stop-color="#8e8777"/><stop offset=".72" stop-color="#5a554d"/><stop offset="1" stop-color="#343c3d"/></linearGradient>
        <linearGradient id="sdBronze" x1="0" x2="1"><stop stop-color="#4a2709"/><stop offset=".22" stop-color="#9b5e16"/><stop offset=".48" stop-color="#f2cb72"/><stop offset=".67" stop-color="#b27320"/><stop offset="1" stop-color="#4b290b"/></linearGradient>
        <linearGradient id="sdBronzeDark" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b77824"/><stop offset="1" stop-color="#3a230f"/></linearGradient>
        <linearGradient id="sdBaseStone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#76756c"/><stop offset=".3" stop-color="#53554f"/><stop offset="1" stop-color="#252d2e"/></linearGradient>
        <linearGradient id="sdLightCone" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd875" stop-opacity=".22"/><stop offset="1" stop-color="#f6c65b" stop-opacity="0"/></linearGradient>
        <radialGradient id="sdSun"><stop stop-color="#fffde0"/><stop offset=".4" stop-color="#ffd96d"/><stop offset="1" stop-color="#d98520"/></radialGradient>
        <filter id="sdBlur"><feGaussianBlur stdDeviation="6"/></filter><filter id="sdSunGlow"><feGaussianBlur stdDeviation="13"/></filter><filter id="sdObjectShadow"><feGaussianBlur stdDeviation="13"/></filter>
      </defs>
      <style>.sd-tick{stroke:#675f51;stroke-width:1.05}.sd-tick.minor{opacity:.38}.sd-tick.major{stroke-width:1.5;opacity:.7}.sd-hour{font:600 15px serif;fill:#292b28;text-anchor:middle}.sd-cardinal{font:700 14px sans-serif;fill:#e5eeee;text-anchor:middle}.sd-meta{font:11px sans-serif;fill:#a9bec4}.sd-shadow{fill:none;stroke:#151b1b;stroke-linecap:round}.sd-shadow.core{stroke-width:11;opacity:.72}.sd-shadow.soft{stroke-width:31;opacity:.3;filter:url(#sdBlur)}.sd-ray{stroke:#ffe08b;stroke-width:1.4;opacity:.84}.sd-orientation{stroke:#a9bdc2;stroke-width:1;stroke-dasharray:4 4;opacity:.62}</style>
      <text x="18" y="27" class="sd-meta">${esc(loc.name||'自定义地点')} · ${hemi} · ${face}</text><text x="582" y="27" text-anchor="end" class="sd-meta">纬度 ${Math.abs(loc.lat).toFixed(4)}°${loc.lat>=0?'N':'S'} · 晷面倾角 ${(90-Math.abs(loc.lat)).toFixed(1)}°</text>
      <ellipse cx="300" cy="424" rx="194" ry="34" fill="#020b11" opacity=".55" filter="url(#sdObjectShadow)"/>
      <g id="sdPedestal"><ellipse cx="300" cy="438" rx="96" ry="19" fill="#060d10" opacity=".62"/><path d="M207 414 L393 414 L393 435 Q300 459 207 435 Z" fill="url(#sdBaseStone)" stroke="#303838" stroke-width="2.5"/><ellipse cx="300" cy="414" rx="93" ry="20" fill="#66665e" stroke="#aaa693" stroke-width="2"/><path d="M276 366 Q300 355 324 366 L332 415 Q300 428 268 415 Z" fill="url(#sdBronzeDark)" stroke="#44280e" stroke-width="2.5"/><ellipse cx="300" cy="367" rx="25" ry="10" fill="url(#sdBronze)" stroke="#4a2b10" stroke-width="2"/><ellipse cx="300" cy="410" rx="33" ry="11" fill="#4c2e13" stroke="#b4772a" stroke-width="2"/></g>
      ${illumination}
      <ellipse cx="${cx}" cy="${cy+22}" rx="${rx}" ry="${ry}" transform="rotate(${plateRotation} ${cx} ${cy+22})" fill="url(#sdRim)" stroke="#55574f" stroke-width="3"/>
      <ellipse id="sdStone" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${plateRotation} ${cx} ${cy})" fill="url(#sdPlate)" stroke="#e6e0ca" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx-14}" ry="${ry-9}" transform="rotate(${plateRotation} ${cx} ${cy})" fill="none" stroke="#625d52" stroke-width="1.4" opacity=".72"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx-34}" ry="${ry-22}" transform="rotate(${plateRotation} ${cx} ${cy})" fill="none" stroke="#827968" stroke-width="1.1" opacity=".7"/>
      ${ticks.join('')}${shadow}
      <ellipse cx="${cx}" cy="${cy}" rx="48" ry="${Math.max(24,ry*.31).toFixed(1)}" transform="rotate(${plateRotation} ${cx} ${cy})" fill="none" stroke="#716957" opacity=".42"/>
      <g id="sdGnomonBody"><polygon points="${body}" fill="url(#sdBronze)" stroke="#4a2c0f" stroke-width="2"/><line x1="${(axisBottom[0]+px*2).toFixed(1)}" y1="${(axisBottom[1]+py*2).toFixed(1)}" x2="${(axisTop[0]+px*1.5).toFixed(1)}" y2="${(axisTop[1]+py*1.5).toFixed(1)}" stroke="#ffe29a" stroke-width="2" opacity=".78"/><polygon id="sdGnomonTip" points="${spear[0].toFixed(1)},${spear[1].toFixed(1)} ${spearLeft[0].toFixed(1)},${spearLeft[1].toFixed(1)} ${spearRight[0].toFixed(1)},${spearRight[1].toFixed(1)}" fill="url(#sdBronze)" stroke="#4a2c0f" stroke-width="2"/></g>
      <g id="sdGnomonCollar"><ellipse cx="${cx}" cy="${cy+6}" rx="19" ry="10" fill="#4b2b0d" opacity=".8"/><ellipse cx="${cx}" cy="${cy}" rx="18" ry="10" fill="url(#sdBronze)" stroke="#4b2b0d" stroke-width="2"/><ellipse cx="${cx}" cy="${cy-2}" rx="9" ry="5" fill="#e1b052"/></g>
      <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="39" fill="#efac36" opacity="${daylight?.2:.05}" filter="url(#sdSunGlow)"/><circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="16" fill="url(#sdSun)" opacity="${daylight?1:.3}"/><text x="${sunX.toFixed(1)}" y="${(sunY+32).toFixed(1)}" text-anchor="middle" class="sd-meta">太阳</text>
      <line x1="300" y1="49" x2="300" y2="112" class="sd-orientation"/><text x="300" y="42" class="sd-cardinal">${loc.lat>=0?'北':'南'}</text><text x="300" y="462" class="sd-cardinal">${loc.lat>=0?'南':'北'}</text><text x="56" y="282" class="sd-cardinal">东</text><text x="544" y="282" class="sd-cardinal">西</text>
      ${daylight?'':`<g><rect x="190" y="220" width="220" height="56" rx="12" fill="#071d2c" opacity=".9"/><text x="300" y="244" text-anchor="middle" fill="#d7e6e7" font-size="13">太阳位于地平线下</text><text x="300" y="263" text-anchor="middle" fill="#849fa9" font-size="10">当前没有可读日影</text></g>`}
    </svg>`;
  }

  function solveOrbit(meanDeg,e,a,periDeg){let M=mod(meanDeg-periDeg,360)*DEG,E=M;for(let i=0;i<7;i++)E-= (E-e*Math.sin(E)-M)/(1-e*Math.cos(E));const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E),p=periDeg*DEG;return {x:x*Math.cos(p)-y*Math.sin(p),y:x*Math.sin(p)+y*Math.cos(p)};}
  function orbitalState(date){const d=(date.getTime()-Date.UTC(2000,0,1,12))/86400000,earth=solveOrbit(100.46435+.985609101*d,.01671,1,102.93768),mars=solveOrbit(355.45332+.524033035*d,.0934,1.52368,336.061);return {d,earth,mars,moon:mod(218.316+13.176396*d,360),phobos:mod(35+360*d/(7.653/24),360),deimos:mod(160+360*d/(30.298/24),360)};}
  function orbitPoint(cx,cy,rx,ry,p){return [cx+p.x*rx,cy+p.y*ry];}
  function orbitsSvg(state,date){
    const cx=300,cy=225,earth=orbitPoint(cx,cy,112,58,state.earth),mars=orbitPoint(cx,cy,168,88,{x:state.mars.x/1.52368,y:state.mars.y/1.52368});
    const moon=polar(earth[0],earth[1],24,state.moon),phobos=polar(mars[0],mars[1],17,state.phobos),deimos=polar(mars[0],mars[1],28,state.deimos),iso=date.toISOString().replace('T',' ').slice(0,19)+' UTC';
    return `<svg viewBox="0 0 600 470" aria-hidden="true"><defs><radialGradient id="orbSun"><stop stop-color="#fff5b6"/><stop offset=".4" stop-color="#efb54d"/><stop offset="1" stop-color="#bd6d22"/></radialGradient><radialGradient id="orbEarth"><stop stop-color="#83d9db"/><stop offset=".55" stop-color="#337e9a"/><stop offset="1" stop-color="#173d59"/></radialGradient><radialGradient id="orbMars"><stop stop-color="#eba67b"/><stop offset=".55" stop-color="#b86143"/><stop offset="1" stop-color="#71352c"/></radialGradient><filter id="orbGlow"><feGaussianBlur stdDeviation="9"/></filter></defs><style>.orb-label{font:11px sans-serif;fill:#bad0d5}.orb-small{font:9px sans-serif;fill:#8ba6ae}.orb-path{fill:none;stroke:#577787;stroke-width:1}.orb-guide{fill:none;stroke:#456675;stroke-width:1;stroke-dasharray:4 5}</style><text x="16" y="27" class="orb-small">${iso}</text><ellipse cx="${cx}" cy="${cy}" rx="112" ry="58" class="orb-path"/><ellipse cx="${cx}" cy="${cy}" rx="168" ry="88" class="orb-guide"/><text x="382" y="151" class="orb-small">地球轨道</text><text x="445" y="340" class="orb-small">火星轨道</text><circle cx="${cx}" cy="${cy}" r="42" fill="#d8912e" opacity=".2" filter="url(#orbGlow)"/><circle cx="${cx}" cy="${cy}" r="23" fill="url(#orbSun)"/><text x="${cx}" y="${cy+42}" text-anchor="middle" class="orb-label">太阳</text><circle cx="${earth[0].toFixed(1)}" cy="${earth[1].toFixed(1)}" r="15" fill="url(#orbEarth)"/><ellipse cx="${earth[0].toFixed(1)}" cy="${earth[1].toFixed(1)}" rx="27" ry="16" class="orb-path"/><circle cx="${moon[0].toFixed(1)}" cy="${moon[1].toFixed(1)}" r="4.5" fill="#d2d8d5"/><text x="${earth[0].toFixed(1)}" y="${(earth[1]+28).toFixed(1)}" text-anchor="middle" class="orb-label">地球</text><text x="${(moon[0]+6).toFixed(1)}" y="${(moon[1]-7).toFixed(1)}" class="orb-small">月球</text><circle cx="${mars[0].toFixed(1)}" cy="${mars[1].toFixed(1)}" r="13" fill="url(#orbMars)"/><ellipse cx="${mars[0].toFixed(1)}" cy="${mars[1].toFixed(1)}" rx="18" ry="10" class="orb-path"/><ellipse cx="${mars[0].toFixed(1)}" cy="${mars[1].toFixed(1)}" rx="29" ry="16" class="orb-guide"/><circle cx="${phobos[0].toFixed(1)}" cy="${phobos[1].toFixed(1)}" r="3.4" fill="#c7b5a5"/><circle cx="${deimos[0].toFixed(1)}" cy="${deimos[1].toFixed(1)}" r="3" fill="#9e9790"/><text x="${mars[0].toFixed(1)}" y="${(mars[1]+26).toFixed(1)}" text-anchor="middle" class="orb-label">火星</text><text x="${(phobos[0]+5).toFixed(1)}" y="${(phobos[1]-5).toFixed(1)}" class="orb-small">火卫一</text><text x="${(deimos[0]+5).toFixed(1)}" y="${(deimos[1]+10).toFixed(1)}" class="orb-small">火卫二</text></svg>`;
  }

  function applyOrbitTransform(){
    const stage=q('#realtimeOrbits'),svg=stage?.querySelector('svg'),value=q('#orbitZoomValue');
    if(svg)svg.style.transform=`translate3d(${orbitView.x.toFixed(2)}px,${orbitView.y.toFixed(2)}px,0) scale(${orbitView.scale.toFixed(4)})`;
    if(value)value.textContent=`${Math.round(orbitView.scale*100)}%`;
  }
  function zoomOrbits(nextScale,clientX,clientY){
    const stage=q('#realtimeOrbits');if(!stage)return;
    const rect=stage.getBoundingClientRect(),oldScale=orbitView.scale,newScale=clamp(nextScale,.65,8),ratio=newScale/oldScale;
    const anchorX=Number.isFinite(clientX)?clientX-rect.left:rect.width/2,anchorY=Number.isFinite(clientY)?clientY-rect.top:rect.height/2;
    orbitView.x=anchorX-(anchorX-orbitView.x)*ratio;orbitView.y=anchorY-(anchorY-orbitView.y)*ratio;orbitView.scale=newScale;applyOrbitTransform();
  }
  function resetOrbitView(){orbitView={scale:1,x:0,y:0};applyOrbitTransform();}
  function initOrbitInteraction(){
    const stage=q('#realtimeOrbits');if(!stage||stage.dataset.zoomReady)return;stage.dataset.zoomReady='true';
    stage.addEventListener('wheel',e=>{e.preventDefault();zoomOrbits(orbitView.scale*Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);},{passive:false});
    stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;orbitDrag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:orbitView.x,y:orbitView.y};stage.setPointerCapture?.(e.pointerId);stage.classList.add('is-panning');});
    stage.addEventListener('pointermove',e=>{if(!orbitDrag||orbitDrag.id!==e.pointerId)return;orbitView.x=orbitDrag.x+e.clientX-orbitDrag.startX;orbitView.y=orbitDrag.y+e.clientY-orbitDrag.startY;applyOrbitTransform();});
    const endDrag=e=>{if(!orbitDrag||orbitDrag.id!==e.pointerId)return;orbitDrag=null;stage.classList.remove('is-panning');};stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
    stage.addEventListener('dblclick',resetOrbitView);stage.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();zoomOrbits(orbitView.scale*1.25);}else if(e.key==='-'){e.preventDefault();zoomOrbits(orbitView.scale/1.25);}else if(e.key==='0'){e.preventDefault();resetOrbitView();}});
    document.querySelectorAll('[data-orbit-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.orbitAction;if(action==='in')zoomOrbits(orbitView.scale*1.25);else if(action==='out')zoomOrbits(orbitView.scale/1.25);else resetOrbitView();}));
  }

  function update(){
    if(!visible)return;const sundial=q('#realtimeSundial'),orbits=q('#realtimeOrbits');if(!sundial||!orbits)return;
    const loc=currentLocation||S?.get?.('location')||T.loadLocation(),date=new Date(),pos=solarPosition(date,loc),daylight=pos.altitude>0;
    sundial.innerHTML=sundialSvg(pos,loc);orbits.innerHTML=orbitsSvg(orbitalState(date),date);applyOrbitTransform();
    q('#sundialAltitude').textContent=`${pos.altitude.toFixed(1)}°`;q('#sundialAzimuth').textContent=`${pos.azimuth.toFixed(1)}°`;
    q('#sundialShadowRatio').textContent=daylight?(1/Math.tan(pos.altitude*DEG)).toFixed(2):'无日影';q('#sundialSolarTime').textContent=fmtSolar(pos.trueSolar);
    q('#sundialNote').textContent=daylight?`${loc.name||'当前地点'} · ${loc.lat>=0?'北半球':'南半球'} · 立体赤道式示意；太阳、晷面倾角与日影按当地时空计算。`:`${loc.name||'当前地点'}当前为夜间；日出后恢复显示太阳入射光与晷针日影。`;
  }
  function schedule(){clearTimeout(timer);if(!visible)return;const delay=1000-(Date.now()%1000)+20;timer=setTimeout(()=>{update();schedule();},delay);}
  function init(){if(!T)return;currentLocation=S?.get?.('location')||T.loadLocation();S?.subscribe?.('location',loc=>{currentLocation=loc;update();});document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible){update();schedule();}else clearTimeout(timer);});initOrbitInteraction();update();schedule();root.AstronomyRealtime={solarPosition,orbitalState,zoomOrbits,resetOrbitView,update};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
